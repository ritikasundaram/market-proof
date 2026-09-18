/**
 * Planner agent: turns the user's brief into a structured research plan.
 *
 * Runs first and alone — every other agent receives this plan so they share
 * one definition of the category, buyer, and report scope.
 */
import type { PlanOutput, ResearchBrief } from "@/types/research";
import { getProvider, recordAgentError, withTimeout } from "../ai/client";
import { PlanSchema } from "../ai/schemas";
import { briefBlock, GLOBAL_STYLE_RULES } from "./shared";

const SYSTEM = `You are the research planner for Market Proof, an AI market research tool for B2B SaaS marketers.
Given a research brief, produce a focused research plan as JSON.

${GLOBAL_STYLE_RULES}`;

export const PLANNER_FALLBACK: PlanOutput = {
  category: "Uncategorized SaaS market",
  likelyBuyer: "Operations leader",
  tasks: [
    "Summarize the category",
    "List direct and indirect competitors",
    "Extract buyer pain themes",
    "Draft SEO/AEO content opportunities",
  ],
  usefulSourceTypes: ["vendor websites", "review sites", "comparison pages"],
  reportSections: ["Category", "Competitors", "Pains", "SEO/AEO", "Positioning"],
};

export async function runPlannerAgent(brief: ResearchBrief): Promise<PlanOutput> {
  const user = `${briefBlock(brief)}

Return a plan with:
- category: the market/category to research (2-8 words, e.g. "AI recruiting software").
- likelyBuyer: the most likely economic buyer (job title + company size).
- tasks: 4-7 concrete research tasks for the downstream agents.
- usefulSourceTypes: 3-6 source types that would best evidence this market (e.g. vendor pricing pages, G2 reviews, comparison articles).
- reportSections: the final report sections to include.`;

  try {
    return await withTimeout(
      getProvider().completeStructured<PlanOutput>({
        system: SYSTEM,
        user,
        schemaName: "research_plan",
        schema: PlanSchema,
        maxTokens: 800,
        agent: "planner",
      }),
    );
  } catch (err) {
    recordAgentError("planner", err);
    return { ...PLANNER_FALLBACK, category: brief.category || brief.query.slice(0, 80) };
  }
}
