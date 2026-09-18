/**
 * Provider factory + shared call helpers.
 *
 * - `getProvider()` reads LLM_PROVIDER (default "gemini").
 * - `withTimeout()` caps every LLM call so one slow agent cannot hang
 *   the whole report. The orchestrator treats timeouts as fail-soft and
 *   substitutes a low-confidence fallback for that section.
 */
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./provider";

export const AGENT_TIMEOUT_MS = 120_000;

export function getProvider(): LLMProvider {
  const name = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  if (name === "anthropic") return new AnthropicProvider();
  if (name === "openai") return new OpenAIProvider();
  return new GeminiProvider();
}

export function getModelLabel(): string {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "anthropic") return process.env.ANTHROPIC_MODEL ?? "claude (not configured)";
  if (provider === "openai") return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  return process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
}

/**
 * Fail-fast config check for the API route. Per-agent fallbacks handle
 * transient LLM errors, but a missing API key would silently produce an
 * empty report — better to tell the user what to fix.
 */
export function providerConfigError(): string | null {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  if (provider === "anthropic") {
    return "LLM_PROVIDER=anthropic is not implemented yet. Set LLM_PROVIDER=gemini.";
  }
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      return "OPENAI_API_KEY is not set. Add it to .env.local (see .env.example).";
    }
    return null;
  }
  if (provider !== "gemini") {
    return `Unknown LLM_PROVIDER "${provider}". Supported: gemini, openai.`;
  }
  if (!process.env.GEMINI_API_KEY) {
    return "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example).";
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

export interface AgentError {
  agent: string;
  message: string;
}

/**
 * Per-agent error log.
 *
 * NOTE: module-level, so concurrent pipelines share it. It is only used for
 * diagnostics (server logs + enriching the total-failure error message), never
 * for branching logic — the orchestrator detects total failure by comparing
 * outputs against fallback sentinels instead. Cleared at each pipeline start.
 */
let agentErrors: AgentError[] = [];

export function recordAgentError(agent: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  agentErrors.push({ agent, message });
  console.error(`[agent:${agent}] FAILED — using low-confidence fallback. Cause: ${message}`);
}

export function takeAgentErrors(): AgentError[] {
  const errors = agentErrors;
  agentErrors = [];
  return errors;
}
