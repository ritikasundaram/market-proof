/**
 * Verifier agent: the core of the trust layer.
 *
 * Reads every other agent's findings plus the search bundle and flags:
 * - claims with no supporting source (unsupported)
 * - claims with thin or mismatched evidence (weak)
 * - URLs that were never in the search context (possible hallucinations)
 * - a human review checklist a marketer must complete before publishing
 *
 * Instructed to be skeptical: quoting the exact claim and explaining why.
 */
import type {
  CategoryOutput,
  CompetitorOutput,
  PainOutput,
  ResearchBrief,
  SearchBundle,
  SeoOutput,
  VerificationOutput,
} from "@/types/research";
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
import { VerificationSchema } from "../ai/schemas";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the evidence verifier for Market Proof, an AI market research tool for B2B SaaS marketers.
You are skeptical by design. Check the findings below against the search results and flag anything a marketer should not trust at face value. Return JSON.

${GLOBAL_STYLE_RULES}

Flag aggressively but fairly:
- unsupportedClaims: specific claims with no source at all.
- weakClaims: claims with only vague, single, or mismatched evidence.
- invalidUrls: any cited URL not present in the search context — these may be hallucinated.
- humanChecklist: 3-6 concrete verification tasks ("Check X on the vendor pricing page before quoting").`;

export const VERIFIER_FALLBACK: VerificationOutput = {
  unsupportedClaims: [
    {
      claim: "All findings in this report",
      reason: "Verifier did not run; no claim has been checked against sources.",
    },
  ],
  weakClaims: [],
  invalidUrls: [],
  sourceQualityNotes: "Verification unavailable for this run.",
  humanChecklist: [
    "Verify competitor names, pricing, and features on official vendor sites.",
    "Confirm pain themes against real customer reviews before using in messaging.",
    "Check that every cited URL loads and says what the report claims.",
  ],
};

interface VerifierInput {
  brief: ResearchBrief;
  category: CategoryOutput;
  competitors: CompetitorOutput;
  pains: PainOutput;
  seo: SeoOutput;
  search: SearchBundle;
}

export async function runVerifierAgent(input: VerifierInput): Promise<VerificationOutput> {
  const knownUrls = input.search.results.map((r) => r.url).join("\n") || "(no live search results)";

  const user = `${briefBlock(input.brief)}

FINDINGS TO VERIFY:
Category summary: ${input.category.summary}
Category source note: ${input.category.sourceNote}
Category URLs: ${input.category.sourceUrls.join(", ") || "(none)"}

Competitors:
${input.competitors.competitors.map((c) => `- ${c.name} [${c.type}, ${c.confidence}]: ${c.whatTheyDo} | positioning: ${c.positioning} | why matters: ${c.whyMatters} | note: ${c.sourceNote} | urls: ${c.sourceUrls.join(", ") || "(none)"}`).join("\n") || "(none)"}

Pains:
${input.pains.pains.map((p) => `- ${p.pain} [${p.confidence}]: "${p.buyerPhrase}" | evidence: ${p.evidenceNote} | urls: ${p.sourceUrls.join(", ") || "(none)"}`).join("\n") || "(none)"}

SEO topics: ${[...input.seo.keywords, ...input.seo.comparisons].slice(0, 12).join("; ") || "(none)"}
SEO source note: ${input.seo.sourceNote}

SEARCH CONTEXT URLS (the only citable URLs):
${knownUrls}
Search status: ${input.search.searchStatus}

Return JSON: unsupportedClaims (quote exact claim + reason), weakClaims (claim + reason), invalidUrls (cited URLs not in the context list), sourceQualityNotes (2-3 sentences on overall source quality), humanChecklist (3-6 concrete checks).`;

  try {
    return await withTimeout(
      getProvider().completeStructured<VerificationOutput>({
        system: SYSTEM,
        user,
        schemaName: "verification_output",
        schema: VerificationSchema,
        maxTokens: 1500,
        agent: "verifier",
      }),
    );
  } catch (err) {
    recordAgentError("verifier", err);
    return VERIFIER_FALLBACK;
  }
}
