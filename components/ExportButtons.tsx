"use client";

import type { FinalResearchResponse } from "@/types/research";

export function ExportButtons({ report }: { report: FinalResearchResponse }) {
  const title = report.final.title || report.plan.category || "market-research";
  const onPrint = () => {
    if (title) document.title = `Market Proof — ${title}`.slice(0, 120);
    window.print();
  };

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        onClick={onPrint}
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Export dashboard as PDF
      </button>
      <span className="sr-only" role="status">
        Prints the dashboard exactly as shown; choose Save as PDF in the print dialog
      </span>
    </div>
  );
}
