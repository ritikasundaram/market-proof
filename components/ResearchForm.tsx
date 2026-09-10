"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useResearchStore, publishReport, publishError, markRequestStarted } from "@/lib/store/research-store";

const inputCls =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none";

export function ResearchForm() {
  const router = useRouter();
  const { loading, setLoading, setError } = useResearchStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [buyer, setBuyer] = useState("");
  const [region, setRegion] = useState("");
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const fillExample = () => {
    setQuery("Research the AI recruiting software market for mid-market companies.");
    setCategory("AI recruiting software");
    setBuyer("VP Talent Acquisition at 200-2000 person companies");
    setRegion("North America");
    setGoal("Messaging and positioning for a new entrant");
    setShowOptional(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 10 || loading) return;
    setLoading(true);
    setError(null);
    markRequestStarted();
    // Navigate immediately so the loading checklist shows while we wait.
    router.push("/results");

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, category, buyer, region, goal, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Research failed. Please try again.");
      }
      publishReport(data);
    } catch (err) {
      publishError(err instanceof Error ? err.message : "Research failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <div>
        <label htmlFor="query" className="mb-1 block text-sm font-medium text-zinc-700">
          Research brief
        </label>
        <textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          required
          minLength={10}
          placeholder="Research the AI recruiting software market for mid-market companies."
          className={`${inputCls} min-h-24 resize-y`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
        >
          {showOptional ? "Hide optional fields" : "Add optional context"}
        </button>
        <button
          type="button"
          onClick={fillExample}
          className="text-sm font-medium text-sky-700 underline underline-offset-4 hover:text-sky-900"
        >
          Try an example
        </button>
      </div>

      {showOptional && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-700">
              Product / category
            </label>
            <input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="AI recruiting software" className={inputCls} />
          </div>
          <div>
            <label htmlFor="buyer" className="mb-1 block text-sm font-medium text-zinc-700">
              Target buyer
            </label>
            <input id="buyer" value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="VP Talent, 200-2000 employees" className={inputCls} />
          </div>
          <div>
            <label htmlFor="region" className="mb-1 block text-sm font-medium text-zinc-700">
              Region
            </label>
            <input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="North America" className={inputCls} />
          </div>
          <div>
            <label htmlFor="goal" className="mb-1 block text-sm font-medium text-zinc-700">
              Research goal
            </label>
            <input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Messaging for a new entrant" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="context" className="mb-1 block text-sm font-medium text-zinc-700">
              Extra context
            </label>
            <textarea id="context" value={context} onChange={(e) => setContext(e.target.value)} rows={2} placeholder="Anything else: pricing model, competitors you already know, ICP notes…" className={`${inputCls} resize-y`} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || query.trim().length < 10}
        className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Researching…" : "Generate market research"}
      </button>
      <p className="text-center text-xs text-zinc-400">
        Takes ~30–60 seconds. Reports are grounded with live web sources when available.
      </p>
    </form>
  );
}
