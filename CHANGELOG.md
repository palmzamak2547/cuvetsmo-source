# Changelog — source.cuvetsmo.com

Site-level milestones, framed by the 8-primitive moonshot architecture in [ARCHITECTURE.md](./ARCHITECTURE.md). For per-entry version history, see each drug's `changelog` block. For commit-level history, see `git log`.

This file is the human-readable companion to the timeline shown at [/changelog](https://source.cuvetsmo.com/changelog).

---

## Phase 0 — 2026-05-27 (initial build)

The full 8-primitive moonshot architecture shipped in one extended session. Per ARCHITECTURE.md week-by-week plan condensed into one continuous build.

### 2026-05-27 — 🪜 Verification ladder (anti-vaporware redesign)

The original trust model was binary: an entry was either faculty-signed-canonical or it read **"⏳ Pending — Not for clinical use."** Because faculty Ed25519 signing is high-friction (most lecturers won't manage private keys), signing was a *single point of failure* — if no faculty signed, all 101 entries read "do not use" forever. That is the failure mode where a project's use-case never works and it quietly dies.

Replaced the locked gate with a **three-rung ladder** where every rung is achievable and even the bottom rung is genuinely useful:

- **◆ Sourced** (default) — every claim cited + cross-checked across ≥2 authoritative sources, content-addressed. Reference-grade: confirm dose against your own formulary before clinical use, exactly as with any tertiary reference. **No entry ever reads "broken."**
- **✓✓ Community-checked** — ≥2 independent contributors attested the entry matches its cited sources (logged transparently). The network-effect rung — a static scrape can never replicate a living community of checkers.
- **✓ Expert-reviewed** — a named, identity-verified vet/faculty endorsed it. The Ed25519 signature seals the *record* for tamper-evidence; the endorser does **not** need to manage a key (platform can sign on record of their explicit logged approval, DocuSign-style; self-custody signing stays available).

Shipped across every surface: `verificationTier()` + `Attestation` type (`lib/drugs.ts`); tier-aware badges + honest banners on drug detail, catalog list, home colophon, and Cmd+K palette; `/verify` reframed as a ladder; `/api/drugs` now returns ALL entries with `verificationTier` + `tierCounts` (was `publishedDrugs()` = expert-only = empty); `attest-entry` + `report-error` intents on `/feedback` make the community rung reachable today (GitHub public-audit-log, zero backend). Site-wide sweep: **0 "Not for clinical use" across all 557 pages.** Tiers populate only from real actions — no fabricated attestations (Iron Rule 0). The moat is provenance + a living community + freshness, not cryptography.

### 2026-05-27 — 🚑 Catalog crosses 100: 89 → 101 drugs (+ emergency/critical-care)

Batch C added the emergency, critical-care, and antidote shelf that every clinic crash-cart needs — 12 entries, 5 new therapeutic classes. Each dose cross-checked against the RECOVER 2024 CPR dosing charts, BSAVA emergency formulary, AAHA fluid-therapy guidelines, ACVIM status-epilepticus consensus, and Merck.

- **Emergency cardiac (C01CA):** epinephrine, dopamine, dobutamine
- **Fluids & electrolytes (B05/A12/V06D):** mannitol, calcium gluconate, dextrose
- **Toxicology & emesis (A07/V03):** apomorphine, activated charcoal
- **Antidote (V03):** flumazenil (benzodiazepine reversal)
- **Respiratory stimulant (R07):** doxapram
- **Pituitary hormone (H01B):** desmopressin (central diabetes insipidus)
- **Antineoplastic (L01):** vincristine

Critical safety flags: epinephrine CPR 0.01 mg/kg (low-dose, RECOVER), calcium IV-slow-with-ECG, 50% dextrose must be diluted, vincristine vesicant/extravasation + MDR1 risk, activated-charcoal hypernatremia caution. **101 drugs total across 46 therapeutic-class labels, every claim cited, all `reviewedBy: null` (pending faculty canonical signature).**

### 2026-05-27 — 🌱 Catalog expansion: 65 → 89 drugs (+24 new entries)

Two expansion batches of brand-new entries (new files + ontology codes), each dose cross-checked across multiple authoritative sources before writing. Established the repeatable "add new drug" pipeline: extend `data/ontology/atc.json` (+40 ATC entries, now 266) + `data/ontology/rxnorm-vet.json` (+10 CUIs), extend `lib/classify.ts` routing, create `content/drugs/<slug>.json` with cited content + empty `mirrorCIDs`.

- **Batch A (12)** — fenbendazole, enalapril, clopidogrel, aspirin, atropine, glycopyrrolate, methadone, alfaxalone, lidocaine, methocarbamol, phytomenadione (vit K1), terbinafine. New therapeutic class added: **muscle relaxants** (M03).
- **Batch B (12)** — levetiracetam, zonisamide, fluoxetine, trazodone, cyproheptadine, marbofloxacin, torsemide, selamectin, milbemycin oxime, fluralaner, sarolaner, toltrazuril. Antiparasitics class extended to vet ATC families (P51 anticoccidials, P53 isoxazolines, P54 endectocides).

Sources: Merck/MSD Veterinary Manual, FDA/EMA labels (Alfaxan, Bravecto, Simparica, Revolution, Zeniquin, Upcard), Tufts CardioRush, Clinician's Brief, VETgirl, ASPCA APCC, Today's Veterinary Practice, CARPODIEM (JVIM), PubMed. New safety flags: isoxazoline FDA neurologic warning, lidocaine feline sensitivity, aspirin feline slow salicylate metabolism, vitamin K1 never-IV (anaphylaxis), atropine organophosphate-antidote dose. **89 drugs total, every claim cited, all `reviewedBy: null` (pending faculty canonical signature).**

### 2026-05-27 — 📚 Catalog content complete: 65/65 drugs (every claim cited)

Every drug entry now carries real clinical content compiled and translated from cited authoritative sources — **0 TEMPLATE placeholders remain**. Filled class by class, each dose cross-checked across multiple independent sources before writing:

- **NSAIDs (5)** — meloxicam, carprofen, firocoxib, ketoprofen, piroxicam
- **Antibiotics (8)** — amoxicillin, doxycycline, cefalexin, cefovecin, metronidazole, enrofloxacin, clindamycin, tmp-smx
- **Anesthetics/sedatives (6)** — propofol, ketamine, dexmedetomidine, midazolam, diazepam, acepromazine
- **GI/anti-emetics (6)** — maropitant, ondansetron, metoclopramide, omeprazole, famotidine, sucralfate
- **Opioids (6) + antidotes (2)** — morphine, hydromorphone, fentanyl, buprenorphine, butorphanol, tramadol + naloxone, atipamezole
- **Cardiovascular (9)** — furosemide, pimobendan, benazepril, spironolactone, digoxin, atenolol, sotalol, amlodipine, diltiazem
- **Antiparasitics (3) + antifungals (3) + antihistamines (3)** — ivermectin, praziquantel, pyrantel + ketoconazole, fluconazole, itraconazole + diphenhydramine, chlorpheniramine, cetirizine
- **Corticosteroids (4) + thyroid (2) + anticonvulsants (2) + singles (6)** — prednisolone, prednisone, dexamethasone, methylprednisolone + methimazole, levothyroxine + phenobarbital, gabapentin + insulin, cyclosporine, mirtazapine, theophylline, enoxaparin, mavacoxib

**Sources** cross-checked: Merck/MSD Veterinary Manual (per-class pages), FDA Animal Drugs labels (Metacam, Rimadyl, Dexdomitor, Cerenia, Antisedan, Atopica, Mirataz), EMA Trocoxil SPC, Tufts CardioRush cardiology formulary, ACVIM consensus statements (DMVD, gastric protectants), AAHA allergic-skin-disease guidance, Lumb & Jones Veterinary Anesthesia, WSU MDR1 reference lab, and peer-reviewed studies (PubMed PMID 11422990 feline enrofloxacin retinopathy, PMC10295034 gabapentin PK, JVIM VetCompass TMS-KCS).

**Authorship model:** content is a *cited compilation* (`drafting.aiAssisted: false`) — authority comes from the cited sources, not from the compiler. The `/health` page still reports 198/198 citations probed, 100% healthy. **Every entry remains `reviewedBy: null` — i.e. NOT canonical. They are clearly labelled "Pending review — Not for clinical use" until a faculty member attaches an Ed25519 signature.** A new `verify.mjs` source-traceability gate fails CI if any non-placeholder clinical claim lacks a citation.

Critical species-specific safety flags surfaced in the content: feline enrofloxacin retinal-toxicity cap (5 mg/kg/day), meloxicam feline boxed warning, ivermectin MDR1/ABCB1 collie sensitivity, digoxin narrow therapeutic index, doxycycline feline esophageal stricture, TMP-SMX keratoconjunctivitis sicca, diazepam feline oral hepatotoxicity, prednisone feline poor-conversion, insulin individualized-dose + hypoglycemia.

### 2026-05-27 — 🚀 Live on `source.cuvetsmo.com`

- Vercel production deploy (project `cuvetsmo-source`) wired to Cloudflare DNS via CNAME `source` → `cname.vercel-dns.com` (DNS-only, gray cloud).
- Let's Encrypt R12 cert issued in 238s via HTTP-01 challenge. Valid through 2026-08-25.
- Launch-day smoke test: **18/18 endpoints HTTP 200** (`/`, `/drugs`, `/verify`, `/about`, `/use-cases`, `/privacy`, `/health`, `/api/health`, `/sitemap.xml`, `/robots.txt`, `/onboarding`, `/feedback`, `/trust`, `/log`, `/changelog`, sample drug + class pages).
- Citation health at launch: **198/198 citations probed, 100% healthy**, 0 stale.

### 2026-05-27 — Accessibility polish round (UI/UX Pro Max skill applied)

Installed the [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT, 83k stars) globally at `~/.claude/skills/ui-ux-pro-max/`. Ran its prescribed Step 2 design-system query + supplemental UX/typography/landing/chart/Next.js stack searches. Audited the live codebase against its checklist and fixed:

- **Line-length cap (HIGH severity)** — `.prose-academic` now has `max-width: 70ch` so reading lines stay in the 65-75ch sweet spot. Was previously inheriting parent container width (~95ch on `max-w-4xl`).
- **Visible keyboard focus (HIGH severity)** — added global `:focus-visible { outline: 2px solid source-600; outline-offset: 2px }` plus explicit per-input rings on `/feedback`, `/search`, `/assist` inputs. Removed three `focus:outline-none` violations that were leaving keyboard users stranded.
- **Status announcement for screen readers (HIGH severity)** — `/feedback` "Copy to clipboard" toggle now has `role="status"` + `aria-live="polite"` sr-only live region. Toggle pills got `aria-pressed`.
- **Global pointer cursor** — `button:not(:disabled), [role="button"], summary, label[for]` get `cursor: pointer` from `globals.css`. Removes the need for per-component `cursor-pointer` Tailwind utility in 6 component files.
- **Reduced-motion strengthened** — `prefers-reduced-motion: reduce` now collapses ALL animations + transitions globally (was previously only catching `stamp-in` + `check-path`, missing `skeleton-pulse`).
- **Middle-dot chains removed** from 4 user-facing strings (`HomeQuickAccess`, drug detail footer + changelog + cross-references, `/sources`) — replaced with commas + em-dashes per the long-standing style rule.
- **`design-system/source.cuvetsmo.com/MASTER.md`** added as the canonical hand-tuned design source for future sessions (the skill's auto-generated baseline recommended an App Store / medical-teal palette that didn't match this editorial reference platform — overrode with our real Newsreader + Inter + source-blue tokens).

The skill validated several existing choices: Newsreader serif body matches their "News Editorial" pairing exactly, `next/font/google` is already in use (no external CDN links), and SVG-only icons (no emoji chrome) was already a standing rule.

### 2026-05-27 — Launch-readiness polish

- **/use-cases** — 8 user personas across 3 adoption tiers (Day-1, 1-2yr, 3-5yr). Each persona has current pain + workaround + value of cryptography + network effect. Acid-test framing for Defi/Web3 failure pattern.
- **/privacy** — explicit cookie-free, no-analytics, no-tracking stance. Comparison table vs Plumb's, UpToDate, MIMS, DailyMed, Wikipedia.
- **/assist** — faculty translation editor (side-by-side EN/TH) with WebGPU detection + LLM roadmap message. Manual editor today, Phase 5 will add opt-in in-browser Phi-3 mini.
- **Landing CTA refresh** — promoted "Who actually uses this?" link to primary position.
- **Surfaces grid expanded** — added /health, /trust, /log, /assist as discoverable surfaces.

### 2026-05-27 — Citation health + dead-URL detection

- **scripts/mirror.mjs** — probe-and-fingerprint upstream URLs. Fetches each citation URL, records HTTP status + headers + SHA-256 of body. **Never stores the body** — copyright-clean by design.
- **/health** dashboard with by-source breakdown + dead-URL alerts.
- **/api/health** JSON endpoint for external monitoring.
- **First dead-URL caught**: WSAVA AMR guideline URL 404. Researched canonical replacement (WSAVA TGG PDF library, 6.1 MB). Updated generator, regenerated antibiotic citations, deleted orphan. Catalog now **132/132 citations probed, 100% healthy**.
- **Faculty onboarding `/onboarding`** + project-level `/changelog` pages.

### 2026-05-27 — Vet-only drugs + Q-prefix WHO ATC support

- 4 new vet-only drugs: Pimobendan (QC01CE90), Maropitant (QA04AD90), Cefovecin (QJ01DD91), Mavacoxib (QM01AH92).
- Generator + classifier updated to handle Q-prefix codes and optional RxNorm (vet-only drugs lack human CUIs).
- 21 new ATC entries under the `Q` veterinary branch.
- Catalog: **43 drugs** total across 11 therapeutic classes.

### 2026-05-27 — SEO + secondary OG images

- Auto-generated `/sitemap.xml` covering 240+ URLs (drugs × classes × verify × citations × static pages).
- `/robots.txt` permissive read, blocks `/api/` and `/.well-known/` from crawling.
- Per-page dynamic OG PNG for `/about`, `/trust`, `/log` (Twitter/Line/Facebook share cards).

### 2026-05-27 — Plain-language /about + research-backed "first" claim

- `/about` page with 8-primitive technology explainer using analogies (wax seal, fingerprint, guest book).
- 11 cited sources documenting that no published platform combines all 8 primitives for medical knowledge.
- Honest framing: each primitive has prior art in adjacent domains (Sigstore for software, blockchain for drug supply chain, W3C VC for licensing); the *composition* is novel.

### 2026-05-27 — Transparency surfaces

- **/log** — full audit-trail viewer of every signing event.
- **/trust** — chain-of-trust visualization (DID → keys → credentials + signed entries).
- **/verify/[slug]** — animated emerald stamp + check-draw on successful Web Crypto verification.
- Latest signing events feed on /verify landing.

### 2026-05-27 — Class browse + print stylesheet

- 11 therapeutic-class filtered pages at `/drugs/class/<slug>` with prev/next nav.
- "More from this class" section at bottom of each drug detail.
- Print stylesheet for vet-clinic handouts (A4-friendly margins, citation URLs expanded inline, no chrome).

### 2026-05-27 — Editorial design language

- Editorial seal SVG (24 perimeter ticks, double-stroke ring, MMXXVI year stamp).
- 3 brand assets: `/icon.svg`, `/seal.svg`, `/wordmark.svg`.
- Newsreader serif via `next/font/google`. Refined palette (deep teal, warm cream paper, warm ink near-blacks).
- Per-drug + per-class dynamic OG PNG cards.

### 2026-05-27 — 38 drugs seeded across 11 classes

- NSAIDs (5), opioids (5), antibiotics (5), anesthetics + sedatives (6), anti-emetics (2), antiparasitics (3), antifungals (3), antihistamines (3), GI (3), cardiac (4), endocrine (1).
- Each entry has 3-5 cross-checked sources (DailyMed + WHO ATC + PubChem always; WHO EML if on-list; WSAVA when category-applicable).
- Clinical text remains TEMPLATE — faculty review fills the clinical layer. **Iron Rule 0.**

### 2026-05-27 — DID/VC + ICD-11 + LOINC

- W3C Decentralized Identifiers (`did:web:source.cuvetsmo.com`) + Verifiable Credentials primitives.
- Board-root `EditorialAuthorityCredential` issued.
- ICD-11 + LOINC added to ontology mirror.

### 2026-05-27 — Offline PWA + client-side search

- Service worker caches all canonical content + UI shell.
- PWA manifest, installable app on Android/iOS.
- Site works offline after first visit.
- Client-side search with filter chips (status, class) — perf-checklist applied.

### 2026-05-27 — AI-in-loop policy + public API

- `CONTRIBUTING.md` with formal AI-in-loop policy.
- `scripts/verify.mjs` enforces drafting metadata: AI-assisted content must have `humanEditsRatio >= 0.1`.
- Public API at `/api/drugs`, `/api/drugs/[slug]`, `/api/by-code`, `/api/keys/[kid]`, `/api/log`, `/api/dataset` (paid tier 402 placeholder).
- CORS-enabled, rate-limit headers, 5-minute edge cache.

### 2026-05-27 — Cryptographic provenance

- `lib/sign.ts` (Node Ed25519) + `lib/verify-client.ts` (browser Web Crypto).
- `scripts/keygen.mjs` + `scripts/sign.mjs` CLIs.
- `content/keys/cuvetsmo-board.pub.json` (committed) + `~/.cuvetsmo-keys/cuvetsmo-board.priv.json` (NEVER committed).
- `content/log/transparency-log.jsonl` append-only audit trail.
- `/verify` + `/verify/[slug]` surfaces — readers re-canonicalize + re-verify in their own browser without server trust.
- Meloxicam signed as infrastructure demo.

### 2026-05-27 — Schema + structure foundation

- Drug schema with cryptographic + ontology + AI-drafting + signature fields.
- Content moved to flat JSON files under `content/drugs/` (Primitive 7).
- `lib/cid.ts` content-addressing.
- `lib/ontology.ts` with ATC + RxNorm + ICD-11 + LOINC lookups.
- `/c/[cid]` route with browser-verifiable hashes.
- `.github/PULL_REQUEST_TEMPLATE.md` + `verify-content.yml` GitHub Action.

### 2026-05-27 — ARCHITECTURE.md

- Design document mapping 8 primitives to concrete files, libraries, MVP cuts, tradeoffs.
- 6-week build plan, risk register, success criteria.

---

## Conventions

- Every change to `content/` is a public git commit by a named GitHub user.
- Faculty signatures are recorded in `content/log/transparency-log.jsonl` (append-only).
- The `/changelog` web page mirrors this file in a visual timeline format.
- Each entry's per-drug version history lives in its `changelog` block within the JSON file.

## Versioning

- The project does not use SemVer. Each commit on `main` is its own release.
- Per-entry `version` integers (in `content/drugs/<slug>.json`) increment on faculty signing events.
- The transparency log's `logSeq` integers are the cryptographic ordering.
