import type { FinalResearchResponse } from "@/types/research";

/** Collapsible "how this was researched" trace for transparency. */
export function HowResearched({ report }: { report: FinalResearchResponse }) {
  return (
    <details className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm sm:p-6">
      <summary className="cursor-pointer font-semibold text-zinc-900">
        How this was researched
      </summary>
      <div className="mt-3 space-y-3 text-zinc-600">
        <p>
          <span className="font-medium text-zinc-800">Model:</span> {report.meta.provider}/
          {report.meta.model} ·{" "}
          <span className="font-medium text-zinc-800">Sources:</span>{" "}
          {report.meta.searchStatus === "live"
            ? `${report.meta.sourcesCount} live web sources`
            : "model knowledge only"}{" "}
          · <span className="font-medium text-zinc-800">Duration:</span>{" "}
          {Math.round(report.meta.durationMs / 1000)}s ·{" "}
          <span className="font-medium text-zinc-800">Generated:</span>{" "}
          {new Date(report.meta.createdAt).toLocaleString()}
        </p>
        <div>
          <p className="font-medium text-zinc-800">Planned category: {report.plan.category}</p>
          <p>Likely buyer: {report.plan.likelyBuyer}</p>
        </div>
        <div>
          <p className="font-medium text-zinc-800">Research tasks executed:</p>
          <ul className="list-disc pl-5">
            {report.plan.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-zinc-800">Per-agent confidence:</p>
          <ul className="list-disc pl-5">
            <li>Category: {report.category.confidence} — {report.category.sourceNote}</li>
            <li>
              Competitors:{" "}
              {report.competitors.competitors.map((c) => `${c.name} (${c.confidence})`).join(", ") || "none found"}
            </li>
            <li>
              Pains:{" "}
              {report.pains.pains.map((p) => `${p.pain} (${p.confidence})`).join(", ") || "none found"}
            </li>
            <li>SEO/AEO: {report.seo.confidence} — {report.seo.sourceNote}</li>
          </ul>
        </div>
      </div>
    </details>
  );
}
