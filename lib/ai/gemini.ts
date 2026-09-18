/**
 * Gemini provider (via Google's OpenAI-compatible endpoint).
 *
 * Google exposes an OpenAI-compatible API at
 * `https://generativelanguage.googleapis.com/v1beta/openai/`, so the
 * existing OpenAI SDK (and all agents) work unchanged — only the base URL,
 * key, and model differ.
 *
 * Unlike OpenAI's strict structured outputs, the compat layer is not relied
 * on for schema enforcement: we request `json_object` mode and validate
 * locally with the agent's Zod schema, throwing detailed validation errors
 * (surfaced in server logs) on mismatch.
 */
import OpenAI from "openai";
import { toJSONSchema } from "zod";
import type { LLMProvider, StructuredCallOpts } from "./provider";

const COMPAT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

let singleton: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  if (!singleton) {
    singleton = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: COMPAT_BASE_URL,
    });
  }
  return singleton;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
}

/** Strips markdown fences models sometimes wrap around JSON output. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
}

/**
 * Renders the agent's Zod schema as a compact JSON Schema hint for the model.
 * The compat endpoint can't enforce schemas server-side, so showing exact
 * property names and types prevents key drift (e.g. `painThemes` instead of
 * `pains`) and type drift (objects where strings are expected).
 */
function shapeHint(schema: StructuredCallOpts["schema"]): string {
  try {
    return JSON.stringify(toJSONSchema(schema as never));
  } catch {
    return "";
  }
}

function validationDetails(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .slice(0, 8)
    .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";

  async completeStructured<T>(opts: StructuredCallOpts): Promise<T> {
    const label = opts.agent ?? "unknown-agent";
    const model = getGeminiModel();
    const hint = shapeHint(opts.schema);
    const basePrompt =
      opts.user +
      "\n\nReturn ONLY a single valid JSON object. No markdown fences, no commentary." +
      (hint ? ` It MUST use exactly these property names and types: ${hint}` : "");
    console.log(`[agent:${label}] Gemini request started (model=${model}, schema=${opts.schemaName})`);
    const started = Date.now();

    // Up to 2 attempts: if the first output fails local Zod validation, retry
    // once with the validation errors fed back — this fixes key/type drift.
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await this.attempt<T>(opts, basePrompt, lastError, label);
        console.log(
          `[agent:${label}] Gemini call succeeded in ${Date.now() - started}ms (parsed OK, attempt=${attempt})`,
        );
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Only validation-shaped failures (bad JSON / schema mismatch) get
        // the feedback retry. Transport errors already had their 429 backoff.
        if (attempt === 1 && !(err as { transportError?: boolean }).transportError) {
          console.log(`[agent:${label}] attempt 1 failed, retrying with validation feedback: ${lastError.message}`);
        } else {
          break;
        }
      }
    }
    throw lastError ?? new Error("Gemini call failed.");
  }

  private async attempt<T>(
    opts: StructuredCallOpts,
    basePrompt: string,
    previousError: Error | null,
    label: string,
  ): Promise<T> {
    const started = Date.now();
    // Inner retry loop for 429 rate limits only: honor the server's
    // retry delay (free tier is 5 req/min, and our 4 workers fire at once).
    // Validation errors skip this loop and go to the outer validation retry.
    let content: string | null | undefined;
    let finishReason: string | undefined;
    let lastRateLimit: unknown = null;
    for (let call = 1; call <= 3; call++) {
      try {
        const client = getClient();
        const completion = await client.chat.completions.create({
          model: getGeminiModel(),
          messages: [
            { role: "system", content: opts.system },
            {
              role: "user",
              content: previousError
                ? `${basePrompt}\n\nYour previous response was invalid: ${previousError.message}. Return ONLY the corrected JSON object.`
                : basePrompt,
            },
          ],
          response_format: { type: "json_object" },
          // Generous cap: on this endpoint reasoning ("thinking") tokens share
          // the output budget, and a tight cap truncates the JSON mid-string
          // (finish_reason=length). The model still stops early when done.
          max_tokens: Math.max(opts.maxTokens ?? 1200, 8192),
        });
        content = completion.choices[0]?.message?.content;
        finishReason = completion.choices[0]?.finish_reason;
        lastRateLimit = null;
        break;
      } catch (err) {
        if (!isRateLimit(err) || call === 3) {
          // Network / auth / quota-exhausted / model errors surface here.
          // Tagged as transport errors so the outer loop does NOT waste a
          // validation-feedback retry on them (a 429 is not a JSON problem).
          console.error(
            `[agent:${label}] Gemini API call failed after ${Date.now() - started}ms. ` +
              `Status: ${statusOf(err)}. Message: ${shortMessage(err)}`,
          );
          throw Object.assign(err instanceof Error ? err : new Error(String(err)), {
            transportError: true,
          });
        }
        lastRateLimit = err;
        const waitMs = retryDelayMs(err) ?? 5000;
        console.log(`[agent:${label}] rate-limited (429), waiting ${Math.round(waitMs / 1000)}s before retry ${call + 1}/3`);
        await sleep(waitMs);
      }
    }
    if (lastRateLimit) throw lastRateLimit;

    if (!content) {
      const reason = "Gemini returned empty content.";
      console.error(`[agent:${label}] ${reason}`);
      throw new Error(reason);
    }

    let data: unknown;
    try {
      data = JSON.parse(extractJson(content));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(
        `[agent:${label}] Gemini output was not valid JSON (${content.length} chars, finish=${finishReason}): ${reason}. ` +
          `Head: ${content.slice(0, 200)} | Tail: ${content.slice(-200)}`,
      );
      throw new Error(`Gemini output was not valid JSON: ${reason}`);
    }

    const parsed = opts.schema.safeParse(data);
    if (!parsed.success) {
      const details = validationDetails(parsed.error);
      console.error(`[agent:${label}] Gemini JSON failed Zod validation: ${details}`);
      throw new Error(`Gemini output failed validation: ${details}`);
    }

    return parsed.data as T;
  }
}

function statusOf(err: unknown): string {
  if (err instanceof OpenAI.APIError) return String(err.status);
  return "n/a";
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts the server's "retry in Ns" hint from a 429 error message.
 * Capped so one throttled agent can't stall the pipeline for minutes.
 */
function retryDelayMs(err: unknown, capMs = 60_000): number | null {
  const match = messageOf(err).match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  return Math.min(Math.ceil(parseFloat(match[1]) * 1000) + 1000, capMs);
}

function isRateLimit(err: unknown): boolean {
  return err instanceof OpenAI.APIError && err.status === 429;
}

/** Short one-line version of an API error for logs (429 bodies are huge). */
function shortMessage(err: unknown, max = 300): string {
  const full = messageOf(err);
  return full.length > max ? `${full.slice(0, max)}…` : full;
}
