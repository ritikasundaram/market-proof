/**
 * Category agent: explains what the market is in plain marketer language.
 */
import type { CategoryOutput, ResearchBrief, SearchBundle } from "@/types/research";
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
import { CategorySchema } from "../ai/schemas";
import { formatSearchContext } from "../search/queries";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the category researcher for Market Proof, an AI market research tool for B2B SaaS marketers.
Explain the software category clearly and honestly as JSON.

${GLOBAL_STYLE_RULES}`;

export const CATEGORY_FALLBACK: CategoryOutput = {
  summary: "Category research is unavailable for this run.",
  problemSolved: "",
  typicalBuyers: [],
  language: [],
  trends: [],
  risks: [],
  confidence: "low",
  sourceNote: "Agent failed; treat as missing evidence.",
  sourceUrls: [],
};

export async function runCategoryAgent(
  brief: ResearchBrief,
  planCategory: string,
  search: SearchBundle,
): Promise<CategoryOutput> {
  const user = `${briefBlock(brief)}
Planned category: ${planCategory}

SEARCH CONTEXT (cite only URLs from this list):
${formatSearchContext(search.results)}

Return JSON with: summary (3-5 sentences), problemSolved (1-2 sentences), typicalBuyers (2-5 roles with company size), language (4-8 terms buyers/vendors actually use), trends (2-4), risks (1-3), confidence, sourceNote (one sentence on what backs this), sourceUrls (URLs from the context, or empty array).`;

  try {
    return await withTimeout(
      getProvider().completeStructured<CategoryOutput>({
        system: SYSTEM,
        user,
        schemaName: "category_output",
        schema: CategorySchema,
        maxTokens: 1200,
        agent: "category",
      }),
    );
  } catch (err) {
    recordAgentError("category", err);
    return CATEGORY_FALLBACK;
  }
}
