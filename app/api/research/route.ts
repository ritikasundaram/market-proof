/**
 * POST /api/research — the only API route in MVP.
 *
 * Accepts a ResearchBrief, runs the agent pipeline server-side (API keys
 * never touch the browser), and returns a FinalResearchResponse.
 *
 * Errors: 400 for invalid input (Zod), 500 with a fail-soft message for
 * pipeline failures. Per-agent failures never reach here — the orchestrator
 * substitutes low-confidence fallbacks per section instead.
 */
import { NextResponse } from "next/server";
import { runResearchPipeline } from "@/lib/ai/orchestrator";
import { ResearchBriefSchema } from "@/lib/ai/schemas";
import { providerConfigError } from "@/lib/ai/client";

export const maxDuration = 120;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = ResearchBriefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid research brief.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const configError = providerConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }
    const report = await runResearchPipeline(parsed.data);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Research pipeline failed:", err);
    return NextResponse.json(
      {
        error:
          "Research failed. Check that OPENAI_API_KEY is set (and SERPER_API_KEY for live sources), then try again.",
      },
      { status: 500 },
    );
  }
}
