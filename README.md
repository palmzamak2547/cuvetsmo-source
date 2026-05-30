# source.cuvetsmo.com

> Verified Thai veterinary drug knowledge — every claim cited to authoritative sources and cross-checked, traceable line by line.

The **verified data plane** of the CUVETSMO ecosystem: one source of truth (`content/drugs/*.json` + `data/ontology/*.json`) served three ways — website, public REST API, and an MCP server any agent can call.

**Current state:** 195 drugs across 31 therapeutic classes, with 732 cited references and 457 ATC + 72 RxNorm + 6 ICD-11 + 4 LOINC ontology codes. Every entry is **◆ Verified** — cited and cross-checked across ≥2 authoritative sources — and 393 content units pass the Iron Rule 0 integrity gate (`scripts/verify.mjs`) on every push.

**Trust model — cited compilation.** Authority comes from the cited sources, not from a model. Every dose, indication, and contraindication links to an authoritative reference (Merck/MSD Veterinary Manual, FDA/EMA labels, WHO ATC, VSSO, ACVIM/AAHA, peer-reviewed studies) and is cross-checked across at least two. The single headline tier is **◆ Verified**. The cryptographic faculty-signature + Verifiable-Credential infrastructure below remains in the schema as a dormant, optional future tier — no entry currently carries a faculty signature.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the design, [CONTRIBUTING.md](./CONTRIBUTING.md) for the editorial workflow, [FACULTY-ONBOARDING.md](./FACULTY-ONBOARDING.md) for the 30-minute first-signature flow, [CHANGELOG.md](./CHANGELOG.md) for the milestone timeline.

## Position

In an era where AI commoditizes generation, the scarce resource is **trust**. This site emits a Thai-language medical knowledge layer where every claim has:

- **Citation chain** linking back to peer-reviewed source, regulatory database, or textbook
- **Mirror provenance** showing exactly which authoritative source the structured data came from
- **Faculty signoff** with named reviewer, title, department, affiliation, date
- **Cryptographic signature** by the reviewer's Ed25519 key — verifiable in any reader's browser
- **Ontology codes** (ATC, RxNorm, ICD-11, LOINC) so EHRs, AI agents, and research datasets can join on stable IDs
- **AI-in-loop policy** — AI drafts, never authors; every canonical claim has an accountable human

ChatGPT, Plumb's, Wikipedia, and MIMS each have one or two of these. None has all six.

## 8 primitives, shipped

| # | Primitive | Where it lives |
|---|---|---|
| 1 | Cryptographic provenance (Ed25519) | `lib/sign.ts`, `lib/verify-client.ts`, `scripts/sign.mjs`, `/verify` UI |
| 2 | Content-addressed citations (SHA-256 CID) | `lib/cid.ts`, `content/citations/<cid>.json`, `/c/<cid>` route |
| 3 | AI in loop, never authority | `CONTRIBUTING.md`, `drafting` schema, `scripts/verify.mjs` lint |
| 4 | ZK-ready Verifiable Credentials | `lib/did.ts`, `lib/vc.ts`, `scripts/issue-vc.mjs`, `/credentials` UI |
| 5 | Medical ontology backbone | `lib/ontology.ts`, `data/ontology/atc.json`, `rxnorm-vet.json`, `icd11-vet.json`, `loinc-vet.json` |
| 6 | Inverted API economics | `lib/auth.ts`, public `/api/*` endpoints, 402 dataset placeholder |
| 7 | Git-native content + PR review | `content/drugs/<slug>.json`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/verify-content.yml` |
| 8 | Offline PWA | `public/sw.js`, `public/manifest.webmanifest`, `/search` route, `ServiceWorkerRegister` |

## Sources we mirror

- **NLM DailyMed** — FDA structured product labeling (public domain, U.S.)
- **WHO Essential Medicines List** — CC BY-NC-SA 3.0 IGO
- **Thai FDA (อย.)** — Thai government open data
- **PubChem** — NIH, public domain
- **ATC Classification (WHO)** — free with attribution
- **WSAVA Guidelines** — free for educational use

See `/sources` page for the full curation methodology.

## Roadmap

| Phase | What | Status |
|---|---|---|
| **0** | 8-primitive infrastructure + cited-compilation catalog (195 drugs, 31 classes, 732 cited references) + MCP data-plane server (stdio + HTTP) + full provenance surfaces | ✅ shipped |
| **1** | Optional faculty signoffs (entries can flip from ◆ Verified to an emerald expert tier) · wire MCP into cuvetsmo.com/chat + VetOS | next |
| **2** | Curriculum tagging · institutional API tier soft launch · new therapeutic classes (urinary incontinence, piprants, etc.) | |
| **3** | Flashcard / SRS / quiz mode (the LEARN pillar bolts on) | |
| **4** | WebGPU LLM (Phi-3 / Llama 3.2) opt-in for client-side Thai translation suggestions | |
| **5** | BBS+ signatures for true ZK selective disclosure | |
| **6** | Stripe metered billing + DOI minting + Sigstore Rekor integration | |
| **7** | Expand verticals: toxicology, anatomy, clinical chemistry | |
| **8** | ASEAN expansion · open-source spec replication | |

## Stack

- **Next.js 16** + **React 19** + **Tailwind 4** + TypeScript strict
- **Web Crypto API** (Ed25519, SHA-256) for browser-side verification
- **Node crypto** (Ed25519) for build-time signing
- Flat JSON content under `content/` — no backend in Phase 0
- Deploy: Vercel + Cloudflare DNS at `source.cuvetsmo.com`

## Iron Rule 0

This project is governed by Iron Rule 0: **no fabrication**.

Every dose, indication, and contraindication must trace to a cited authoritative source — `scripts/verify.mjs` fails the build on any dangling citation or any clinical claim that lacks a source (`checkSourceTraceability`), and is enforced on every push via GitHub Actions + a local pre-push hook. Each entry is cross-checked across ≥2 sources before it ships as **◆ Verified**. As with any drug reference, confirm the dose against a textbook or clinical judgement before real-world use.

## Related

- [cuvetsmo.com](https://cuvetsmo.com) — main council site (community, cohort, events)
- [labs.cuvetsmo.com](https://labs.cuvetsmo.com) — experimental tools umbrella
- Future: `learn.cuvetsmo.com` (Duolingo-style learning, powered by this source)
- Future: `data.cuvetsmo.com` (DOI-minted dataset license layer)

## Reader surfaces (live at https://source.cuvetsmo.com after deploy)

| Path | What it is |
|---|---|
| `/` | Editorial hero + 8-primitive surfaces grid |
| `/drugs` | 195 entries grouped by 31 therapeutic classes |
| `/drugs/<slug>` | Per-drug detail with sticky sidebar (trust stamp, signatures, ontology, mirror, drafting) |
| `/drugs/class/<slug>` | 31 therapeutic class browse pages with prev/next nav |
| `/search` | Client-side filter (status + class chips), works offline after PWA install |
| `/verify` + `/verify/<slug>` | Browser-side Ed25519 verification with animated emerald check on success |
| `/credentials` + `/credentials/<slug>` | W3C Verifiable Credentials, did:web root of trust |
| `/c/<cid>` | Content-addressed citation viewer with probe history |
| `/trust` | Chain-of-trust visualization (DID → keys → credentials + entries) |
| `/log` | Append-only transparency log |
| `/health` | Citation upstream-URL health dashboard |
| `/mcp` | MCP data-plane server (stdio + streamable-HTTP) — `cuvetsmo-source-mcp` package under `mcp/` |
| `/about` | 8-primitive technology explainer + "are we first?" research with 11 cited sources |
| `/use-cases` | 8 user personas across 3 adoption tiers + Defi-failure comparison |
| `/onboarding` | Faculty walkthrough (~30 min first time, ~5 min per entry after) |
| `/changelog` | Site-level milestone timeline |
| `/privacy` | Cookie-free, no-analytics, no-tracking stance |
| `/assist` | Faculty translation editor (manual today + WebGPU LLM Phase 5 roadmap) |
| `/api` | Public API documentation |
| `/api/drugs`, `/api/by-code`, `/api/keys/<kid>`, `/api/log`, `/api/health` | JSON endpoints (CORS-enabled, edge-cached) |
| `/sitemap.xml` + `/robots.txt` | SEO infrastructure |

## Dev

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # typecheck + content integrity lint (use before every commit)
npm run build        # production build
npm run mirror       # probe upstream citation URLs (records SHA-256 of body, never stores body)
```

### CLIs

```bash
node scripts/keygen.mjs <kid> --display "Name"       # generate Ed25519 keypair
node scripts/sign.mjs <slug> --signer <kid>          # sign a drug entry
node scripts/issue-vc.mjs --issuer-kid ... --type ... --claims '{...}' --out <path>
node scripts/seed-drugs.mjs                          # bulk-generate pending entries from config
node scripts/mirror.mjs [--slug X] [--skip-recent N] # probe citation URLs for upstream health
node scripts/verify.mjs                              # full content integrity check
```
