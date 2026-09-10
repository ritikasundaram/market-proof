import type { OverclaimRisk, QualityScores } from "@/types/research";

const RISK_STYLES: Record<OverclaimRisk, string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

function barColor(score: number): string {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-rose-500";
}

const DIMENSIONS: { key: keyof Omit<QualityScores, "overall" | "overclaimRisk">; label: string }[] = [
  { key: "competitorCoverage", label: "Competitor coverage" },
  { key: "sourceQuality", label: "Source quality" },
  { key: "buyerPainSpecificity", label: "Buyer pain specificity" },
  { key: "evidenceCoverage", label: "Evidence coverage" },
  { key: "marketingUsefulness", label: "Marketing usefulness" },
];

export function QualityScoreCard({ scores }: { scores: QualityScores }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-900 p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Research quality score
          </p>
          <p className="mt-1 text-5xl font-bold">
            {scores.overall}
            <span className="text-xl font-medium text-zinc-400">/10</span>
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Interpretive rubric score — guidance, not precise math.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${RISK_STYLES[scores.overclaimRisk]}`}
        >
          Overclaim risk: {scores.overclaimRisk}
        </span>
      </div>
      <dl className="mt-5 space-y-3">
        {DIMENSIONS.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <dt className="text-zinc-300">{label}</dt>
              <dd className="font-semibold">{scores[key]}/10</dd>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
              <div
                className={`h-full rounded-full ${barColor(scores[key])}`}
                style={{ width: `${scores[key] * 10}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
