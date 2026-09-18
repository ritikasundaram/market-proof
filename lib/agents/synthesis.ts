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
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
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
        agent: "synthesis",
      }),
    );
  } catch (err) {
    recordAgentError("synthesis", err);
    // The LLM write-up failed, but the section outputs may still hold real
    // findings — assemble them deterministically instead of giving up.
    return {
      title: `Market Research Report: ${input.planCategory}`,
      briefSummary: input.brief.query,
      messagingPatterns: [],
      positioningOpportunities: [],
      markdown: buildPartialMarkdown(input),
    };
  }
}

/**
 * Deterministic fallback report: stitches together whatever the earlier
 * agents actually found. Sections with no data say so explicitly rather
 * than inventing content. Used only when the synthesis LLM call fails.
 */
function buildPartialMarkdown(input: SynthesisInput): string {
  const lines: string[] = [
    `# Market Research Report: ${input.planCategory}`,
    "",
    "> Note: the AI write-up step failed for this run, so this is a direct",
    "> assembly of the agents' findings (not polished prose). Confidence and",
    "> source notes below still apply — verify before use.",
    "",
    "## 1. Research Brief",
    "",
    input.brief.query,
    "",
    "## 2. Category Summary",
    "",
    input.category.summary || "No category summary was produced.",
    "",
  ];

  if (input.category.typicalBuyers.length > 0) {
    lines.push(`Typical buyers: ${input.category.typicalBuyers.join("; ")}`, "");
  }

  lines.push("## 3. Competitor Map", "");
  if (input.competitors.competitors.length === 0) {
    lines.push("No competitors were found for this run.", "");
  } else {
    for (const c of input.competitors.competitors) {
      lines.push(`- **${c.name}** (${c.type}, ${c.confidence} confidence): ${c.whatTheyDo}`);
    }
    lines.push("");
  }

  lines.push("## 4. Buyer Pain Themes", "");
  if (input.pains.pains.length === 0) {
    lines.push("No pain themes were found for this run.", "");
  } else {
    for (const p of input.pains.pains) {
      lines.push(`- **${p.pain}** (${p.confidence} confidence): "${p.buyerPhrase}" — ${p.marketingImplication}`);
    }
    lines.push("");
  }

  lines.push("## 5. SEO/AEO Opportunities", "");
  const seoBits = [...input.seo.keywords, ...input.seo.comparisons, ...input.seo.faqs];
  lines.push(seoBits.length > 0 ? seoBits.map((t) => `- ${t}`).join("\n") : "No SEO topics were found for this run.", "");

  lines.push("## 6. Human Review Warnings", "");
  const flags = [...input.verification.unsupportedClaims, ...input.verification.weakClaims];
  lines.push(
    flags.length > 0
      ? flags.map((f) => `- ${f.claim} — ${f.reason}`).join("\n")
      : "The verifier did not flag specific claims, but every finding above should still be spot-checked.",
    "",
  );
  if (input.verification.humanChecklist.length > 0) {
    lines.push("Checklist:", ...input.verification.humanChecklist.map((c) => `- [ ] ${c}`), "");
  }

  const sources =
    input.search.results.map((r) => `- ${r.title} — ${r.url}`).join("\n") ||
    "(no live sources; model knowledge only)";
  lines.push("## Sources", "", sources, "");

  return lines.join("\n");
}
