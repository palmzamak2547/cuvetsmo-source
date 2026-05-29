# ARCHITECTURE.md — source.cuvetsmo.com

> The 8-primitive synthesis. Why it is unprecedented, how it composes, and the 6-week build order.

---

## The bet (one sentence)

In an era where AI lets anyone fabricate medical content in seconds, the scarce resource is **verifiable trust** — so we build the world's first knowledge platform where every Thai medical claim ships with cryptographic provenance, content-addressed citations, a publicly enforced "AI is never the authority" policy, and the ontology codes that make it queryable by any downstream system.

If it works, we own the trust layer that AI cannot synthesize and giants will not bother to build.

---

## Why these 8, and why together

Each primitive on its own already exists somewhere:

- Sigstore signs container images
- IPFS content-addresses files
- W3C Verifiable Credentials carry attestations
- RxNorm + ATC + SNOMED CT + LOINC + ICD-11 anchor clinical data
- Stripe sells API tier upgrades
- GitHub does PR review

The unprecedented part is composing all of them into **one editorial pipeline** for medical knowledge in Thai, where:

| Primitive | Defends against |
|---|---|
| 1. Cryptographic provenance | "AI wrote this and you can't tell" |
| 2. Content-addressed citations | "the source URL 404'd / was edited" |
| 3. AI in loop, never authority | regulatory liability + Iron Rule 0 |
| 4. ZK-proof of license validity | impersonation of credentialed reviewer |
| 5. Medical ontology backbone | data silo / not machine-queryable |
| 6. Inverted API economics | "free riders extract, contributors get nothing" |
| 7. Git-native + PR review | invisible edits, no audit trail |
| 8. Offline PWA + client-side AI | clinic with no internet, no API surveillance |

Strip any one out and the bet weakens. ChatGPT has none of them. Plumb's has 3 (citations, editorial review, some structure). Wikipedia has 2 (edit history, citations). We will be alone with all 8.

---

## Primitive 1 — Cryptographic provenance

### What
Every canonical drug entry ships with a detached Ed25519 signature from the faculty reviewer. Signatures are logged to a tamper-evident append-only log (Sigstore-style transparency log, or a simpler git-tracked log in MVP).

### What it buys
- Reader can verify in their browser, with no network call, that **this exact byte sequence** of clinical data was signed by **this specific faculty member**.
- If anyone tampers with the JSON after merge, the signature breaks. Visible to all readers, not just maintainers.
- An attacker who compromises the website cannot retroactively swap data — they would need the faculty private key, which lives offline.

### Implementation pattern

```
content/drugs/meloxicam.json                ← canonical data (UTF-8 normalized)
content/signatures/meloxicam.ekkapol.sig    ← detached Ed25519 over hash of above
content/keys/ekkapol.pub                    ← faculty public key, committed to repo
content/log/2026-05-meloxicam-v1.log        ← signed entry: { contentHash, sigHash, ts, signerId }
```

- `lib/sign.ts` — Web Crypto API (`crypto.subtle.sign('Ed25519', key, hash)`)
- `lib/verify.ts` — runs in browser; verifies signature against pub key on the entry page
- `app/verify/page.tsx` — public UI; user pastes slug, sees green checkmark + signer name + timestamp + content hash

### MVP cut (Week 2)
- Sign by hand from a CLI script (`scripts/sign.ts`) — faculty does not need to install anything; we sign on their behalf after they email "approved" with a hash they computed independently from a script we provide.
- Transparency log = a single git-tracked append-only file. Tamper-evidence comes from the git history itself.

### Stretch (Week 5+)
- Real Sigstore Fulcio / Rekor integration (each signature ends up in a public log)
- Hardware-key-backed signing (YubiKey for faculty)

### Honest tradeoffs
- Faculty almost certainly will NOT manage their own keys at first. We custody keys at the platform on their behalf, with an explicit signed delegation. State this transparently in `/about-trust`.
- Sigstore Rekor mainnet integration costs nothing but adds a dependency on an external public log. Acceptable.

---

## Primitive 2 — Content-addressed citations

### What
Every citation has a SHA-256 hash of the cited content. The platform mirrors a snapshot of the cited source at the time of mirror, so even if the original URL dies or mutates, the cited bytes are still retrievable from `/c/<cid>`.

### What it buys
- "Citation rot" disappears. Every claim is anchored to bytes, not URLs.
- Readers can verify the cited content matches the hash claimed in the entry — no trust required.
- Researchers can cite us forever without worrying that "the link will break in 5 years".

### Implementation pattern

```
content/citations/<cid>.json   ← { sourceUrl, mirroredAt, contentType, bytesPath, hash }
content/citations/<cid>.bytes  ← raw mirrored bytes (PDF, HTML, etc.)
```

- `app/c/[cid]/page.tsx` — content-addressed URL. Renders mirrored bytes + provenance card ("originally from dailymed.nlm.nih.gov on 2026-05-27, hash matches").
- `lib/cid.ts` — `sha256(bytes)` helper, `lookupByCID(cid)`, `mirrorRemote(url) → cid`.
- `scripts/mirror.ts` — CLI to fetch + hash + store a new citation source.

### MVP cut (Week 1)
- Mirror only public domain sources (DailyMed, WHO EML, PubChem, Thai FDA open data).
- Store bytes in repo if small (< 1 MB), in Cloudflare R2 if larger, with the R2 path itself content-addressed.
- Skip IPFS pinning for now — git-tracked + R2 is good enough, ships in days not weeks.

### Stretch
- IPFS pinning via Pinata / Web3.Storage for permanent distributed availability
- Wayback Machine cross-reference as a third independent witness

### Honest tradeoffs
- We are NOT republishing copyrighted content. Citations beyond fair-use snippet length get a metadata stub (title, authors, hash, no body), and the body lives only in the original source. Hash still verifies if reader brings their own copy.
- Storage cost scales linearly with citations. Budget: < $5/month for the first 1000 entries × ~5 citations each.

---

## Primitive 3 — AI in loop, never as authority

### What
AI is a tool inside the editorial pipeline (translation drafting, summarization, ontology code suggestion, citation candidate ranking). It is **never** the named source of a canonical claim. Every canonical entry has a human reviewer recorded; AI-drafted text must be marked, audited, and signed off by that human before it can land.

### What it buys
- Regulatory clarity. We can stand in front of a regulator and say "no canonical claim on this site was authored by an AI; humans are accountable for every word."
- Aligns with Palm's Iron Rule 0 verbatim. This is the principle, encoded in code + CI + UI.
- Differentiation from every AI-first product on the market.

### Implementation pattern

```
content/drugs/<slug>.json includes:
  "drafting": {
    "aiAssisted": true | false,
    "aiModel": "claude-sonnet-4.7" | "gpt-4" | null,
    "aiPrompt": "<the literal prompt used for the draft>",
    "humanReviewer": "ekkapol.akb",
    "humanReviewedAt": "2026-06-15T...",
    "humanEditsRatio": 0.62   // fraction of bytes the human changed vs AI draft
  }
```

- `CONTRIBUTING.md` — policy doc, prominent. "AI may draft, must not author. Reviewer must read every line and either edit or strike."
- `scripts/lint-ai-policy.ts` — CI lint that fails if:
  - any canonical entry has `aiAssisted: true` AND `humanEditsRatio < 0.1`
  - any canonical entry is missing `humanReviewer`
  - any entry references a citation that does not exist
- `app/drugs/[slug]/page.tsx` — UI badge shows "AI-assisted draft (62% human-edited)" when applicable. Transparent, not hidden.

### MVP cut (Week 3)
- Policy doc + UI badge + CI lint. Conservative `humanEditsRatio` calc (byte diff over total).

### Stretch
- LLM-vs-human-text classifier as a second-line check (e.g., GPTZero-style)
- Per-section authorship granularity (this paragraph was AI, this one was human)

### Honest tradeoffs
- `humanEditsRatio` is a heuristic, not a guarantee. Determined adversary can paraphrase AI output to evade. The point is to make the *default flow* honest, not to defeat motivated fraud.
- We accept that AI-assisted drafting will accelerate content production. The discipline is that it never *publishes* without human authority.

---

## Primitive 4 — ZK-proof of license validity (the hard one)

### What
Faculty reviewer proves they hold a valid Thai veterinary license without revealing the license number. Built on W3C Decentralized Identifiers + Verifiable Credentials, ZK selective disclosure on top.

### What it buys
- Privacy. Faculty's license number is sensitive PII (it is published on the regulator's site but we don't have to mirror it here).
- Impersonation defense. A bad actor can claim "I am Dr. X" but cannot produce a valid VC issued to Dr. X's DID by the cuvetsmo issuer.
- Future-proof for cross-institution federation. SLU, KU, MU, KKU faculty can each be issuers of their own credentials, all verifiable here.

### Implementation pattern

```
content/keys/<faculty-id>.did     ← DID document (W3C spec)
content/credentials/<id>.vc.jwt   ← issued VC, claims like { type: "VetLicense", country: "TH", status: "valid" }
lib/did.ts                        ← DID resolution
lib/vc.ts                         ← VC issuance / verification (jose / didkit-wasm)
app/verify/[did]/page.tsx         ← public verification of a faculty member's credentials
```

### MVP cut (Week 5)
- **VC without ZK.** Plain signed JSON-LD credentials. Faculty's license status is `valid` or `revoked`, revealed in clear. This is already better than "trust the website".
- Issuer = cuvetsmo board, signing key offline, rotation policy documented.

### Stretch (Week 6)
- BBS+ signatures on the VCs (RFC ongoing) so reviewer can prove "license valid" without revealing issue date, license number, or any other field
- Polygon ID integration for on-chain attestation if we want institutional partners to verify without API calls to us

### Honest tradeoffs
- **Real ZK circuits are expensive engineering.** A custom circom circuit is a 1–2 month project. BBS+ via off-the-shelf libraries is 1–2 weeks. We MVP with plain VC, ship BBS+ later. Stay honest in the UI: "ZK selective disclosure: roadmap" until shipped.
- Most readers will not care about ZK. The privacy benefit accrues to faculty, who will care. Frame accordingly.

---

## Primitive 5 — Medical ontology backbone (in Thai)

### What
Every entity (drug, condition, procedure, lab test, organism) carries cross-references to the canonical machine-readable codes used by the rest of the medical world.

### What it buys
- **Interoperability.** A hospital's EHR can pull our content keyed by ATC code. A research dataset can join on RxNorm CUI. A toxicology tool can lookup by LOINC.
- **No-code search and filter.** "Show me all NSAIDs" = filter by ATC class M01A. "All drugs with hepatic clearance" = filter by linked SNOMED finding.
- **Translation anchor.** When we translate to Thai, the codes stay stable. The English source updates? We diff against codes, not strings.

### Implementation pattern

```typescript
// extend the Drug schema with a `codes` block
type OntologyCodes = {
  rxnorm?: { cui: string; name: string }      // US drug code
  atc?: { code: string; name: string; level: number }  // WHO drug class
  snomed?: { sctid: string; name: string }    // clinical term
  loinc?: { code: string; name: string }      // lab test code (rare for drugs, common for tests)
  icd11?: { code: string; name: string }      // condition code
  vetspecial?: { code: string; system: 'AVMA' | 'CUVET' }  // species-specific, our extension
}
```

- `lib/ontology.ts` — type definitions, lookup helpers, validation against external code lists
- `data/ontology/atc.json` — local copy of ATC tree (small, ~6000 entries)
- `data/ontology/rxnorm-vet.json` — vet-relevant RxNorm subset
- API endpoint: `GET /api/by-code?system=atc&code=M01AC06` → returns matching entries

### MVP cut (Week 1)
- ATC + RxNorm + ICD-11 for the first 20 seed entries. SNOMED CT is licensed (free in Thailand under the WHO IGO agreement, but licensing paperwork takes weeks). LOINC is free, add later.
- Lookup endpoint, filter UI on `/drugs` page.

### Stretch
- Full SNOMED CT integration after licensing
- Thai SNOMED CT mappings (an active project at MoPH)
- AVMA species code system extension for veterinary specialization (our schema contribution back to the ecosystem)

### Honest tradeoffs
- Ontology mappings are tedious. AI can draft them, faculty must verify. Same Iron Rule 0 discipline as content.
- SNOMED CT licensing is non-trivial. We can start without it and add when paperwork clears.

---

## Primitive 6 — Inverted API economics

### What
Public read is free forever. Institutional write (push a curated dataset back to us) and bulk dataset access are paid. Revenue flows back to the contributing department.

### What it buys
- Aligned incentives. Faculty department gets paid when their reviewed entries are accessed at scale. They review more. Quality compounds.
- Defensive moat. Free-rider extractors can still scrape, but they cannot contribute (and the contributing path is where the trust signal is concentrated).
- Sustainable funding model that does not depend on grants or ads.

### Implementation pattern

```
public read:
  GET /api/drugs              ← unlimited, cached at edge
  GET /api/drugs/[slug]       ← unlimited
  GET /api/by-code            ← rate-limited to 1000/day per IP
  GET /api/search             ← rate-limited

institutional write / bulk:
  POST /api/contribute        ← signed VC required, returns dataset DOI
  GET  /api/dataset/<slug>    ← API key required, billed per request
  GET  /api/bulk-export       ← API key required, sub-licensed dataset
```

- `lib/auth.ts` — API key validation (Stripe-issued, mapped to institution)
- `lib/billing.ts` — usage metering, batched to Stripe usage records
- `app/api/contribute/route.ts` — accepts signed contributions, queues for PR
- `app/admin/revenue/page.tsx` — internal dashboard, per-department revenue split

### MVP cut (Week 3)
- API key model with a hardcoded allowlist (no Stripe integration yet). Public read works fully.
- Paid tier is a placeholder page: "API access for institutions, contact us." Real billing comes later.

### Stretch
- Stripe metered billing live
- Per-department revenue dashboard with payout automation
- Dataset DOI minting via DataCite

### Honest tradeoffs
- Building Stripe metered billing right is 1–2 weeks of careful work. Punt to Week 6+ if other primitives slip.
- Some institutions (Chula included) cannot easily pay external SaaS subscriptions. Provide a research-collaboration alternative: free institutional access in exchange for committing N reviewers per year.

---

## Primitive 7 — Git-native content + PR-based review

### What
Content lives as flat JSON files in `content/`. Editorial review = GitHub Pull Request. Every change has a git commit with a real human name. Faculty reviewers are GitHub users.

### What it buys
- **The audit trail is free.** Git history IS the changelog. Every diff is reviewable by anyone forever.
- Familiar to anyone who has ever contributed to open source. Lower onboarding cost for tech-curious faculty + students.
- Branch-based parallel work. Five reviewers can work on five entries simultaneously without stepping on each other.
- Free hosting on GitHub. Free CI on GitHub Actions. Free public review forum on the PR thread.

### Implementation pattern

```
content/
  drugs/<slug>.json        ← canonical entries (flat, one file each, easy to diff)
  citations/<cid>.json     ← citation metadata
  keys/<faculty>.pub       ← faculty signing public keys
  credentials/<id>.vc.jwt  ← faculty VCs (license attestations)
  ontology/                ← code system local mirrors

.github/
  PULL_REQUEST_TEMPLATE.md ← checklist: cited? signed? ontology coded? AI policy met?
  workflows/
    verify-content.yml     ← runs lint-ai-policy + verify-signatures + ontology-check on every PR
    publish.yml            ← on merge to main, rebuild + redeploy
```

- `scripts/new-entry.ts` — interactive CLI that scaffolds a new entry from template + opens a PR
- `scripts/review.ts` — fetches PR, runs all checks locally, prints reviewer-ready report

### MVP cut (Week 1)
- Move existing `data/seed/meloxicam.json` to `content/drugs/meloxicam.json` (no other change).
- Add `.github/PULL_REQUEST_TEMPLATE.md` with the 4-item checklist.
- Add `verify-content.yml` GitHub Action running `tsc --noEmit` + content lint.

### Stretch
- Bot account that opens a PR per pending entry, auto-runs all checks, awaits faculty signoff via PR review.
- Slack / Line integration so reviewers get notified.
- Side-by-side diff UI on the website that shows the editorial change history per entry.

### Honest tradeoffs
- Faculty are not, in general, GitHub users. We need an editorial UI that pushes commits on their behalf. MVP path: trusted maintainer commits on faculty behalf after email signoff (still signed by faculty key via our offline pipeline). Stretch path: web UI that wraps git via Octokit.

---

## Primitive 8 — Offline PWA + WebGPU client AI

### What
The whole site works offline after first visit. Service worker caches the entire content tree. Optional client-side LLM (Llama 3.2 1B or Phi-3 mini) runs in the browser via WebGPU for translation suggestions, summarization, and answer-from-knowledge-base — never reaching our servers.

### What it buys
- **Clinic that loses internet still has the knowledge base.**
- **Privacy.** Vet asking "what's the equine sedation protocol?" never sends that query to a server.
- **Cost.** Inference cost is the user's hardware, not our API budget.
- Future-proof if browser AI continues to commoditize (which it is).

### Implementation pattern

```
public/sw.js                       ← service worker, cache-first with revalidation
app/manifest.json                  ← PWA manifest, installable
lib/client-llm.ts                  ← WebLLM wrapper, model selection, IndexedDB cache
app/(client)/chat/page.tsx         ← client-only chat UI, all inference in-browser
```

- WebLLM ([github.com/mlc-ai/web-llm](https://github.com/mlc-ai/web-llm)) — production-grade WebGPU LLM runtime
- Model: Llama 3.2 1B (1.2 GB, runs on any modern laptop) or Phi-3-mini-instruct (2.4 GB, smarter)
- Embeddings: `transformers.js` with `bge-small` (60 MB) for semantic search over local content
- Cache strategy: precache all canonical content JSON + critical UI; lazy-load citation bodies on demand

### MVP cut (Week 4)
- PWA manifest + service worker caching all `/content/drugs/*` JSON + UI shell.
- Embeddings-based semantic search (in-browser) over canonical entries.
- Skip WebGPU LLM until Week 5+ — it's a substantial UX problem (model download, progress UI, memory limits, fallback).

### Stretch
- WebGPU LLM with model selector (1B / 3B / 7B based on device)
- Voice input (Web Speech API)
- Background sync to refresh content when online again

### Honest tradeoffs
- First-visit model download is 1–2 GB. Must be opt-in with clear UX. Default = read entries offline, chat with local LLM is a separate "install AI assistant" button.
- WebGPU is desktop-class as of 2026. Mobile coverage is improving but uneven. Graceful degrade to server-only for unsupported browsers.

---

## How they compose

```
                  ┌──────────────────────────────┐
   Authoritative │  DailyMed, WHO EML, Thai FDA,  │  ← Primitive 2 mirrors source bytes,
   open sources  │  PubChem, ATC, WSAVA, etc.     │    content-addresses them
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Mirror snapshot (CID stored) │  ← /c/<cid> serves bytes forever
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │  AI-assisted Thai draft      │  ← Primitive 3: AI drafts, never authors
                  │  (Claude / GPT, model logged)│
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │  Pull Request opened         │  ← Primitive 7: git-native
                  │  - lint-ai-policy            │  ← Primitive 3: CI enforces
                  │  - verify-citations          │  ← Primitive 2: CIDs must resolve
                  │  - ontology-codes-required   │  ← Primitive 5: codes must validate
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │  Faculty reviewer            │  ← Primitive 4: VC proves license
                  │  - reads + edits Thai        │
                  │  - signs Ed25519 over hash   │  ← Primitive 1: detached signature
                  │  - signature → transparency  │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │  Merge → publish.yml         │
                  │  - prebuild + deploy to edge │
                  │  - precache for PWA          │  ← Primitive 8: offline read
                  └──────────────┬───────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        ┌─────────┐        ┌──────────┐       ┌──────────┐
        │ Reader  │        │ Hospital │       │ Research │
        │ free    │        │ EHR API  │       │ dataset  │
        │ + PWA   │        │ paid     │       │ paid     │
        │ + LLM   │        │ tier     │       │ + DOI    │
        └────┬────┘        └────┬─────┘       └────┬─────┘
             │                  │                  │
             └──────────────────┴──────────────────┘
                                │
                          ← Primitive 6: read free, write/bulk paid,
                            revenue to contributing department
```

---

## Week-by-week build order

### Week 1 — Foundation (schema + structure)
**Goal: every primitive's data shape exists in the repo, even if behaviors are MVP-stubs.**

- Move `data/seed/` → `content/drugs/`. One file per entry.
- Extend `Drug` schema: add `codes` (Primitive 5), `drafting` (Primitive 3), `mirrorCIDs` (Primitive 2), `signatures[]` (Primitive 1), `reviewer.did` (Primitive 4).
- Wire `lib/cid.ts` + `app/c/[cid]/page.tsx` for content-addressed lookup.
- Wire `lib/ontology.ts` + first 20 ATC + RxNorm codes for the 1 seed entry.
- `.github/PULL_REQUEST_TEMPLATE.md` + `verify-content.yml` GitHub Action.
- Deploy to `source.cuvetsmo.com` via Vercel (quota reset).

**Demo at end of week:** `/drugs/meloxicam` renders with ATC + RxNorm codes visible, citation links resolve to `/c/<cid>` mirrored bytes, PR template enforces the checklist.

### Week 2 — Verification (Primitive 1 hardening)
**Goal: cryptographic signing is real.**

- `lib/sign.ts` + `lib/verify.ts` (Ed25519 via Web Crypto).
- `scripts/sign.ts` CLI for offline signing.
- `content/keys/cuvetsmo-board.pub` committed.
- `content/log/` transparency log (single file, append-only, git-tracked).
- `/verify` public page where anyone can paste a slug + see signature, signer, content hash, timestamp.
- Sign the seed entry as a demo (cuvetsmo board acting as faculty surrogate; replaced once real faculty onboards).

**Demo:** browser-side signature verification works with no server roundtrip.

### Week 3 — Process (Primitives 3 + 6 MVP)
**Goal: AI policy and API tiering are enforced.**

- `CONTRIBUTING.md` finalized. AI-in-loop policy explicit.
- `scripts/lint-ai-policy.ts` + CI integration. Fails the build if violated.
- `humanEditsRatio` calculated and stored at PR time.
- UI badge on entry page: "AI-assisted draft (Nh% human-edited)" or "Human-authored".
- `lib/auth.ts` + API key allowlist (no Stripe yet).
- Rate limits on free public read (1000/day per IP).
- Placeholder `/api/dataset` returning 402 + "contact" link.

**Demo:** opening a PR with unmarked AI-generated content fails CI. API rate limit visible on 1001st request.

### Week 4 — Client (Primitive 8 MVP)
**Goal: site works offline. Search runs in the browser.**

- `public/sw.js` + cache-first precaching of canonical content + UI shell.
- `app/manifest.json` + install prompt.
- `transformers.js` + `bge-small` embeddings precomputed at build time and shipped to client.
- In-browser semantic search over entries.
- Defer WebGPU LLM to Week 5+ as stretch.

**Demo:** open site, install as PWA, turn off wifi, search "meloxicam" — works.

### Week 5 — Hard primitives (4 + 8 stretch)
**Goal: VC issuance, WebGPU LLM, ontology breadth.**

- W3C DID + VC pipeline. `lib/did.ts` + `lib/vc.ts`.
- Issue test VC to the seed reviewer DID, verify on `/verify/[did]`.
- WebLLM integration (Phi-3 mini, opt-in "install AI assistant").
- Expand ontology coverage: ICD-11 + LOINC, ~50 more entries seeded from DailyMed.

### Week 6 — Polish + production hardening
**Goal: handoff to first real faculty reviewer.**

- Faculty onboarding doc + sign-and-submit workflow.
- 5–10 real canonical entries (PRRSV-relevant + NSAIDs + ATB pillars).
- Performance pass (Lighthouse, Web Vitals).
- Final security review: CSP, key handling, R2 access policies.
- Public launch announcement draft.

---

## Out of scope / non-goals (be explicit)

- **No real-time chat assistant.** Static content + opt-in client-side LLM only. We are not a chatbot product.
- **No paid subscriptions for individual readers.** Public read stays free forever. The economics flow through institutions.
- **No user accounts for casual readers.** Sign in only required for API key holders and reviewers.
- **No content fork from Wikipedia / Plumb's / proprietary databases.** Every entry traces back to a source whose license permits redistribution.
- **No clinical advice in pending entries.** Amber banner enforced, render-time guard. Iron Rule 0 visible everywhere.
- **No general medicine.** Veterinary scope only at launch. Human-medicine expansion is roadmap, not MVP.

---

## Stability + ease-of-use constraint

Every PR is reviewed against this checklist before merge:

1. Does it ship behind a feature flag if it touches reader-visible behavior?
2. Does it degrade gracefully if a dependency fails (no signature → show entry, no internet → PWA)?
3. Is the new primitive opt-in for contributors (no breaking changes to existing entry shape)?
4. Are error states designed (not just happy path)?
5. Did we run `pnpm typecheck` and `pnpm test` locally?
6. Does it survive a network partition mid-request?
7. Is there a one-paragraph note in `CHANGELOG.md` about user-observable change?

For ease-of-use:

1. Faculty reviewer can sign off in < 5 minutes per entry (most steps automated).
2. New entry can be scaffolded from CLI in one command.
3. Reader can verify a signature without installing anything.
4. PWA install is one click.
5. API consumer can integrate read API in < 10 lines of code.
6. Mistakes are recoverable (PR, not DELETE).
7. Documentation is in the repo, versioned with the code.
8. Help is one keystroke away (`?` on every page).

---

## Risks + mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Faculty refuses to use git / VCs / signing | High | Maintainer-mediated signing with offline approval. UI layer wraps git for faculty. |
| Sigstore / Rekor outage breaks verification | Medium | Verification is offline-first. Public log is for tamper-evidence, not real-time trust. |
| WebGPU not supported on reviewer's device | Low | LLM is opt-in stretch. Core read works without it. |
| SNOMED CT licensing delays | Medium | Ship without SNOMED. Add after license arrives. Don't block on it. |
| Mirror sources change ToS | Medium | Diversify sources. Public domain first. Document license per source. |
| Vercel quota / cost growth | Low | Static content cached aggressively at edge. Move to Cloudflare Pages if needed. |
| ZK circuits too complex for MVP | High | Ship VC without ZK. Frame "ZK selective disclosure: Q3 roadmap". |
| Faculty key compromise | Critical | Key rotation policy. Revocation list in `content/keys/revoked.json`. New signatures use new key. Old signatures verifiable but marked "pre-rotation". |
| Citation source goes 404 | Low | Primitive 2 mirrors bytes at first cite. We are insulated. |
| Single maintainer (Palm) bus factor | High | Document everything. CONTRIBUTING.md. Onboarding doc. Backup admin from cuvetsmo board. |

---

## Success criteria for the 6-week moonshot

By end of Week 6:

- [ ] All 8 primitives have a working MVP slice in production
- [ ] 5+ canonical entries with real faculty signoffs (not seed surrogate)
- [ ] Public verification works in any modern browser
- [ ] PWA installable, works offline
- [ ] One institutional API consumer (could be webcuvetsmo itself, calling `/api/drugs`)
- [ ] CONTRIBUTING.md polished enough that a new reviewer can onboard in < 1 hour
- [ ] CI passes on every merge; no canonical entry ever shipped without signature + citations + ontology codes
- [ ] Lighthouse score > 95 on all primary pages
- [ ] No P0 advisor warnings from any tool we run (Supabase, Vercel, dependency audit)

**Stretch:**

- [ ] WebGPU LLM working for at least one workflow (Thai-EN translation suggestion)
- [ ] Stripe metered billing live for institutional API tier
- [ ] BBS+ signatures for VC (real ZK selective disclosure)
- [ ] 20+ canonical entries

---

## Why now

Three forces converge in 2026:

1. **AI commoditizes generation.** Trust scarcity rises proportionally.
2. **Browser cryptography matured.** Web Crypto API, WebGPU, transformers.js, WebLLM all production-ready.
3. **Medical interoperability standards consolidated.** FHIR + SNOMED + RxNorm + ICD-11 are the *de facto* lingua franca.

A platform that synthesizes them does not need to invent any single component. It needs to compose them correctly with editorial discipline. That is the moat.

We are early to compose. That is the bet.

---

*Document version: 1.0 — 2026-05-27*
*Synthesized from Palm's founder-vision session (6 primitives) + platform synthesis (6 primitives) → 8 primitives total. Not a wishlist. Each primitive has a Week N MVP and is in the build queue.*
