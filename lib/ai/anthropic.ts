/**
 * Anthropic provider stub (not implemented in MVP).
 *
 * This file exists so the swap path is obvious: implement
 * `completeStructured` with the Anthropic SDK (tool-use with strict JSON),
 * set `LLM_PROVIDER=anthropic`, and every agent works unchanged.
 */
import type { LLMProvider } from "./provider";

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";

  async completeStructured<T>(): Promise<T> {
    throw new Error(
      "Anthropic provider is not implemented yet. Set LLM_PROVIDER=gemini.",
    );
  }
}
