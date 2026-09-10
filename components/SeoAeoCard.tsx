import type { SeoOutput } from "@/types/research";
import { ConfidenceBadge } from "./EvidenceBadge";

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-zinc-400">—</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function QAList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-zinc-400">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function SeoAeoCard({ seo }: { seo: SeoOutput }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ConfidenceBadge level={seo.confidence} />
        <span className="text-xs text-zinc-400">{seo.sourceNote}</span>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-800">Likely keywords</h3>
        <ChipList items={seo.keywords} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">Buyer questions</h3>
          <QAList items={seo.buyerQuestions} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">Comparison topics</h3>
          <QAList items={seo.comparisons} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">Educational content</h3>
          <QAList items={seo.educationalTopics} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">FAQ ideas</h3>
          <QAList items={seo.faqs} />
        </div>
      </div>
      <div className="rounded-xl bg-sky-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-sky-900">
          AEO — questions for answer engines
        </h3>
        <QAList items={seo.aeoQuestions} />
      </div>
    </div>
  );
}
