/**
 * Search entry point for the orchestrator.
 *
 * - Picks the provider from SEARCH_PROVIDER (only "tavily" is real in MVP).
 * - Runs all queries in parallel with `Promise.allSettled` so one failure
 *   never sinks the report.
 * - Returns searchStatus "live" if at least one result came back, otherwise
 *   "fallback-model-knowledge" — the UI renders an amber banner in that case.
 */
import type { SearchBundle } from "@/types/research";
import { NoopSearchProvider } from "./mock";
import type { SearchProvider } from "./provider";
import { TavilySearchProvider } from "./tavily";

export function getSearchProvider(): SearchProvider {
  const configured = (process.env.SEARCH_PROVIDER ?? "tavily").toLowerCase();
  if (configured === "tavily" && process.env.TAVILY_API_KEY) {
    return new TavilySearchProvider(process.env.TAVILY_API_KEY);
  }
  return new NoopSearchProvider();
}

export async function searchEvidence(queries: string[]): Promise<SearchBundle> {
  const maxResults = Number(process.env.SEARCH_MAX_RESULTS ?? 5) || 5;
  const provider = getSearchProvider();

  if (provider instanceof NoopSearchProvider) {
    return { results: [], searchStatus: "fallback-model-knowledge", queriesUsed: queries };
  }

  const settled = await Promise.allSettled(
    queries.map((q) => provider.search(q, maxResults)),
  );

  const seen = new Set<string>();
  const results = settled
    .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
    .filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .slice(0, queries.length * maxResults);

  return {
    results,
    searchStatus: results.length > 0 ? "live" : "fallback-model-knowledge",
    queriesUsed: queries,
  };
}
