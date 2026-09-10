/**
 * Research quality scoring rubric.
 *
 * Scores are INTERPRETIVE (1-10 per dimension), not mathematically precise.
 * They are computed deterministically from the agent outputs so they are
 * cheap, explainable, and stable — a portfolio reviewer can read this file
 * and understand exactly why a report scored 7 instead of 9.
 *
 * Rubric (documented in README too):
 * - competitorCoverage: 10 = direct + indirect + status_quo present with specifics;
 *   5 = some competitors but missing alternatives; 1 = vague/irrelevant.
 * - sourceQuality: 10 = mostly live, credible URLs; 5 = mixed; 1 = no live sources.
 * - buyerPainSpecificity: 10 = concrete pains in buyer language with buyerPhrases;
 *   5 = somewhat specific; 1 = generic ("increase productivity").
 * - evidenceCoverage: 10 = most claims carry source URLs from the search bundle;
 *   5 = partial; 1 = almost nothing cited.
 * - marketingUsefulness: 10 = pains/positioning/SEO directly usable in messaging;
 *   5 = somewhat actionable; 1 = generic summary.
 * - overclaimRisk: high when many verifier flags or zero live sources.
 */
import type {
  CategoryOutput,
  CompetitorOutput,
  PainOutput,
  QualityScores,
  SearchBundle,
  SeoOutput,
  VerificationOutput,
} from "@/types/research";

const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));

const GENERIC_PAIN_PHRASES = [
  "increase productivity",
  "improve efficiency",
  "streamline workflows",
  "unlock potential",
  "seamless",
];

function hasUrlFromBundle(urls: string[], bundle: SearchBundle): boolean {
  const known = new Set(bundle.results.map((r) => r.url));
  return urls.some((u) => known.has(u));
}

function competitorCoverageScore(c: CompetitorOutput): number {
  if (c.competitors.length === 0) return 1;
  const types = new Set(c.competitors.map((x) => x.type));
  let score = 3 + Math.min(c.competitors.length, 7); // 4..10 by count
  if (types.has("direct") && types.has("indirect") && types.has("status_quo")) score += 1;
  else if (types.size === 1) score -= 2;
  const specific = c.competitors.filter(
    (x) => x.whatTheyDo.length > 20 && x.positioning.length > 10,
  ).length;
  if (specific < c.competitors.length / 2) score -= 2;
  return clamp(score);
}

function sourceQualityScore(bundle: SearchBundle, v: VerificationOutput): number {
  if (bundle.searchStatus === "fallback-model-knowledge" || bundle.results.length === 0) {
    return v.unsupportedClaims.length > 0 ? 2 : 3;
  }
  let score = 5 + Math.min(bundle.results.length, 5); // 6..10 by breadth
  if (v.invalidUrls.length > 0) score -= 2;
  if (v.unsupportedClaims.length >= 3) score -= 2;
  else if (v.unsupportedClaims.length > 0) score -= 1;
  return clamp(score);
}

function buyerPainSpecificityScore(p: PainOutput): number {
  if (p.pains.length === 0) return 1;
  let score = 4 + Math.min(p.pains.length, 5); // 5..9 by count
  const withPhrase = p.pains.filter((x) => x.buyerPhrase.length > 12).length;
  if (withPhrase === p.pains.length) score += 1;
  else if (withPhrase === 0) score -= 3;
  const generic = p.pains.filter((x) =>
    GENERIC_PAIN_PHRASES.some((g) => `${x.pain} ${x.buyerPhrase}`.toLowerCase().includes(g)),
  ).length;
  if (generic > 0) score -= 2;
  return clamp(score);
}

function evidenceCoverageScore(
  category: CategoryOutput,
  c: CompetitorOutput,
  p: PainOutput,
  bundle: SearchBundle,
): number {
  const claims: string[][] = [
    category.sourceUrls,
    ...c.competitors.map((x) => x.sourceUrls),
    ...p.pains.map((x) => x.sourceUrls),
  ];
  if (claims.length === 0) return 3;
  const cited = claims.filter((urls) => hasUrlFromBundle(urls, bundle)).length;
  const ratio = cited / claims.length;
  if (ratio >= 0.6) return 9;
  if (ratio >= 0.4) return 7;
  if (ratio >= 0.2) return 5;
  if (ratio > 0) return 3;
  return 2;
}

function marketingUsefulnessScore(p: PainOutput, seo: SeoOutput): number {
  let score = 4;
  const actionablePains = p.pains.filter((x) => x.marketingImplication.length > 20).length;
  score += Math.min(actionablePains, 3);
  const seoItems = seo.keywords.length + seo.comparisons.length + seo.faqs.length;
  if (seoItems >= 12) score += 2;
  else if (seoItems >= 6) score += 1;
  else score -= 1;
  return clamp(score);
}

export interface ScoreInput {
  category: CategoryOutput;
  competitors: CompetitorOutput;
  pains: PainOutput;
  seo: SeoOutput;
  verification: VerificationOutput;
  search: SearchBundle;
}

export function scoreResearchQuality(input: ScoreInput): QualityScores {
  const competitorCoverage = competitorCoverageScore(input.competitors);
  const sourceQuality = sourceQualityScore(input.search, input.verification);
  const buyerPainSpecificity = buyerPainSpecificityScore(input.pains);
  const evidenceCoverage = evidenceCoverageScore(
    input.category,
    input.competitors,
    input.pains,
    input.search,
  );
  const marketingUsefulness = marketingUsefulnessScore(input.pains, input.seo);

  const flagCount =
    input.verification.unsupportedClaims.length +
    input.verification.weakClaims.length +
    input.verification.invalidUrls.length;
  const overclaimRisk =
    input.search.searchStatus === "fallback-model-knowledge" || flagCount >= 5
      ? "high"
      : flagCount >= 2
        ? "medium"
        : "low";

  const overall = clamp(
    (competitorCoverage + sourceQuality + buyerPainSpecificity + evidenceCoverage + marketingUsefulness) / 5,
  );

  return {
    overall,
    competitorCoverage,
    sourceQuality,
    buyerPainSpecificity,
    evidenceCoverage,
    marketingUsefulness,
    overclaimRisk,
  };
}
