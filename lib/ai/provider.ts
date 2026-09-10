/**
 * LLM provider interface.
 *
 * Agents depend only on this interface. OpenAI is the MVP implementation;
 * adding Anthropic later means writing one new file that satisfies this
 * contract — no agent code changes.
 */
import type { z } from "zod";

export interface StructuredCallOpts {
  /** Per-agent system prompt (role, rules, ban-list). */
  system: string;
  /** Brief + plan + search context for this run. */
  user: string;
  /** Model-visible schema name, e.g. "competitor_output". */
  schemaName: string;
  /** Zod object schema describing the exact JSON to return. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any, any, any>;
  /** Safety cap per call; agents keep prompts small. */
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  completeStructured<T>(opts: StructuredCallOpts): Promise<T>;
}
