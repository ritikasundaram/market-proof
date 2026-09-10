/**
 * Synthesis agent: turns all agent outputs into the marketer-facing report.
 *
 * Writes for a marketer or founder, not a researcher. Labels inference
 * explicitly and never upgrades confidence — if evidence is thin, the
 * report says so.
 */
import type {
  CategoryOutput,
  CompetitorOutput,
  PainOutput,
  QualityScores,
  ResearchBrief,
  SearchBundle,
  SeoOutput,
  SynthesisOutput,
  VerificationOutput,
} from "@/types/research";
import { getProvider, withTimeout } from "../ai/client";
import { SynthesisSchema } from "../ai/schemas";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the report synthesizer for Market Proof, an AI market research tool for B2B SaaS marketers.
Write a clean, useful final report as JSON for a marketer or startup founder.

${GLOBAL_STYLE_RULES}

Report rules:
- 10 numbered sections matching the report format, written in markdown inside the "markdown" field.
- Mark uncertain points inline as "Inference:" or "Needs verification:".
- Never upgrade confidence: if a finding is low-confidence, say so.
- messagingPatterns: 3-5 phrases competitors commonly repeat.
- positioningOpportunities: 3-5 concrete angles where a new entrant could sound sharper or different.`;

export const SYNTHESIS_FALLBACK: SynthesisOutput = {
  title: "Market Research Report",
  briefSummary: "Synthesis is unavailable for this run; see the section outputs above.",
  messagingPatterns: [],
  positioningOpportunities: [],
  markdown: "# Market Research Report\n\nSynthesis failed for this run. The individual research sections above still contain the agents' findings.",
};

interface SynthesisInput {
  brief: ResearchBrief;
  planCategory: string;
  category: CategoryOutput;
  competitors: CompetitorOutput;
  pains: PainOutput;
  seo: SeoOutput;
  verification: VerificationOutput;
  scores: QualityScores;
  search: SearchBundle;
}

export async function runSynthesisAgent(input: SynthesisInput): Promise<SynthesisOutput> {
  const sources =
    input.search.results.map((r) => `- ${r.title} — ${r.url}`).join("\n") ||
    "(no live sources; model knowledge only)";

  const user = `${briefBlock(input.brief)}
Category: ${input.planCategory}

CATEGORY: ${input.category.summary}
Problem solved: ${input.category.problemSolved}
Typical buyers: ${input.category.typicalBuyers.join("; ")}
Language: ${input.category.language.join(", ")}
Trends: ${input.category.trends.join("; ")}
Risks: ${input.category.risks.join("; ")}

COMPETITORS:
${input.competitors.competitors.map((c) => `- ${c.name} (${c.type}): ${c.whatTheyDo} Positioning: ${c.positioning}`).join("\n")}

PAINS:
${input.pains.pains.map((p) => `- ${p.pain}: "${p.buyerPhrase}" — ${p.marketingImplication}`).join("\n")}

SEO: keywords: ${input.seo.keywords.join(", ")}
Comparisons: ${input.seo.comparisons.join("; ")}
FAQs: ${input.seo.faqs.join("; ")}

VERIFIER FLAGS: ${input.verification.unsupportedClaims.map((c) => c.claim).join(" | ") || "none"}
WEAK: ${input.verification.weakClaims.map((c) => c.claim).join(" | ") || "none"}
HUMAN CHECKLIST: ${input.verification.humanChecklist.join(" | ")}

SCORES: overall ${input.scores.overall}/10, overclaim risk ${input.scores.overclaimRisk}

SOURCES:
${sources}

Write the full report markdown with sections 1-10 (brief, category, buyer, competitor map, pains, messaging patterns, positioning, SEO/AEO, quality audit with the scores above, human review warnings). End with a Sources list. Keep it skimmable: short paragraphs, bullets, tables where they help.`;

  try {
    return await withTimeout(
      getProvider().completeStructured<SynthesisOutput>({
        system: SYSTEM,
        user,
        schemaName: "synthesis_output",
        schema: SynthesisSchema,
        maxTokens: 3000,
      }),
    );
  } catch {
    return SYNTHESIS_FALLBACK;
  }
}
