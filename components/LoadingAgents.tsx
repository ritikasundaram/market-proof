"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Planning research",
  "Searching live sources",
  "Studying category",
  "Finding competitors",
  "Extracting buyer pains",
  "Checking evidence",
  "Creating report",
];

/**
 * Visual-only staged loader. The API is a single POST, so progress is
 * simulated on a timer — each stage lights up in turn until the report
 * arrives or an error occurs. Honest copy ("working through…"), no fake
 * percentages that imply real backend streaming.
 */
export function LoadingAgents() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => (a < STAGES.length - 1 ? a + 1 : a));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" role="status" aria-label="Research in progress">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        <p className="text-sm font-medium text-zinc-800">
          Researching your market — this takes ~30–60 seconds.
        </p>
      </div>
      <ol className="space-y-2.5">
        {STAGES.map((stage, i) => (
          <li key={stage} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                i < active
                  ? "bg-emerald-100 text-emerald-700"
                  : i === active
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i < active ? "✓" : i + 1}
            </span>
            <span className={i <= active ? "text-zinc-800" : "text-zinc-400"}>{stage}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-zinc-400">
        Running planner, researcher, verifier, and synthesis agents. You can wait here — the
        report appears automatically.
      </p>
    </div>
  );
}
