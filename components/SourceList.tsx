/**
 * Renders a deduplicated list of source URLs as clickable links.
 * Only renders http(s) URLs — never model-hallucinated lookalikes.
 */
export function SourceList({ urls }: { urls: string[] }) {
  const safe = [...new Set(urls)].filter((u) => u.startsWith("http"));
  if (safe.length === 0) {
    return <p className="text-xs italic text-zinc-400">No live sources for this claim.</p>;
  }
  return (
    <ul className="mt-2 space-y-1">
      {safe.map((url) => (
        <li key={url} className="truncate text-xs">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 underline decoration-sky-200 underline-offset-2 hover:decoration-sky-500"
          >
            {hostOf(url)}
          </a>
        </li>
      ))}
    </ul>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
