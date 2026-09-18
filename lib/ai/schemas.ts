/**
 * Zod schemas for Market Proof.
 *
 * Two jobs:
 * 1. Validate the incoming research brief at the API boundary.
 * 2. Define the exact JSON shape each agent must return. These schemas are
 *    passed to structured-output calls (`zodResponseFormat` for OpenAI,
 *    JSON mode + local validation for Gemini) — so agent schemas avoid
 *    `.optional()` entirely (every field is `required`). Missing information is represented with empty
 *    strings/arrays and `confidence: "low"`, never with absent keys.
 */
import { z } from "zod";

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export const CompetitorTypeSchema = z.enum(["direct", "indirect", "status_quo"]);
export const OverclaimRiskSchema = z.enum(["low", "medium", "high"]);

/** Validates POST /api/research request bodies. */
export const ResearchBriefSchema = z.object({
  query: z.string().trim().min(10, "Describe the market in at least 10 characters.").max(1000),
  category: z.string().trim().max(200).optional().default(""),
  buyer: z.string().trim().max(200).optional().default(""),
  region: z.string().trim().max(200).optional().default(""),
  goal: z.string().trim().max(500).optional().default(""),
  context: z.string().trim().max(2000).optional().default(""),
});

export const PlanSchema = z.object({
  category: z.string(),
  likelyBuyer: z.string(),
  tasks: z.array(z.string()),
  usefulSourceTypes: z.array(z.string()),
  reportSections: z.array(z.string()),
});

export const CategorySchema = z.object({
  summary: z.string(),
  problemSolved: z.string(),
  typicalBuyers: z.array(z.string()),
  language: z.array(z.string()),
  trends: z.array(z.string()),
  risks: z.array(z.string()),
  confidence: ConfidenceSchema,
  sourceNote: z.string(),
  sourceUrls: z.array(z.string()),
});

export const CompetitorSchema = z.object({
  name: z.string(),
  type: CompetitorTypeSchema,
  whatTheyDo: z.string(),
  positioning: z.string(),
  whyMatters: z.string(),
  confidence: ConfidenceSchema,
  sourceNote: z.string(),
  sourceUrls: z.array(z.string()),
});

export const CompetitorOutputSchema = z.object({
  competitors: z.array(CompetitorSchema),
});

export const PainThemeSchema = z.object({
  pain: z.string(),
  buyerPhrase: z.string(),
  whyItMatters: z.string(),
  evidenceNote: z.string(),
  marketingImplication: z.string(),
  confidence: ConfidenceSchema,
  sourceUrls: z.array(z.string()),
});

export const PainOutputSchema = z.object({
  pains: z.array(PainThemeSchema),
});

export const SeoOutputSchema = z.object({
  keywords: z.array(z.string()),
  buyerQuestions: z.array(z.string()),
  comparisons: z.array(z.string()),
  educationalTopics: z.array(z.string()),
  faqs: z.array(z.string()),
  aeoQuestions: z.array(z.string()),
  confidence: ConfidenceSchema,
  sourceNote: z.string(),
});

export const FlaggedClaimSchema = z.object({
  claim: z.string(),
  reason: z.string(),
});

export const VerificationSchema = z.object({
  unsupportedClaims: z.array(FlaggedClaimSchema),
  weakClaims: z.array(FlaggedClaimSchema),
  invalidUrls: z.array(z.string()),
  sourceQualityNotes: z.string(),
  humanChecklist: z.array(z.string()),
});

export const QualityScoresSchema = z.object({
  overall: z.number().min(1).max(10),
  competitorCoverage: z.number().min(1).max(10),
  sourceQuality: z.number().min(1).max(10),
  buyerPainSpecificity: z.number().min(1).max(10),
  evidenceCoverage: z.number().min(1).max(10),
  marketingUsefulness: z.number().min(1).max(10),
  overclaimRisk: OverclaimRiskSchema,
});

export const SynthesisSchema = z.object({
  title: z.string(),
  briefSummary: z.string(),
  messagingPatterns: z.array(z.string()),
  positioningOpportunities: z.array(z.string()),
  markdown: z.string(),
});
