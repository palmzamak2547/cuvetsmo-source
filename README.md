# source.cuvetsmo.com

> Verified Thai medical knowledge — citation-grade, faculty-approved, anti-AI-hallucination by construction.

Phase 0 scaffold of the **verified knowledge platform** wedge in the CUVETSMO ecosystem (Palm 2026-05-27 founder-vision session).

## Position

In an era where AI commoditizes generation, the scarce resource is **trust**. This site emits a Thai-language medical knowledge layer where every claim has:

- **Citation chain** that links back to peer-reviewed source / regulatory database / textbook
- **Mirror provenance** showing exactly which authoritative source the structured data came from
- **Faculty signoff** with named reviewer, title, department, affiliation, date

ChatGPT / Plumb's / Wikipedia / MIMS don't have all three. We do.

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
| **0** | Schema + scaffolding + faculty review workflow | ✅ this commit |
| **1** | Seed 10–20 drugs from rotation (NSAIDs, antibiotics, anesthetics) · Thai translation · faculty signoff | next |
| **2** | Flashcard / SRS / quiz mode (the LEARN pillar bolts on) | |
| **3** | Expand vertical: toxicology · anatomy · clinical chemistry | |
| **4** | API license + institutional subscription + research grants (the DATA moat) | |

## Stack

- Next.js 16 + React 19 + Tailwind 4
- Static JSON seed data in `data/seed/`
- No backend in Phase 0 (Supabase comes in Phase 2 when user accounts matter)
- Deploy: Vercel + Cloudflare DNS (source.cuvetsmo.com)

## Iron Rule 0

This project is governed by Iron Rule 0: **no fabrication**. Every dose, indication, contraindication that ships canonical (`reviewedBy !== null`) must have a verifiable citation chain. Template/pending entries render with an amber "PENDING REVIEW · NOT FOR CLINICAL USE" banner and never claim authority.

## Related

- [cuvetsmo.com](https://cuvetsmo.com) — main council site (community, cohort, events)
- [labs.cuvetsmo.com](https://labs.cuvetsmo.com) — experimental tools umbrella
- Future: `learn.cuvetsmo.com` (Duolingo-style learning, powered by this source)
- Future: `data.cuvetsmo.com` (API + dataset license layer)

## Dev

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm run typecheck
```
