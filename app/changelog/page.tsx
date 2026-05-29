// /changelog — site-level milestone history (separate from per-entry changelog).
//
// Records what the platform itself has shipped over time. Each entry
// frames a milestone in terms of the 8-primitive architecture.

import Link from 'next/link'

export const metadata = {
  title: 'Changelog',
  description: 'Site-level milestones — what shipped on source.cuvetsmo.com and when, framed by the 8-primitive moonshot architecture.',
}

type Milestone = {
  date: string
  title: string
  scope: 'foundation' | 'verification' | 'process' | 'client' | 'credentials' | 'design' | 'content' | 'infra' | 'docs'
  body: string
  links?: Array<{ href: string; label: string }>
}

const MILESTONES: Milestone[] = [
  {
    date: '2026-05-27',
    title: 'Citation health probe + dead-URL detection',
    scope: 'infra',
    body: 'Wrote scripts/mirror.mjs — fetches each upstream URL, records HTTP status + headers + SHA-256 of the body (without storing the body — copyright-safe). Probed all 132 citations in one batch. Found and fixed one dead WSAVA AMR URL surfaced by the probe itself. /health dashboard + /api/health JSON endpoint went live.',
    links: [{ href: '/health', label: 'Citation health dashboard →' }, { href: '/api/health', label: 'JSON API →' }],
  },
  {
    date: '2026-05-27',
    title: 'SEO foundation + per-page Open Graph cards',
    scope: 'infra',
    body: 'Generated sitemap.xml covering 240+ URLs (43 drugs × 11 classes × 132 citations × 1 credential × static pages), wired robots.txt, added per-page OG PNGs for /about, /trust, /log so every share-card is unique.',
    links: [{ href: '/sitemap.xml', label: 'sitemap.xml →' }],
  },
  {
    date: '2026-05-27',
    title: '4 vet-only drugs added (Q-prefix WHO ATC)',
    scope: 'content',
    body: 'Pimobendan (QC01CE90, Vetmedin), Maropitant (QA04AD90, Cerenia), Cefovecin (QJ01DD91, Convenia), Mavacoxib (QM01AH92, Trocoxil). Extended generator + classifier to handle Q-prefix veterinary ATC codes + optional RxNorm (vet-only drugs have no human CUI).',
    links: [{ href: '/drugs/pimobendan', label: 'Pimobendan →' }, { href: '/drugs/class/cardiovascular', label: 'Cardiovascular class →' }],
  },
  {
    date: '2026-05-27',
    title: 'Plain-language /about explainer + research-backed "first" claim',
    scope: 'docs',
    body: 'Wrote /about with 8-primitive technology explainer using analogies (wax seal, fingerprint, guest book). Researched adjacent territory and cited 11 sources documenting that no published platform combines all 8 primitives for medical knowledge content. Honest framing: each primitive has prior art in adjacent domains; the composition is novel.',
    links: [{ href: '/about', label: 'Read the explainer →' }],
  },
  {
    date: '2026-05-27',
    title: 'Transparency surfaces + animated verify',
    scope: 'verification',
    body: '/log full audit-trail viewer, /trust chain-of-trust visualization (DID → keys → credentials + signed entries), animated emerald stamp + check-draw on /verify/[slug] when Web Crypto verification succeeds.',
    links: [{ href: '/log', label: 'Transparency log →' }, { href: '/trust', label: 'Chain of trust →' }],
  },
  {
    date: '2026-05-27',
    title: 'Class browse pages + print stylesheet',
    scope: 'design',
    body: 'Added 11 therapeutic-class filtered pages (/drugs/class/nsaids, /drugs/class/opioids, etc.) with prev/next navigation. Wrote print stylesheet so vet clinics can print a drug entry as a clean A4 handout with citation URLs expanded inline.',
    links: [{ href: '/drugs/class/nsaids', label: 'NSAIDs class →' }],
  },
  {
    date: '2026-05-27',
    title: 'Editorial seal + 3 brand assets',
    scope: 'design',
    body: 'Designed the source seal — circular stamp with 24 perimeter tick marks, 12 o\'clock anchor, central serif S, MMXXVI year stamp. Three SVG assets: /icon.svg (mono favicon), /seal.svg (full editorial seal), /wordmark.svg (horizontal). Added Newsreader serif via next/font and refined the palette (deep teal + warm cream + warm ink near-blacks).',
    links: [{ href: '/seal.svg', label: 'View the seal →' }],
  },
  {
    date: '2026-05-27',
    title: '22 + 16 drugs seeded with cross-checked metadata',
    scope: 'content',
    body: 'Generated 38 pending entries across NSAIDs, opioids, antibiotics, anesthetics/sedatives, anti-emetics, cardiac, antiparasitics, antifungals, antihistamines, GI, endocrine. Each entry has 3-5 cross-checked sources (DailyMed + WHO ATC + PubChem always; WHO EML if on-list; WSAVA when category-applicable). Clinical text remains TEMPLATE until faculty review — Iron Rule 0.',
    links: [{ href: '/drugs', label: 'Drug Reference →' }],
  },
  {
    date: '2026-05-27',
    title: 'Week 5 — DID/VC + ICD-11/LOINC ontology',
    scope: 'credentials',
    body: 'W3C Decentralized Identifiers (did:web:source.cuvetsmo.com) + Verifiable Credentials primitives. Issued board-root EditorialAuthorityCredential. Added ICD-11 (6 codes) + LOINC (4 codes) to ontology mirror, joined ATC + RxNorm cross-references.',
    links: [{ href: '/credentials/board-root', label: 'Board credential →' }],
  },
  {
    date: '2026-05-27',
    title: 'Week 4 — Offline PWA + search',
    scope: 'client',
    body: 'Service worker caches canonical content + UI shell. PWA manifest + installable app. Site works offline after first visit. Client-side substring search over all entries with filter chips (canonical/pending/class), perf-checklist applied (useMemo + useDeferredValue).',
    links: [{ href: '/search', label: '/search →' }],
  },
  {
    date: '2026-05-27',
    title: 'Week 3 — AI-in-loop policy + public API',
    scope: 'process',
    body: 'CONTRIBUTING.md with formal AI-in-loop policy (AI may draft, never authors). scripts/verify.mjs lints drafting.humanEditsRatio — fails CI if AI-assisted content lacks meaningful human editing. Public API surface (/api/drugs, /api/by-code, /api/keys, /api/log, /api/dataset) with CORS + rate-limit headers.',
    links: [{ href: '/api', label: 'API docs →' }],
  },
  {
    date: '2026-05-27',
    title: 'Week 2 — Cryptographic provenance',
    scope: 'verification',
    body: 'lib/sign.ts (Node Ed25519) + lib/verify-client.ts (browser Web Crypto). scripts/keygen.mjs + scripts/sign.mjs CLIs. content/keys/ + content/log/transparency-log.jsonl (append-only audit trail). /verify + /verify/[slug] surfaces where readers re-canonicalize and re-verify in their own browser without server trust. Signed meloxicam as infrastructure demo.',
    links: [{ href: '/verify', label: 'Verify →' }],
  },
  {
    date: '2026-05-27',
    title: 'Week 1 — Schema + structure foundation',
    scope: 'foundation',
    body: 'Drug schema with cryptographic + ontology + AI-drafting + signature fields. Content moved to flat JSON files under content/drugs/ (Primitive 7). lib/cid.ts content-addressing. lib/ontology.ts with initial ATC + RxNorm subset. /c/[cid] route with browser-verifiable hashes. .github/PULL_REQUEST_TEMPLATE + verify-content GitHub Action.',
    links: [{ href: '/c/65f15af11f2c1a6a4a23ff7b3094af2e36fef477c604bc34461641fa3fa50d5a', label: 'Sample CID →' }],
  },
  {
    date: '2026-05-27',
    title: 'ARCHITECTURE.md — the 8-primitive moonshot spec',
    scope: 'docs',
    body: 'Wrote the design document mapping each of the 8 primitives (cryptographic provenance, content-addressed citations, AI-in-loop, ZK-ready VC, ontology backbone, inverted API economics, git-native, offline PWA) to concrete files, libraries, MVP cuts, and tradeoffs. Six-week build order, risk register, success criteria.',
    links: [{ href: 'https://github.com/palmzamak2547/cuvetsmo-source/blob/main/ARCHITECTURE.md', label: 'Read ARCHITECTURE.md →' }],
  },
]

const SCOPE_LABEL: Record<Milestone['scope'], string> = {
  foundation: 'Foundation',
  verification: 'Verification',
  process: 'Process',
  client: 'Client',
  credentials: 'Credentials',
  design: 'Design',
  content: 'Content',
  infra: 'Infrastructure',
  docs: 'Docs',
}

const SCOPE_TONE: Record<Milestone['scope'], string> = {
  foundation:   'border-source-400 bg-source-50  text-source-900',
  verification: 'border-emerald-400 bg-emerald-50 text-emerald-900',
  process:      'border-source-400 bg-paper-50   text-source-900',
  client:       'border-source-400 bg-paper-50   text-source-900',
  credentials:  'border-source-400 bg-paper-50   text-source-900',
  design:       'border-amber-400 bg-amber-50    text-amber-900',
  content:      'border-source-400 bg-source-50  text-source-900',
  infra:        'border-source-400 bg-paper-50   text-source-900',
  docs:         'border-paper-400 bg-paper-100   text-ink-900',
}

export default function ChangelogPage() {
  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Site-level changelog</p>
        <h1 className="display-h1 mt-3">What shipped, when.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          Per-entry version history lives on each drug page. This page is the <b>site-level</b> changelog — milestones
          of the platform itself, framed by the 8-primitive architecture in <Link href="/about" className="text-source-800 underline-offset-2 hover:underline">/about</Link>.
        </p>
      </header>

      <section className="mt-12">
        <ol className="space-y-8">
          {MILESTONES.map((m, i) => (
            <li key={i} className="relative pl-8">
              {/* Vertical timeline rule */}
              {i < MILESTONES.length - 1 && (
                <div className="pointer-events-none absolute bottom-0 left-[10px] top-6 w-px bg-paper-300" aria-hidden />
              )}
              {/* Dot */}
              <div
                className="absolute left-0 top-1.5 grid h-5 w-5 place-items-center rounded-full border-2 border-source-500 bg-paper-50"
                aria-hidden
              >
                <div className="h-1.5 w-1.5 rounded-full bg-source-700" />
              </div>

              {/* Header row */}
              <div className="flex flex-wrap items-baseline gap-3">
                <time className="text-[11px] font-semibold uppercase tracking-wider tabular text-ink-500">
                  {m.date}
                </time>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SCOPE_TONE[m.scope]}`}>
                  {SCOPE_LABEL[m.scope]}
                </span>
              </div>
              <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                {m.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                {m.body}
              </p>
              {m.links && m.links.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                  {m.links.map(link => (
                    link.href.startsWith('http') ? (
                      <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">
                        {link.label}
                      </a>
                    ) : (
                      <Link key={link.href} href={link.href} className="text-source-800 underline-offset-2 hover:underline">
                        {link.label}
                      </Link>
                    )
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Where to dig deeper</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          Per-entry version + signature history is on each <Link href="/drugs" className="text-source-800 underline-offset-2 hover:underline">drug page</Link>.
          Cryptographic signing events live in the <Link href="/log" className="text-source-800 underline-offset-2 hover:underline">transparency log</Link>.
          The full architectural spec is in <a href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/ARCHITECTURE.md" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">ARCHITECTURE.md</a>.
          For commit-level history, see <a href="https://github.com/palmzamak2547/cuvetsmo-source/commits/main" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">git log on GitHub</a>.
        </p>
      </aside>
    </article>
  )
}
