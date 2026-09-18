/**
 * Client-side report store: in-memory React context + sessionStorage.
 *
 * MVP persistence is deliberately backend-free: the report survives a
 * refresh or a navigation to /results, but nothing leaves the browser.
 *
 * Because the research POST starts on the landing page and finishes on
 * /results, this module also exposes `publishReport` / `publishError` plus
 * `subscribeToReportEvents`. The form publishes; the results page
 * subscribes. One storage key, one event name, no prop drilling.
 *
 * Future Supabase path: keep these exported function names and swap the
 * sessionStorage calls for Supabase queries. Components stay unchanged.
 */
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { FinalResearchResponse } from "@/types/research";

const STORAGE_KEY = "market-proof:report:v1";
const ERROR_KEY = "market-proof:error:v1";
const PENDING_KEY = "market-proof:pending:v1";
const EVENT_NAME = "market-proof:report-ready";

/**
 * How long after "Generate" we still consider a request in flight. Generous
 * on purpose: provider rate-limit backoffs can push a run past 3 minutes,
 * and the loader should not flip to "No report yet" mid-run.
 */
const PENDING_TTL_MS = 5 * 60 * 1000;

interface StoreValue {
  report: FinalResearchResponse | null;
  loading: boolean;
  error: string | null;
  saveReport: (r: FinalResearchResponse) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  clearReport: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

/** Reads a stored report without React (for empty-state redirects). */
export function loadReport(): FinalResearchResponse | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { response?: FinalResearchResponse };
    return parsed.response ?? null;
  } catch {
    return null;
  }
}

function writeReport(r: FinalResearchResponse): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, savedAt: new Date().toISOString(), response: r }),
    );
    sessionStorage.removeItem(ERROR_KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage unavailable — in-memory state still works for this session.
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

function writeError(message: string): void {
  try {
    sessionStorage.setItem(ERROR_KEY, message);
    // A published error always belongs to the current run — never keep a
    // stale report around it, or the results page would show the old report
    // and hide the failure entirely.
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function readError(): string | null {
  try {
    return sessionStorage.getItem(ERROR_KEY);
  } catch {
    return null;
  }
}

/**
 * Called by the research form the moment a request starts. Sets the pending
 * flag so the results page can tell "still researching" apart from "nothing
 * requested" — and clears any previous report/error, because a new run
 * invalidates them. Without the clear, the results page would show the OLD
 * report during (and after a failed) new run, which reads as "nothing ran".
 */
export function markRequestStarted(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(ERROR_KEY);
    sessionStorage.setItem(PENDING_KEY, String(Date.now()));
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

/** True when the form kicked off a request within the TTL window. */
export function readPending(): boolean {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < PENDING_TTL_MS;
  } catch {
    return false;
  }
}
/** Called by the research form when the API responds successfully. */
export function publishReport(r: FinalResearchResponse): void {
  writeReport(r);
}

/** Called by the research form when the API call fails. */
export function publishError(message: string): void {
  writeError(message);
}

/** Called by the results page to refresh when a report lands. */
export function subscribeToReportEvents(cb: () => void): () => void {
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
}

export function ResearchProvider({ children }: { children: React.ReactNode }) {
  const [report, setReport] = useState<FinalResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from sessionStorage on first mount (client-only). Reading
  // browser storage is an external-system sync, which is what effects are for.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReport(loadReport());
  }, []);

  const saveReport = useCallback((r: FinalResearchResponse) => {
    setReport(r);
    writeReport(r);
  }, []);

  const clearReport = useCallback(() => {
    setReport(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(ERROR_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <Ctx.Provider
      value={{ report, loading, error, saveReport, setLoading, setError, clearReport }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useResearchStore(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useResearchStore must be used inside <ResearchProvider>");
  return ctx;
}
