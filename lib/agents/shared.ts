/**
 * Shared prompt rules injected into every agent's system prompt.
 *
 * Keeps the output honest, specific, and marketer-readable across agents
 * without duplicating the same paragraphs in seven files.
 */
export const GLOBAL_STYLE_RULES = `Writing rules:
- Use simple, specific language. Name companies, features, prices, and buyer roles concretely.
- NEVER use buzzwords or vague filler: no "unlock potential", "revolutionize", "seamless", "cutting-edge", "next-generation", "supercharge", "game-changer", "holistic", "leverage synergies".
- Prefer short sentences a busy marketer can skim.

Honesty rules:
- Distinguish what is backed by the provided search context from what is inference or general model knowledge.
- If the search context does not support a claim, set confidence to "low" and say so in the source note (e.g. "model knowledge only, verify before use").
- NEVER invent URLs. Only cite URLs that appear in the provided search context. If none apply, return an empty sourceUrls array.
- It is better to return fewer, well-supported items than many vague ones.`;

export function briefBlock(brief: {
  query: string;
  category?: string;
  buyer?: string;
  region?: string;
  goal?: string;
  context?: string;
}): string {
  const lines = [`Research request: "${brief.query}"`];
  if (brief.category) lines.push(`Category: ${brief.category}`);
  if (brief.buyer) lines.push(`Target buyer: ${brief.buyer}`);
  if (brief.region) lines.push(`Region: ${brief.region}`);
  if (brief.goal) lines.push(`Research goal: ${brief.goal}`);
  if (brief.context) lines.push(`Extra context: ${brief.context}`);
  return lines.join("\n");
}
