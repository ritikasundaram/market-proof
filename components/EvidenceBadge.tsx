import type { Confidence, EvidenceTag } from "@/types/research";

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  high: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${CONFIDENCE_STYLES[level]}`}
    >
      {level} confidence
    </span>
  );
}

const EVIDENCE_STYLES: Record<EvidenceTag, string> = {
  "source-backed": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inference: "bg-sky-50 text-sky-700 ring-sky-200",
  "weak-claim": "bg-amber-50 text-amber-700 ring-amber-200",
  "needs-review": "bg-rose-50 text-rose-700 ring-rose-200",
};

const EVIDENCE_LABELS: Record<EvidenceTag, string> = {
  "source-backed": "Source-backed",
  inference: "Inference",
  "weak-claim": "Weak claim",
  "needs-review": "Needs review",
};

export function EvidenceBadge({ tag }: { tag: EvidenceTag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${EVIDENCE_STYLES[tag]}`}
    >
      {EVIDENCE_LABELS[tag]}
    </span>
  );
}

/** Derives the badge from confidence + whether live URLs back the claim. */
export function evidenceTagFor(confidence: Confidence, hasLiveSource: boolean): EvidenceTag {
  if (hasLiveSource && confidence === "high") return "source-backed";
  if (!hasLiveSource) return confidence === "low" ? "needs-review" : "inference";
  return confidence === "low" ? "weak-claim" : "source-backed";
}
