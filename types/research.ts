/**
 * Shared TypeScript types for Market Proof.
 *
 * These are the portfolio-readable contracts every agent, the orchestrator,
 * the API route, and the UI agree on. Zod schemas in `lib/ai/schemas.ts`
 * mirror these types and are the runtime source of truth
 * (`z.infer<typeof XSchema>` should stay assignable to these interfaces).
 */

/** What the user asks for. All fields except `query` are optional. */
export interface ResearchBrief {
  query: string;
  category?: string;
  buyer?: string;
  region?: string;
  goal?: string;
  context?: string;
}

/** Per-claim confidence. Agents must be honest: use "low" when unsure. */
export type Confidence = "high" | "medium" | "low";

/** UI badge vocabulary for the trust layer. */
export type EvidenceTag =
  | "source-backed"
  | "inference"
  | "weak-claim"
  | "needs-review";

/** Competitor classification used by the competitor table. */
export type CompetitorType = "direct" | "indirect" | "status_quo";

/** Whether live web search grounded this report. */
export type SearchStatus = "live" | "fallback-model-knowledge";

/** Interpretive risk flag from the verifier + scorer. */
export type OverclaimRisk = "low" | "medium" | "high";

/** A single web search hit. Kept minimal so providers are swappable. */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Search context handed to every research agent. */
export interface SearchBundle {
  results: SearchResult[];
  searchStatus: SearchStatus;
  queriesUsed: string[];
}

/** Planner agent output: the research plan. */
export interface PlanOutput {
  category: string;
  likelyBuyer: string;
  tasks: string[];
  usefulSourceTypes: string[];
  reportSections: string[];
}

/** Category agent output. */
export interface CategoryOutput {
  summary: string;
  problemSolved: string;
  typicalBuyers: string[];
  language: string[];
  trends: string[];
  risks: string[];
  confidence: Confidence;
  sourceNote: string;
  sourceUrls: string[];
}

/** One row of the competitor map. */
export interface Competitor {
  name: string;
  type: CompetitorType;
  whatTheyDo: string;
  positioning: string;
  whyMatters: string;
  confidence: Confidence;
  sourceNote: string;
  sourceUrls: string[];
}

/** Competitor agent output. */
export interface CompetitorOutput {
  competitors: Competitor[];
}

/** One buyer pain theme. */
export interface PainTheme {
  pain: string;
  buyerPhrase: string;
  whyItMatters: string;
  evidenceNote: string;
  marketingImplication: string;
  confidence: Confidence;
  sourceUrls: string[];
}

/** Customer pain agent output. */
export interface PainOutput {
  pains: PainTheme[];
}

/** SEO/AEO agent output. */
export interface SeoOutput {
  keywords: string[];
  buyerQuestions: string[];
  comparisons: string[];
  educationalTopics: string[];
  faqs: string[];
  aeoQuestions: string[];
  confidence: Confidence;
  sourceNote: string;
}

/** A claim the verifier could not tie to evidence. */
export interface FlaggedClaim {
  claim: string;
  reason: string;
}

/** Verifier agent output: the trust layer's raw material. */
export interface VerificationOutput {
  unsupportedClaims: FlaggedClaim[];
  weakClaims: FlaggedClaim[];
  invalidUrls: string[];
  sourceQualityNotes: string;
  humanChecklist: string[];
}

/** Research quality scores. Interpretive (rubric-based), not precise math. */
export interface QualityScores {
  overall: number;
  competitorCoverage: number;
  sourceQuality: number;
  buyerPainSpecificity: number;
  evidenceCoverage: number;
  marketingUsefulness: number;
  overclaimRisk: OverclaimRisk;
}

/** Synthesis agent output: the marketer-facing report. */
export interface SynthesisOutput {
  title: string;
  briefSummary: string;
  messagingPatterns: string[];
  positioningOpportunities: string[];
  markdown: string;
}

/** Run metadata shown in the report footer for transparency. */
export interface ReportMeta {
  model: string;
  provider: string;
  searchStatus: SearchStatus;
  sourcesCount: number;
  durationMs: number;
  createdAt: string;
}

/** The single object POST /api/research returns and the UI renders. */
export interface FinalResearchResponse {
  brief: ResearchBrief;
  plan: PlanOutput;
  category: CategoryOutput;
  competitors: CompetitorOutput;
  pains: PainOutput;
  seo: SeoOutput;
  verification: VerificationOutput;
  scores: QualityScores;
  final: SynthesisOutput;
  meta: ReportMeta;
}
