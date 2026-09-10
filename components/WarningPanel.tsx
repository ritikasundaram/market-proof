import type { VerificationOutput } from "@/types/research";

export function WarningPanel({ verification }: { verification: VerificationOutput }) {
  const total =
    verification.unsupportedClaims.length +
    verification.weakClaims.length +
    verification.invalidUrls.length;

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-rose-900">
        Weak claims & human review ({total} flag{total === 1 ? "" : "s"})
      </h2>
      <p className="mb-4 text-sm text-rose-700">
        Do not use flagged claims in messaging until a human verifies them.{" "}
        {verification.sourceQualityNotes}
      </p>

      {total === 0 && (
        <p className="text-sm text-rose-800">
          Nothing flagged — still spot-check key facts before publishing.
        </p>
      )}

      {verification.unsupportedClaims.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-semibold text-rose-900">Unsupported claims</h3>
          <ul className="space-y-2">
            {verification.unsupportedClaims.map((c) => (
              <li key={c.claim} className="rounded-lg bg-white/70 p-3 text-sm">
                <p className="font-medium text-zinc-900">“{c.claim}”</p>
                <p className="text-zinc-600">{c.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {verification.weakClaims.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-semibold text-rose-900">Weak claims</h3>
          <ul className="space-y-2">
            {verification.weakClaims.map((c) => (
              <li key={c.claim} className="rounded-lg bg-white/70 p-3 text-sm">
                <p className="font-medium text-zinc-900">“{c.claim}”</p>
                <p className="text-zinc-600">{c.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {verification.invalidUrls.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1 text-sm font-semibold text-rose-900">
            Suspicious URLs (not in search results — may be hallucinated)
          </h3>
          <ul className="list-disc pl-5 text-sm text-zinc-700">
            {verification.invalidUrls.map((u) => (
              <li key={u} className="break-all">{u}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-1 text-sm font-semibold text-rose-900">Human review checklist</h3>
        <ul className="space-y-1.5">
          {verification.humanChecklist.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-800">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-rose-300 bg-white text-[10px] text-rose-500">
                !
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
