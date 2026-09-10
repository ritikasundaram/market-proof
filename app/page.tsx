import { ResearchForm } from "@/components/ResearchForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50">
      <main className="w-full max-w-2xl flex-1 px-5 py-12 sm:py-16">
        <div className="mb-8 text-center">
          <p className="mb-2 inline-block rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
            Multi-agent market research
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Market Proof
          </h1>
          <p className="mt-2 text-lg font-medium text-zinc-700">
            AI market research with receipts.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
            Research a SaaS market or category, find competitors, and surface buyer pains —
            then see exactly which parts are backed by evidence, which are inference, and
            what a human should verify before using.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <ResearchForm />
        </div>

        <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["8 specialized agents", "Planner, category, competitor, pain, SEO, verifier, scorer, and synthesis — each with a typed job."],
            ["Evidence first", "Every claim carries confidence, source links, and weak-claim warnings."],
            ["Export ready", "Copy the report or download it as Markdown with audit notes attached."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="font-semibold text-zinc-900">{title}</p>
              <p className="mt-1 text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="w-full border-t border-zinc-200 py-4 text-center text-xs text-zinc-400">
        Market Proof — a portfolio project. Scores are interpretive guidance, not precise measurements.
      </footer>
    </div>
  );
}
