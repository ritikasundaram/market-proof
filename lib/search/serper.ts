/**
 * Serper search provider (default for MVP).
 *
 * Serper is a fast Google Search API: one call returns organic results with
 * titles, links, and snippets — no scraping needed. Auth uses the
 * `X-API-KEY` header. `num` caps results per query so one report costs a
 * predictable handful of searches (free tier: 2,500 credits, no card).
 *
 * Docs: https://serper.dev
 */
import type { SearchResult } from "@/types/research";
import type { SearchProvider } from "./provider";

interface SerperOrganicHit {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  position?: number;
  source?: string;
}

interface SerperResponse {
  organic?: SerperOrganicHit[];
}

export class SerperSearchProvider implements SearchProvider {
  readonly name = "serper";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify({ q: query, num: maxResults }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Serper HTTP ${res.status}`);
      }

      const data = (await res.json()) as SerperResponse;
      return (data.organic ?? [])
        .filter((hit) => typeof hit.link === "string" && hit.link.startsWith("http"))
        .slice(0, maxResults)
        .map((hit) => ({
          title: hit.title ?? hit.link ?? "Untitled",
          url: hit.link as string,
          snippet: hit.snippet ?? "",
          // Optional enrichment when Serper provides it; agents ignore
          // undefined fields, so this stays backward compatible.
          ...(hit.source ? { source: hit.source } : {}),
          ...(hit.date ? { date: hit.date } : {}),
          ...(typeof hit.position === "number" ? { rank: hit.position } : {}),
        }));
    } finally {
      clearTimeout(timeout);
    }
  }
}
