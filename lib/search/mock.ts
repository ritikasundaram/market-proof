/**
 * Fallback search provider used when no API key is configured or every
 * search call fails. Returns no results so agents must label their output
 * "model knowledge only, verify before use."
 */
import type { SearchProvider } from "./provider";

export class NoopSearchProvider implements SearchProvider {
  readonly name = "none";

  async search(): Promise<[]> {
    return [];
  }
}
