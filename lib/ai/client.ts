/**
 * Provider factory + shared call helpers.
 *
 * - `getProvider()` reads LLM_PROVIDER (default "openai").
 * - `withTimeout()` caps every LLM call so one slow agent cannot hang
 *   the whole report. The orchestrator treats timeouts as fail-soft and
 *   substitutes a low-confidence fallback for that section.
 */
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./provider";

export const AGENT_TIMEOUT_MS = 45_000;

export function getProvider(): LLMProvider {
  const name = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  if (name === "anthropic") return new AnthropicProvider();
  return new OpenAIProvider();
}

export function getModelLabel(): string {
  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  if (provider === "anthropic") return process.env.ANTHROPIC_MODEL ?? "claude (not configured)";
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

/**
 * Fail-fast config check for the API route. Per-agent fallbacks handle
 * transient LLM errors, but a missing API key would silently produce an
 * empty report — better to tell the user what to fix.
 */
export function providerConfigError(): string | null {
  const provider = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  if (provider === "anthropic") {
    return "LLM_PROVIDER=anthropic is not implemented yet. Set LLM_PROVIDER=openai.";
  }
  if (provider !== "openai") {
    return `Unknown LLM_PROVIDER "${provider}". Supported: openai.`;
  }
  if (!process.env.OPENAI_API_KEY) {
    return "OPENAI_API_KEY is not set. Add it to .env.local (see .env.example).";
  }
  return null;
}

export async function withTimeout<T>(promise: Promise<T>, ms = AGENT_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`LLM call timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
