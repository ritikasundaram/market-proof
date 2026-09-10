import type { ReactNode } from "react";

/** Shared card wrapper so every report section looks consistent. */
export function SectionCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        {badge}
      </div>
      {subtitle && <p className="mb-4 text-sm text-zinc-500">{subtitle}</p>}
      <div className={!subtitle ? "mt-3" : ""}>{children}</div>
    </section>
  );
}
