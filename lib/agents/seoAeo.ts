/**
 * SEO/AEO agent: finds content opportunities a marketer can act on.
 *
 * AEO = answer-engine optimization: questions buyers ask chatbots and
 * voice assistants ("what is / who is / how does it work").
 */
import type { ResearchBrief, SearchBundle, SeoOutput } from "@/types/research";
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
import { SeoOutputSchema } from "../ai/schemas";
import { formatSearchContext } from "../search/queries";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the SEO/AEO researcher for Market Proof, an AI market research tool for B2B SaaS marketers.
Find search and answer-engine content opportunities. Return JSON.

${GLOBAL_STYLE_RULES}`;

export const SEO_FALLBACK: SeoOutput = {
  keywords: [],
  buyerQuestions: [],
  comparisons: [],
  educationalTopics: [],
  faqs: [],
  aeoQuestions: [],
  confidence: "low",
  sourceNote: "Agent failed; treat as missing evidence.",
};

export async function runSeoAeoAgent(
  brief: ResearchBrief,
  planCategory: string,
  search: SearchBundle,
): Promise<SeoOutput> {
  const user = `${briefBlock(brief)}
Planned category: ${planCategory}

SEARCH CONTEXT (cite only URLs from this list):
${formatSearchContext(search.results)}

Return JSON with: keywords (6-10 specific phrases, include long-tail), buyerQuestions (4-6 questions buyers ask before buying), comparisons (3-5 "X vs Y" or "X alternatives" topics), educationalTopics (3-5 how-to/explainer topics), faqs (4-6 FAQ entries), aeoQuestions (3-5 "what is / who is / how does it work" questions for answer engines), confidence, sourceNote (one sentence).`;

  try {
    return await withTimeout(
      getProvider().completeStructured<SeoOutput>({
        system: SYSTEM,
        user,
        schemaName: "seo_output",
        schema: SeoOutputSchema,
        maxTokens: 1500,
        agent: "seoAeo",
      }),
    );
  } catch (err) {
    recordAgentError("seoAeo", err);
    return SEO_FALLBACK;
  }
}
