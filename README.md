# source.cuvetsmo.com

> Verified Thai medical knowledge — citation-grade, faculty-approved, anti-AI-hallucination by construction.

Phase 0 of the **verified knowledge platform** wedge in the CUVETSMO ecosystem. All 8 architectural primitives shipped — ready for faculty onboarding.

**Current state:** 43 drugs across 11 therapeutic classes · 132 citations (100% probed, 100% healthy) · 156 ATC + 41 RxNorm + 6 ICD-11 + 4 LOINC ontology codes · 1 W3C Verifiable Credential issued · 1 Ed25519 signature recorded · 25+ public routes serving · 175/175 content units pass Iron Rule 0 integrity checks.

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
| **0** | 8-primitive infrastructure + 43-drug catalog + 100% citation health + full provenance surfaces | ✅ shipped |
| **1** | First faculty signoffs (3-5 entries flip from amber pending to emerald canonical) | next |
| **2** | Expand to 100+ drugs · curriculum tagging · institutional API tier soft launch | |
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

Every dose, indication, contraindication that ships canonical (`reviewedBy !== null && signatures.length > 0`) must have a verifiable citation chain. Template/pending entries render with an amber "PENDING REVIEW — NOT FOR CLINICAL USE" banner and never claim authority. `scripts/verify.mjs` enforces the rule on every PR via GitHub Actions.

## Related

- [cuvetsmo.com](https://cuvetsmo.com) — main council site (community, cohort, events)
- [labs.cuvetsmo.com](https://labs.cuvetsmo.com) — experimental tools umbrella
- Future: `learn.cuvetsmo.com` (Duolingo-style learning, powered by this source)
- Future: `data.cuvetsmo.com` (DOI-minted dataset license layer)

## Reader surfaces (live at https://source.cuvetsmo.com after deploy)

| Path | What it is |
|---|---|
| `/` | Editorial hero + 8-primitive surfaces grid |
| `/drugs` | 43 entries grouped by 11 therapeutic classes |
| `/drugs/<slug>` | Per-drug detail with sticky sidebar (trust stamp, signatures, ontology, mirror, drafting) |
| `/drugs/class/<slug>` | 11 therapeutic class browse pages with prev/next nav |
| `/search` | Client-side filter (status + class chips), works offline after PWA install |
| `/verify` + `/verify/<slug>` | Browser-side Ed25519 verification with animated emerald check on success |
| `/credentials` + `/credentials/<slug>` | W3C Verifiable Credentials, did:web root of trust |
| `/c/<cid>` | Content-addressed citation viewer with probe history |
| `/trust` | Chain-of-trust visualization (DID → keys → credentials + entries) |
| `/log` | Append-only transparency log |
| `/health` | Citation upstream-URL health dashboard (132/132 healthy) |
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
