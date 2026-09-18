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
import type {
  CategoryOutput,
  CompetitorOutput,
  FinalResearchResponse,
  PainOutput,
  ResearchBrief,
  SeoOutput,
} from "@/types/research";
import { CATEGORY_FALLBACK, runCategoryAgent } from "../agents/category";
import { runCompetitorAgent } from "../agents/competitor";
import { runCustomerPainAgent } from "../agents/customerPain";
import { runPlannerAgent } from "../agents/planner";
import { runSeoAeoAgent } from "../agents/seoAeo";
import { runSynthesisAgent } from "../agents/synthesis";
import { runVerifierAgent } from "../agents/verifier";
import { searchEvidence } from "../search";
import { buildSearchQueries } from "../search/queries";
import { getModelLabel, getProvider, takeAgentErrors } from "./client";
import { scoreResearchQuality } from "./rubric";

/**
 * Detects the "every researcher fell back" case by comparing outputs against
 * the agents' fallback sentinels. A single empty section can be legitimate,
 * but all four empty at once means the LLM layer is down (bad key, quota,
 * wrong model, network) — not a thin market.
 */
function throwIfAllWorkersFailed(input: {
  category: CategoryOutput;
  competitors: CompetitorOutput;
  pains: PainOutput;
  seo: SeoOutput;
}): void {
  const allEmpty =
    input.category.summary === CATEGORY_FALLBACK.summary &&
    input.competitors.competitors.length === 0 &&
    input.pains.pains.length === 0 &&
    input.seo.keywords.length === 0 &&
    input.seo.faqs.length === 0;

  if (!allEmpty) return;

  const errors = takeAgentErrors();
  const first = errors[0];
  throw new Error(
    "All research agents failed. " +
      (first
        ? `First error [${first.agent}]: ${first.message} `
        : "No error details captured. ") +
      "Check the LLM API key (valid key with quota?), the model name (must support JSON output), and server network access. " +
      "See server logs for per-agent [agent:<name>] lines.",
  );
}

export async function runResearchPipeline(brief: ResearchBrief): Promise<FinalResearchResponse> {
  const started = Date.now();
  takeAgentErrors(); // clear diagnostics from any previous run
  console.log(`[pipeline] research started: "${brief.query.slice(0, 100)}"`);

  // 1. Plan first — workers share one definition of category + buyer.
  const plan = await runPlannerAgent(brief);
  console.log(`[pipeline] plan ready (category="${plan.category}")`);

  // 2. One batched search pass grounds every worker.
  const queries = buildSearchQueries(brief, plan.category);
  const search = await searchEvidence(queries);
  console.log(
    `[pipeline] search done: ${search.results.length} results, status=${search.searchStatus}`,
  );

  // 3. Independent workers run in parallel, with staggered starts.
  // The Gemini free tier allows ~5 requests/minute, and four workers firing
  // at once guarantees 429s with minute-long waits. Spacing starts ~13s
  // apart keeps one report under the cap; the provider's 429 backoff remains
  // as a safety net. (On a paid tier this just adds ~40s of latency.)
  const staggerStart = (slot: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, slot * 13_000));
  const [category, competitors, pains, seo] = await Promise.all([
    staggerStart(0).then(() => runCategoryAgent(brief, plan.category, search)),
    staggerStart(1).then(() => runCompetitorAgent(brief, plan.category, search)),
    staggerStart(2).then(() => runCustomerPainAgent(brief, plan.category, search)),
    staggerStart(3).then(() => runSeoAeoAgent(brief, plan.category, search)),
  ]);
  console.log(
    `[pipeline] workers done: ${competitors.competitors.length} competitors, ` +
      `${pains.pains.length} pains, ${seo.keywords.length} keywords`,
  );

  // Total failure (e.g. bad API key, quota, wrong model) produces an empty
  // report that helps nobody. Fail loudly with an actionable message instead
  // of returning silent fallbacks — the route surfaces this as a 500.
  throwIfAllWorkersFailed({ category, competitors, pains, seo });

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
