# cuvetsmo-source MCP server

The **machine surface** of [source.cuvetsmo.com](https://source.cuvetsmo.com) — the verified veterinary drug data plane for the CUVETSMO ecosystem.

The website is the human-readable surface. This MCP server is the surface that **AI agents** read, so any agent in the ecosystem (cuvetsmo.com/chat, VetOS, or Claude directly) can ground answers about veterinary drugs in cited, cross-checked data instead of hallucinating — Iron Rule 0 at ecosystem scale.

```
                    ┌────────────── consumers (ecosystem) ──────────────┐
   cuvetsmo.com/chat · VetMock · imaging · VetOS · labs · Claude Desktop
                    └───────────────────────┬───────────────────────────┘
                          MCP tools (this) · REST /api · ontology codes
                    ┌───────────────────────┴───────────────────────────┐
                    │  ◆ source.cuvetsmo.com — one source of truth       │
                    │  content/drugs/*.json + data/ontology/*.json       │
                    └────────────────────────────────────────────────────┘
```

## One source of truth

This server reads the **same on-disk files the website builds from** —
`../content/drugs/*.json` and `../data/ontology/*.json`. It keeps no separate
database, no fork, no cache of the content. Change a drug entry in the repo and
the next server start reflects it. That is what makes `source` a data *plane*
(one truth, many surfaces) rather than N drifting copies.

## Tools

| Tool | Purpose |
|---|---|
| `search_drugs` | Find drugs by name (EN/TH), brand, ATC code, or indication. Returns summaries + verification tier + source URL. |
| `get_drug` | Full verified entry for one drug — mechanism, indications, contraindications, dosing by species, interactions, monitoring, citations. |
| `get_by_code` | Look up by WHO ATC (exact or class-level prefix) or RxNorm CUI. **The join key** that lets other surfaces reference a drug and resolve it back to source. |
| `list_classes` | Therapeutic classes with drug counts. |
| `verify_citation` | Confirm a citation id exists + is content-addressed + its source URL. The core trust primitive. |
| `catalog_stats` | Data-plane health: drug/class counts, ontology coverage, tier breakdown, citation total. |

Every result includes source URLs + verification tier so the calling agent can
cite back to source.cuvetsmo.com.

## Build & run

```bash
cd mcp
npm install
npm run build      # tsc -> dist/
npm run smoke      # exercises all tool logic + class-drift guard vs lib/classify.ts
```

The server speaks MCP over **stdio** (the universal transport).

## Wire into a client

**Claude Code** — add to `.mcp.json`:

```json
{
  "mcpServers": {
    "cuvetsmo-source": {
      "command": "node",
      "args": ["C:/Users/palmz/Desktop/cuvetsmo-source/mcp/dist/index.js"]
    }
  }
}
```

**Claude Desktop** — same block in `claude_desktop_config.json`.

After connecting, an agent can call e.g. `search_drugs("canine NSAID")` →
`get_drug("meloxicam")` → `verify_citation("meloxicam", "fda-metacam")` and
answer with a citation chain that resolves to source.cuvetsmo.com.

## Keeping in sync with the website

`src/data.ts` mirrors the `verificationTier` + therapeutic-class logic from
`lib/drugs.ts` + `lib/classify.ts` (duplicated, not imported, because the web
is a Next/CommonJS graph behind the `@/` alias and this is a standalone ESM
package). `npm run smoke` includes a **drift guard**: if any drug classifies
to no class, the class rules here are out of sync with the website — update
`CLASS_RULES` in `src/data.ts` to match.

## Roadmap

- HTTP/SSE transport for remote ecosystem surfaces (cuvetsmo.com/chat server-side).
- `get_by_indication` once indications are structured beyond free text.
- npm publish as `cuvetsmo-source-mcp` for one-line install across the ecosystem.
