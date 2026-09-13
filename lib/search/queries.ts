/**
 * Builds the small set of search queries that ground a report.
 *
 * Pure function (no I/O) so it is easy to unit-test. Kept to at most
 * MAX_QUERIES so one report costs a predictable handful of Serper searches.
 */
import type { ResearchBrief } from "@/types/research";

export const MAX_QUERIES = 5;

/** Short human label for the market, e.g. "AI recruiting software". */
export function marketLabel(brief: ResearchBrief): string {
  const base = brief.category?.trim() || brief.query.trim();
  const buyer = brief.buyer?.trim();
  return buyer ? `${base} for ${buyer}` : base;
}

export function buildSearchQueries(
  brief: ResearchBrief,
  plannedCategory: string,
): string[] {
  const market = plannedCategory.trim() || marketLabel(brief);
  const region = brief.region?.trim();
  const withRegion = (q: string) => (region ? `${q} ${region}` : q);

  const queries = [
    withRegion(`${market} competitors comparison`),
    withRegion(`${market} buyer pain points reviews`),
    withRegion(`best ${market} pricing`),
    withRegion(`${market} vs alternatives`),
  ];

  return queries.slice(0, MAX_QUERIES);
}

/** Formats search hits as numbered context for agent prompts. */
export function formatSearchContext(
  results: { title: string; url: string; snippet: string }[],
): string {
  if (results.length === 0) {
    return "No live search results are available. You are working from model knowledge only.";
  }
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet.slice(0, 400)}`,
    )
    .join("\n\n");
}
