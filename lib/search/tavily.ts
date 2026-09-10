/**
 * Tavily search provider (default for MVP).
 *
 * Tavily is purpose-built for AI agents: one call returns ranked results
 * with snippets and URLs, no scraping needed. We use `search_depth: "basic"`
 * (1 credit per call) to stay inside the free tier (1,000 credits/month).
 *
 * Docs: https://docs.tavily.com/documentation/api-reference/endpoint/search
 */
import type { SearchResult } from "@/types/research";
import type { SearchProvider } from "./provider";

interface TavilyHit {
  title?: string;
  url?: string;
  content?: string;
  snippet?: string;
  score?: number;
}

interface TavilyResponse {
  results?: TavilyHit[];
}

export class TavilySearchProvider implements SearchProvider {
  readonly name = "tavily";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: "basic",
          max_results: maxResults,
          include_answer: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Tavily HTTP ${res.status}`);
      }

      const data = (await res.json()) as TavilyResponse;
      return (data.results ?? [])
        .filter((hit) => typeof hit.url === "string" && hit.url.startsWith("http"))
        .slice(0, maxResults)
        .map((hit) => ({
          title: hit.title ?? hit.url ?? "Untitled",
          url: hit.url as string,
          snippet: hit.content ?? hit.snippet ?? "",
        }));
    } finally {
      clearTimeout(timeout);
    }
  }
}
