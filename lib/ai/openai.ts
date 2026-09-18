/**
 * OpenAI provider (MVP default).
 *
 * Uses Chat Completions `.parse()` with `zodResponseFormat`, which
 * guarantees the model output matches our Zod schema (strict structured
 * outputs). Supported by `gpt-4o-mini` and later models.
 */
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { LLMProvider, StructuredCallOpts } from "./provider";

let singleton: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  if (!singleton) {
    singleton = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return singleton;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";

  async completeStructured<T>(opts: StructuredCallOpts): Promise<T> {
    const label = opts.agent ?? "unknown-agent";
    const model = getOpenAIModel();
    console.log(`[agent:${label}] OpenAI request started (model=${model}, schema=${opts.schemaName})`);
    const started = Date.now();

    let completion;
    try {
      const client = getClient();
      completion = await client.chat.completions.parse({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response_format: zodResponseFormat(opts.schema as any, opts.schemaName),
        max_tokens: opts.maxTokens ?? 1200,
      });
    } catch (err) {
      // Network / auth / quota / model errors surface here, before parsing.
      console.error(
        `[agent:${label}] OpenAI API call failed after ${Date.now() - started}ms. ` +
          `Status: ${statusOf(err)}. Message: ${messageOf(err)}`,
      );
      throw err;
    }

    const parsed = completion.choices[0]?.message?.parsed as T | undefined;
    if (!parsed) {
      // The model refused, or output failed Zod validation against the schema.
      const refusal = completion.choices[0]?.message?.refusal;
      const reason = refusal ? `Model refused: ${refusal}` : "Model returned no parsed output (validation failed or empty).";
      console.error(`[agent:${label}] OpenAI call succeeded but produced no valid JSON. ${reason}`);
      throw new Error(reason);
    }

    console.log(`[agent:${label}] OpenAI call succeeded in ${Date.now() - started}ms (parsed OK)`);
    return parsed;
  }
}

function statusOf(err: unknown): string {
  if (err instanceof OpenAI.APIError) return String(err.status);
  return "n/a";
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
