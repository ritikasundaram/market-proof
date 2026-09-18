/**
 * LLM provider interface.
 *
 * Agents depend only on this interface. Gemini is the default implementation
 * (OpenAI also implemented, Anthropic stubbed) — adding another provider
 * means writing one new file that satisfies this contract, no agent changes.
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
  /**
   * Agent name for diagnostics (e.g. "competitor"). Used in server logs so
   * a failing agent can be identified without guessing.
   */
  agent?: string;
}

export interface LLMProvider {
  readonly name: string;
  completeStructured<T>(opts: StructuredCallOpts): Promise<T>;
}
