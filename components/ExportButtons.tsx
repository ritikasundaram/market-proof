"use client";

import { useState } from "react";
import type { FinalResearchResponse } from "@/types/research";
import { buildMarkdown, copyText, downloadMarkdown } from "@/lib/utils/markdown";

export function ExportButtons({ report }: { report: FinalResearchResponse }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(buildMarkdown(report));
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  };

  const onDownload = () => {
    const slug = (report.plan.category || "market-research")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    downloadMarkdown(`market-proof-${slug || "report"}.md`, buildMarkdown(report));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onCopy}
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {copied ? "Copied!" : "Copy report"}
      </button>
      <button
        onClick={onDownload}
        className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Export as Markdown
      </button>
      {!copied && (
        <span className="sr-only" role="status">
          Copy the full report markdown to clipboard
        </span>
      )}
    </div>
  );
}
