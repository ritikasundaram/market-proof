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
    const client = getClient();
    const completion = await client.chat.completions.parse({
      model: getOpenAIModel(),
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response_format: zodResponseFormat(opts.schema as any, opts.schemaName),
      max_tokens: opts.maxTokens ?? 1200,
    });

    const parsed = completion.choices[0]?.message?.parsed as T | undefined;
    if (!parsed) {
      const refusal = completion.choices[0]?.message?.refusal;
      throw new Error(
        refusal ? `Model refused: ${refusal}` : "Model returned no parsed output.",
      );
    }
    return parsed;
  }
}
