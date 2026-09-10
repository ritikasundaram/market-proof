"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { FinalResearchResponse } from "@/types/research";
import {
  loadReport,
  readError,
  readPending,
  subscribeToReportEvents,
} from "@/lib/store/research-store";
import { LoadingAgents } from "@/components/LoadingAgents";
import { ResultsDashboard } from "@/components/ResultsDashboard";

/**
 * Results page states:
 * - report in storage → dashboard
 * - error in storage → error card with retry link
 * - fresh pending flag (form just submitted) → staged loader
 * - otherwise → empty state with a link home
 */
export default function ResultsPage() {
  const [report, setReport] = useState<FinalResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  // True once we have checked storage at least once (client mount).
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setReport(loadReport());
    setError(readError());
    setWaiting(readPending());
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Initial storage read + event subscription. sessionStorage is an
    // external system, so syncing it here is a legitimate effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const unsub = subscribeToReportEvents(refresh);
    // Re-check the pending flag in case this tab missed the start event.
    const timer = setInterval(refresh, 2000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [refresh]);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50">
      <main className="w-full max-w-4xl flex-1 px-5 py-8 sm:py-10">
        {report ? (
          <ResultsDashboard report={report} />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">Research failed</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Try again
            </Link>
          </div>
        ) : !hydrated ? null : waiting ? (
          <div className="space-y-5">
            <LoadingAgents />
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">No report yet</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Start a research brief on the home page and the report will appear here.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Start research
            </Link>
          </div>
        )}

        {!report && !error && (
          <p className="mt-6 text-center">
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700">
              ← Back to home
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
