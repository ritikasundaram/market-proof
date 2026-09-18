/**
 * Competitor agent: maps direct, indirect, and status-quo alternatives.
 *
 * The most hallucination-prone agent, so the prompt is strict: only cite
 * URLs from the search context, and mark anything else low-confidence.
 */
import type { CompetitorOutput, ResearchBrief, SearchBundle } from "@/types/research";
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
import { CompetitorOutputSchema } from "../ai/schemas";
import { formatSearchContext } from "../search/queries";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the competitor researcher for Market Proof, an AI market research tool for B2B SaaS marketers.
Find the competitors and alternatives a buyer would realistically evaluate. Return JSON.

Competitor types:
- direct: sells the same kind of product for the same job.
- indirect: solves the same problem differently (adjacent tool, platform bundle, agency/service).
- status_quo: what buyers do if they buy nothing (spreadsheets, email, manual process, internal hire).

${GLOBAL_STYLE_RULES}`;

export const COMPETITOR_FALLBACK: CompetitorOutput = {
  competitors: [],
};

export async function runCompetitorAgent(
  brief: ResearchBrief,
  planCategory: string,
  search: SearchBundle,
): Promise<CompetitorOutput> {
  const user = `${briefBlock(brief)}
Planned category: ${planCategory}

SEARCH CONTEXT (cite only URLs from this list):
${formatSearchContext(search.results)}

Return 5-9 competitors covering all three types (at least one status_quo). For each: name, type, whatTheyDo (one sentence), positioning (how they describe themselves, one sentence), whyMatters (why a marketer should care, one sentence), confidence, sourceNote (one short sentence), sourceUrls (URLs from the context, or empty array if model knowledge only).`;

  try {
    return await withTimeout(
      getProvider().completeStructured<CompetitorOutput>({
        system: SYSTEM,
        user,
        schemaName: "competitor_output",
        schema: CompetitorOutputSchema,
        maxTokens: 1800,
        agent: "competitor",
      }),
    );
  } catch (err) {
    recordAgentError("competitor", err);
    return COMPETITOR_FALLBACK;
  }
}
