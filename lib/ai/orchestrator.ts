/**
 * Simple orchestrator: planner → search → parallel workers → verifier →
 * scorer → synthesis.
 *
 * Deliberately NOT a framework (no LangGraph). The exported
 * `runResearchPipeline` is the single seam: a future orchestration framework
 * only needs to reimplement this function signature.
 *
 * Fail-soft by design: every agent already returns a low-confidence
 * fallback on error, so the pipeline always produces a complete (if
 * honestly low-scoring) report instead of a 500.
 */
import type { FinalResearchResponse, ResearchBrief } from "@/types/research";
import { runCategoryAgent } from "../agents/category";
import { runCompetitorAgent } from "../agents/competitor";
import { runCustomerPainAgent } from "../agents/customerPain";
import { runPlannerAgent } from "../agents/planner";
import { runSeoAeoAgent } from "../agents/seoAeo";
import { runSynthesisAgent } from "../agents/synthesis";
import { runVerifierAgent } from "../agents/verifier";
import { searchEvidence } from "../search";
import { buildSearchQueries } from "../search/queries";
import { getModelLabel, getProvider } from "./client";
import { scoreResearchQuality } from "./rubric";

export async function runResearchPipeline(brief: ResearchBrief): Promise<FinalResearchResponse> {
  const started = Date.now();

  // 1. Plan first — workers share one definition of category + buyer.
  const plan = await runPlannerAgent(brief);

  // 2. One batched search pass grounds every worker.
  const queries = buildSearchQueries(brief, plan.category);
  const search = await searchEvidence(queries);

  // 3. Independent workers run in parallel.
  const [category, competitors, pains, seo] = await Promise.all([
    runCategoryAgent(brief, plan.category, search),
    runCompetitorAgent(brief, plan.category, search),
    runCustomerPainAgent(brief, plan.category, search),
    runSeoAeoAgent(brief, plan.category, search),
  ]);

  // 4. Verifier checks findings against the search bundle.
  const verification = await runVerifierAgent({
    brief,
    category,
    competitors,
    pains,
    seo,
    search,
  });

  // 5. Deterministic rubric scores (no extra LLM cost).
  const scores = scoreResearchQuality({
    category,
    competitors,
    pains,
    seo,
    verification,
    search,
  });

  // 6. Synthesis writes the marketer-facing report.
  const final = await runSynthesisAgent({
    brief,
    planCategory: plan.category,
    category,
    competitors,
    pains,
    seo,
    verification,
    scores,
    search,
  });

  return {
    brief,
    plan,
    category,
    competitors,
    pains,
    seo,
    verification,
    scores,
    final,
    meta: {
      model: getModelLabel(),
      provider: getProvider().name,
      searchStatus: search.searchStatus,
      sourcesCount: search.results.length,
      durationMs: Date.now() - started,
      createdAt: new Date().toISOString(),
    },
  };
}
