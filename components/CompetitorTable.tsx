import type { Competitor, CompetitorType } from "@/types/research";
import { ConfidenceBadge } from "./EvidenceBadge";
import { SourceList } from "./SourceList";

const TYPE_LABELS: Record<CompetitorType, string> = {
  direct: "Direct",
  indirect: "Indirect",
  status_quo: "Status quo",
};

const TYPE_STYLES: Record<CompetitorType, string> = {
  direct: "bg-zinc-900 text-white",
  indirect: "bg-sky-100 text-sky-800",
  status_quo: "bg-zinc-100 text-zinc-600",
};

export function CompetitorTable({ competitors }: { competitors: Competitor[] }) {
  if (competitors.length === 0) {
    return <p className="text-sm text-zinc-500">No competitors found for this run.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
            <th className="py-2 pr-3 font-medium">Company / alternative</th>
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium">What they do</th>
            <th className="py-2 pr-3 font-medium">Positioning angle</th>
            <th className="py-2 pr-3 font-medium">Why they matter</th>
            <th className="py-2 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((c) => (
            <tr key={c.name} className="border-b border-zinc-100 align-top last:border-0">
              <td className="py-3 pr-3">
                <p className="font-semibold text-zinc-900">{c.name}</p>
                <SourceList urls={c.sourceUrls} />
              </td>
              <td className="py-3 pr-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[c.type]}`}>
                  {TYPE_LABELS[c.type]}
                </span>
              </td>
              <td className="py-3 pr-3 text-zinc-700">{c.whatTheyDo}</td>
              <td className="py-3 pr-3 text-zinc-700">{c.positioning}</td>
              <td className="py-3 pr-3 text-zinc-700">{c.whyMatters}</td>
              <td className="py-3">
                <ConfidenceBadge level={c.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
