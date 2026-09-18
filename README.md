<<<<<<< HEAD
# Market Proof — AI market research with receipts

Market Proof helps B2B SaaS marketers research a market and shows **which parts of the
AI-generated research are trustworthy, weak, or need human review**.

Enter a brief like *"Research the AI recruiting software market for mid-market
companies"* and get a structured report: category summary, competitor map, buyer pains,
messaging patterns, positioning opportunities, SEO/AEO topics — plus a **research
quality score, source notes, weak-claim warnings, and a human review checklist**.

This is a portfolio project built to learn Next.js, API routes, structured prompting,
simple agent orchestration, and eval/rubric thinking.

## Why I built it

AI report generators are easy; trusting them is hard. Most tools dump a confident wall
of text with no provenance. Market Proof separates four things other tools blur:

1. **What the AI found** — the findings, in plain marketer language.
2. **What is backed by evidence** — source URLs from live web search, per claim.
3. **What is inference** — labeled as such, with confidence levels.
4. **What is weak or uncertain** — flagged by a dedicated verifier agent, with a
   human checklist of what to verify before publishing.

The verification layer is the product, not a footnote.

## How the agent workflow works

One API route receives the brief. A small orchestrator (no framework) runs the agents:

```
brief → planner → live search (Serper) → 4 parallel researchers
      → verifier → rubric scorer → synthesis → report + scores + warnings
```

| Agent | File | Job |
|---|---|---|
| Planner | `lib/agents/planner.ts` | Defines category, likely buyer, tasks, source types |
| Category | `lib/agents/category.ts` | Explains the market in plain language |
| Competitor | `lib/agents/competitor.ts` | Maps direct / indirect / status-quo alternatives |
| Customer pain | `lib/agents/customerPain.ts` | Pains in buyer language + marketing implications |
| SEO/AEO | `lib/agents/seoAeo.ts` | Keywords, buyer questions, comparisons, FAQs |
| Verifier | `lib/agents/verifier.ts` | Flags unsupported/weak claims, bad URLs, review checklist |
| Scorer | `lib/ai/rubric.ts` | Deterministic 1–10 scores per dimension (no LLM cost) |
| Synthesis | `lib/agents/synthesis.ts` | Writes the final marketer-facing report |

Key design choices:

- **Search once, share everywhere.** One batched Serper pass grounds all four
  researchers. Agents may only cite URLs from that bundle — anything else is
  flagged. If search fails or no key is set, the whole report is honestly labeled
  *"model knowledge only, verify before use."*
- **Structured outputs end-to-end.** Every agent returns Zod-validated JSON
  (OpenAI uses strict structured outputs; Gemini uses JSON mode plus local
  Zod validation). Invalid output degrades to a low-confidence fallback —
  the pipeline returns a complete, honestly low-scoring report instead of
  crashing on one bad agent, and fails loudly only if all agents fail.
- **Swappable seams.** Agents depend on an `LLMProvider` interface (Gemini now,
  OpenAI implemented, Anthropic stub ready) and a `SearchProvider` interface (Serper now). Replacing
  the orchestrator with LangGraph later means reimplementing one function:
  `runResearchPipeline`.

## The research quality layer

Scores are **interpretive rubric scores (1–10)**, computed deterministically in
`lib/ai/rubric.ts` — read that file to see exactly why a report scores what it does:

- **Competitor coverage** — 10 = direct + indirect + status-quo with specifics;
  1 = vague or irrelevant.
- **Source quality** — 10 = mostly live, credible URLs; 1 = no live sources.
- **Buyer pain specificity** — 10 = concrete pains in buyer language
  ("we spend Fridays reading 200 resumes"); 1 = generic ("increase productivity").
- **Evidence coverage** — share of claims carrying URLs from the search bundle.
- **Marketing usefulness** — can a marketer act on this tomorrow?
- **Overclaiming risk** — low / medium / high, driven by verifier flags and search status.

The UI makes this visible with badges (`Source-backed`, `Inference`, `Weak claim`,
`Needs review`), a score card, a warnings panel, and a collapsible "how this was
researched" trace.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Gemini (`gemini-3.5-flash-lite`, via Google's OpenAI-compatible endpoint) behind a provider interface
- Serper search API (~5 searches/report, 2,500 free) behind a provider interface
- Zod for brief validation + agent output schemas
- No database, no auth — reports persist in-memory + `sessionStorage` (see
  `lib/store/research-store.tsx`, shaped for a future Supabase swap)
- Hosted on Vercel

## Run locally

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY; SERPER_API_KEY optional but recommended
npm run dev                  # http://localhost:3000
```

Without `SERPER_API_KEY` the app still works — reports are labeled model-knowledge-only.

To preview the results UI without spending API credits, import
`fixtures/sample-response.json` into `sessionStorage` under the
`market-proof:report:v1` key as `{ "version": 1, "response": <fixture.response> }`
(e.g. via devtools) and open `/results`.

## Environment variables

| Var | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Powers all agents |
| `GEMINI_MODEL` | no | Default `gemini-3.5-flash-lite` |
| `LLM_PROVIDER` | no | `gemini` (default), `openai`, or `anthropic` (stub) |
| `OPENAI_API_KEY` | only for `openai` | Alternative provider key |
| `OPENAI_MODEL` | no | Default `gpt-4o-mini` |
| `SEARCH_PROVIDER` | no | `serper` (default) |
| `SERPER_API_KEY` | recommended | Live sources; 2,500 free searches |
| `SEARCH_MAX_RESULTS` | no | Hits per query (default 5) |

## Project structure

```
app/                  landing page, results dashboard, POST /api/research
components/           form, loader, score card, tables, badges, export
lib/agents/           7 researcher/verifier/synthesis prompt + runner modules
lib/ai/               provider interface, Gemini + OpenAI impls, orchestrator, rubric, schemas
lib/search/           provider interface, Serper impl, query builder
lib/store/            report store (sessionStorage now, Supabase-ready shape)
lib/utils/            markdown export builder
types/                shared contracts (mirrored by Zod schemas)
fixtures/             sample report for UI development
```

## Future improvements (not built)

- Supabase saved reports + shareable links (store module is shaped for it)
- SSE streaming so the loader reflects real agent progress
- Exa/Firecrawl content extraction for deeper citations
- Eval fixture set with expected competitors per market
- Side-by-side model comparison, per-agent cost/time footer, PDF export

## Honest limitations

- Model knowledge + snippets are not primary research; every report says what to verify.
- Scores guide judgment; they don't measure truth.
- A 30–60s single-POST pipeline is a deliberate MVP tradeoff over streaming infra.
=======
# market-proof
>>>>>>> d10cb6f92583d9488b115cdc23d6d968f4f8e286
