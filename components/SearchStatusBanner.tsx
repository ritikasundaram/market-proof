import type { SearchStatus } from "@/types/research";

export function SearchStatusBanner({
  status,
  sourcesCount,
}: {
  status: SearchStatus;
  sourcesCount: number;
}) {
  if (status === "live") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <span className="font-semibold">Grounded with {sourcesCount} live web sources.</span>{" "}
        Claims below are linked to the pages that back them.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="font-semibold">Model knowledge only — verify before use.</span>{" "}
      Live search was unavailable for this run, so nothing below is backed by fresh sources.
    </div>
  );
}
