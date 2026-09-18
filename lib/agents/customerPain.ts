/**
 * Customer pain agent: extracts buyer pains in the buyer's own words.
 */
import type { PainOutput, ResearchBrief, SearchBundle } from "@/types/research";
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
import { PainOutputSchema } from "../ai/schemas";
import { formatSearchContext } from "../search/queries";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the voice-of-customer researcher for Market Proof, an AI market research tool for B2B SaaS marketers.
Extract buyer pain themes a marketer could use in messaging. Return JSON.

${GLOBAL_STYLE_RULES}

Pain quality bar: "screening 200 resumes by hand each week" beats "inefficient hiring". Every pain needs a concrete buyerPhrase in first person.`;

export const PAIN_FALLBACK: PainOutput = {
  pains: [],
};

export async function runCustomerPainAgent(
  brief: ResearchBrief,
  planCategory: string,
  search: SearchBundle,
): Promise<PainOutput> {
  const user = `${briefBlock(brief)}
Planned category: ${planCategory}

SEARCH CONTEXT (cite only URLs from this list):
${formatSearchContext(search.results)}

Return 4-7 pain themes. For each: pain (short label), buyerPhrase (first-person quote-style phrase, e.g. "we lose..."), whyItMatters (one sentence: trigger, objection, fear, or cost), evidenceNote (what backs it, or "model knowledge only, verify before use"), marketingImplication (one sentence: how a marketer should use this), confidence, sourceUrls (URLs from the context, or empty array).`;

  try {
    return await withTimeout(
      getProvider().completeStructured<PainOutput>({
        system: SYSTEM,
        user,
        schemaName: "pain_output",
        schema: PainOutputSchema,
        maxTokens: 1800,
        agent: "customerPain",
      }),
    );
  } catch (err) {
    recordAgentError("customerPain", err);
    return PAIN_FALLBACK;
  }
}
