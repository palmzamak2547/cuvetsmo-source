# Design System Master — source.cuvetsmo.com

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> This Master file was hand-tuned to reflect the **actual** source.cuvetsmo.com
> codebase (the generic baseline emitted by `uipro-cli --design-system --persist`
> recommended an App Store / medical-teal palette that does not match this
> editorial reference platform).

---

**Project:** source.cuvetsmo.com
**Last updated:** 2026-05-27
**Category:** Editorial reference platform · verified medical knowledge
**Adjacent products:** Wikipedia, UpToDate, Plumb's Veterinary Drugs, MIMS, DailyMed
**Stack:** Next.js 16 App Router · React 19 · Tailwind 4 · next/font/google

---

## Visual identity

The site reads like a research monograph, not a SaaS. Three deliberate choices anchor that feel:

1. **Serif body** for editorial gravitas (Newsreader, designed for long-form reading)
2. **Cream paper** background instead of pure white (reduces glare, signals "printed page")
3. **Cryptographic source-blue accent** that doubles as the verification-stamp color

Every page must reinforce trust + verifiability — visuals must support, never compete with, the medical content.

---

## Color tokens

Defined as CSS custom properties in `app/globals.css`. Always reference via Tailwind utilities (`bg-source-800`, `text-ink-900`, etc.), never hex.

| Role          | Token                | Hex      | Usage                                                                |
|---------------|----------------------|----------|----------------------------------------------------------------------|
| Primary       | `--color-source-800` | (steel)  | Verification stamps, CTAs, primary buttons, active states            |
| Primary hover | `--color-source-900` | (deeper) | Button hover                                                         |
| Primary light | `--color-source-300` | (faint)  | Hero ring, callout borders                                           |
| Ink (body)    | `--color-ink-900`    | (~slate-900) | Body text — must hit 7:1 ratio on `paper-50`                     |
| Ink muted     | `--color-ink-700`    | (~slate-700) | Secondary text, metadata. Must hit 4.5:1 on `paper-50`           |
| Ink subtle    | `--color-ink-500`    | (~slate-500) | Footer captions, kicker labels. Use sparingly                    |
| Paper bg      | `--color-paper-50`   | (cream)  | Page background — NOT pure white                                     |
| Paper card    | `--color-paper-100`  | (warmer) | Card surfaces, code chips                                            |
| Paper border  | `--color-paper-300`  | (sand)   | Borders + dividers                                                   |
| Emerald (verify) | `emerald-50/600/700/900` | (Tailwind) | "Verified" / "canonical" badges. Reserved for verification state |

**Anti-pattern colors (forbidden):** AI purple/pink gradients · neon · "crypto-bro" colors. We are NOT a Defi project.

---

## Typography

Wired in `app/layout.tsx` via `next/font/google` with self-hosted, zero-CLS loading:

```ts
const newsreader = Newsreader({ variable: '--font-serif', subsets: ['latin'] })
const inter      = Inter     ({ variable: '--font-sans',  subsets: ['latin'] })
```

| Use                       | Font       | Tailwind                | Notes                                       |
|---------------------------|------------|-------------------------|---------------------------------------------|
| Long-form prose body      | Newsreader | `.prose-academic p`     | Designed for sustained reading, opt-feat ss01/cv11 |
| Drug-page headings (h1-h3)| Newsreader | `.prose-academic h1-3`  | `text-wrap: balance`, `letter-spacing: -0.015em` |
| UI chrome (buttons, badges, nav) | Inter | `font-sans` (default body) | Reads as scannable interface                |
| Code, ATC codes, CIDs     | Mono       | `code`, `.font-mono`    | `font-feature-settings: "tnum", "ss01"`     |
| Logo wordmark             | Inter Tight Black 900 | SVG only            | Bold 900-weight monogram in header           |

**Body size:** 1.0625rem (17px) with `line-height: 1.7` and `max-width: 70ch` — these come from `.prose-academic`. Don't override per-page.

**Heading scale (Tailwind):** uses `clamp(...)` for fluid type. `display-h1` for hero, `h1`-`h3` for in-prose. Tracking is always `-0.015em` to `-0.02em` for headings.

**No external font CDN links** — always `next/font`.

---

## Spacing & rhythm

Tailwind's default spacing scale is used as-is. Two recurring patterns:

- **Page container:** `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8` for content shells
- **Section gap:** `mt-12` between major sections, `mt-6` between subsections
- **Prose paragraph gap:** `0.6em` (set in `.prose-academic p + p`)

No spacing tokens beyond Tailwind's defaults — don't introduce `--space-md` etc., it's already covered.

---

## Interactive elements

These are now enforced by global CSS rules in `app/globals.css`, so per-component handling is unnecessary:

```css
button:not(:disabled), [role="button"]:not([aria-disabled="true"]) { cursor: pointer; }
button:disabled, [role="button"][aria-disabled="true"]            { cursor: not-allowed; }
:focus-visible                                                     { outline: 2px solid var(--color-source-600); outline-offset: 2px; }
```

**Per-input overrides:** when you need a focus state on an `<input>`, add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600`. Never use `focus:outline-none` alone — always pair with a replacement.

**Transitions:** 150-300ms. Use `transition` Tailwind class (resolves to 150ms). Wrap with `motion-safe:` if the transition is purely decorative — `prefers-reduced-motion` is globally honored.

**Hover:** color/border change, never `scale` (causes layout shift). Buttons + cards get `hover:border-source-600` or `hover:bg-source-900`.

---

## Page patterns

### Landing (`/`)

Not an "App Store Style Landing" (the generic skill recommendation is wrong for this product). Closer to **Newsletter / Content-First** + **Documentation Hub**:

1. **Hero** — value prop in one sentence, primary CTA (Search via Cmd+K), supplementary CTAs to /about + /use-cases
2. **HomeQuickAccess** — Cmd+K search trigger + recently viewed (localStorage, no server) + therapeutic class grid
3. **Surfaces grid** — /verify, /health, /trust, /log, /assist as discoverable entries
4. **Trust footer** — 198 citations probed, X drugs verified, link to /api/health JSON

No email capture, no newsletter signup — that breaks our cookie-free, no-tracking stance.

### Drug detail (`/drugs/[slug]`)

Editorial monograph layout:

- **Two-column on desktop:** `.prose-academic` left (~70ch), metadata sidebar right
- **Single column on mobile** — sidebar collapses below prose
- **Header crest** — slug + ATC + version + verified-stamp animation
- **Footer:** changelog `<details>`, "More from this class" related grid
- **Print stylesheet** must collapse sidebar inline + show citation URLs

### Reference pages (`/about`, `/use-cases`, `/privacy`, `/onboarding`)

`.prose-academic` container, `max-w-4xl` outer container (prose itself caps at 70ch).

### Transparency surfaces (`/verify`, `/trust`, `/log`, `/health`)

Mix of tables + cards. Verify shows animated emerald stamp. Trust shows DID → keys → credentials hierarchy. Log is paginated JSONL. Health is by-source probe summary.

---

## Anti-patterns

Strictly forbidden in this codebase:

- ❌ **Emoji icons** in UI chrome — use SVG (Heroicons, Lucide, or custom). Bullet emoji + status emoji ARE allowed inline in prose ✅ ⚠️ but never as button/badge icons.
- ❌ **`focus:outline-none` without a focus-visible replacement** — keyboard users will be stranded.
- ❌ **`scale` hover transforms** — causes layout shift, looks twitchy on a reference page.
- ❌ **Middle-dot (·) chains of 3+ items** — Palm's standing rule. Use commas, em-dashes, or line breaks. Tight 2-item pairings are OK.
- ❌ **AI / crypto / Defi gradient palettes** — purple-to-pink, neon green, etc. We are explicitly NOT a Defi project (see `/use-cases#defi-vs-us`).
- ❌ **External font CDN links** — `next/font/google` only, zero CLS guaranteed.
- ❌ **`<button>` without focus-visible or cursor** — covered globally now, but don't re-add per-component overrides.
- ❌ **Server analytics, cookies, fingerprinting** — `/privacy` page is a hard contract. Adding tracking breaks it.
- ❌ **Fabricated medical content** — Iron Rule 0. Every canonical claim has a cited source. No exceptions.

---

## Pre-delivery checklist

Before committing any UI change:

- [ ] No emojis as button/badge icons (SVG only)
- [ ] Buttons + clickable cards inherit `cursor: pointer` (don't fight the global rule)
- [ ] Inputs without `focus:outline-none` UNLESS replaced with `focus-visible:outline-*`
- [ ] Text contrast on `paper-50` background ≥ 4.5:1 (use `ink-700` minimum, `ink-500` only for kicker/eyebrow)
- [ ] Long-form prose uses `.prose-academic` (auto-applies 17px serif, 1.7 line-height, 70ch max-width)
- [ ] `prefers-reduced-motion` is globally honored — don't bypass it
- [ ] Tested at 375px (mobile portrait) — no horizontal scroll
- [ ] No middle-dot (·) chains of 3+ items in user copy
- [ ] Faculty-safe vocabulary — no "leak", "ออกแน่", "ตรงข้อสอบ" etc.

---

## Reference

- **Live:** https://source.cuvetsmo.com
- **Repo:** https://github.com/palmzamak2547/cuvetsmo-source
- **Skill DB:** `~/.claude/skills/ui-ux-pro-max/data/*.csv` (CSV-backed BM25 search)
- **Skill search:** `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <ux|style|typography|color|landing|chart>`
