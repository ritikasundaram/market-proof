import type { PainTheme } from "@/types/research";
import { ConfidenceBadge, evidenceTagFor, EvidenceBadge } from "./EvidenceBadge";
import { SourceList } from "./SourceList";

export function BuyerPainCard({ pains }: { pains: PainTheme[] }) {
  if (pains.length === 0) {
    return <p className="text-sm text-zinc-500">No pain themes found for this run.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pains.map((p) => (
        <article key={p.pain} className="rounded-xl border border-zinc-200 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-900">{p.pain}</h3>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            <ConfidenceBadge level={p.confidence} />
            <EvidenceBadge tag={evidenceTagFor(p.confidence, p.sourceUrls.length > 0)} />
          </div>
          <blockquote className="border-l-2 border-sky-300 pl-3 text-sm italic text-zinc-700">
            “{p.buyerPhrase}”
          </blockquote>
          <p className="mt-2 text-sm text-zinc-600">
            <span className="font-medium text-zinc-800">Why it matters: </span>
            {p.whyItMatters}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            <span className="font-medium text-zinc-800">Marketing implication: </span>
            {p.marketingImplication}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Evidence: {p.evidenceNote}</p>
          <SourceList urls={p.sourceUrls} />
        </article>
      ))}
    </div>
  );
}
