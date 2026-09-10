/**
 * Search provider interface.
 *
 * The orchestrator depends only on this interface, so Tavily can be swapped
 * for Exa, Serper, or a mock without touching agents or the API route.
 */
import type { SearchResult } from "@/types/research";

export interface SearchProvider {
  /** Human-readable name for logs and report metadata. */
  readonly name: string;
  /** Returns up to `maxResults` hits for one query. Throws on failure. */
  search(query: string, maxResults: number): Promise<SearchResult[]>;
}
