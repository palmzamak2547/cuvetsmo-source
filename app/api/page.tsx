// /api — public API documentation.
//
// Lists every endpoint, what it returns, what tier it requires, and a
// curl example. Inverted economics framing: free public read up front,
// institutional tier explained at the bottom.

import Link from 'next/link'

export const metadata = {
  title: 'Public API',
  description: 'Public read API for source.cuvetsmo.com — drugs, ontology codes, signing keys, transparency log. Free, CORS-enabled, edge-cached.',
}

const BASE = 'https://source.cuvetsmo.com'

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/drugs',
    tier: 'public',
    description: 'List all canonical entries (faculty-reviewed AND signed). Pending entries are filtered out.',
    example: `curl ${BASE}/api/drugs`,
    response: `{
  "apiVersion": "0.0.1",
  "lastUpdated": "<iso>",
  "count": 1,
  "data": [ { "slug": "meloxicam", ... } ]
}`,
  },
  {
    method: 'GET',
    path: '/api/drugs/{slug}',
    tier: 'public',
    description: 'Single drug entry by slug. Includes pending entries (with amber status visible in response).',
    example: `curl ${BASE}/api/drugs/meloxicam`,
    response: `{
  "apiVersion": "0.0.1",
  "lastUpdated": "<iso>",
  "data": { "slug": "meloxicam", ... }
}`,
  },
  {
    method: 'GET',
    path: '/api/by-code',
    tier: 'public',
    rateLimit: '1000 / IP / day (Phase 1 enforced)',
    description: 'Filter by ontology code. Supports ATC prefix-match and RxNorm exact match.',
    example: `curl '${BASE}/api/by-code?system=atc&code=M01AC06'`,
    response: `{
  "query": { "system": "atc", "code": "M01AC06" },
  "count": 1,
  "data": [ { "slug": "meloxicam", "codes": {...} } ]
}`,
  },
  {
    method: 'GET',
    path: '/api/keys/{kid}',
    tier: 'public',
    description: 'Public signing key as JSON Web Key. Use for client-side signature verification.',
    example: `curl ${BASE}/api/keys/cuvetsmo-board`,
    response: `{
  "apiVersion": "0.0.1",
  "data": {
    "kty": "OKP", "crv": "Ed25519", "x": "<base64url>",
    "fingerprint": "ed25519:<hex>",
    "displayName": "CUVETSMO Editorial Board"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/log',
    tier: 'public',
    rateLimit: '100 / IP / day (Phase 1, large payload)',
    description: 'Append-only transparency log of every signature event. Audit trail for the curious.',
    example: `curl ${BASE}/api/log`,
    response: `{
  "apiVersion": "0.0.1",
  "count": N,
  "entries": [ { "entryType": "drug-signature", "drugSlug": "meloxicam", ... } ]
}`,
  },
  {
    method: 'GET',
    path: '/api/health',
    tier: 'public',
    description: 'Citation-probe health summary — coverage stats, dead URLs, source breakdown. Lets external monitoring detect citation rot.',
    example: `curl ${BASE}/api/health`,
    response: `{
  "apiVersion": "0.0.1",
  "summary": {
    "totalCitations": 132, "probed": 119, "healthy": 118,
    "unhealthy": 1, "pctProbed": 90, "pctHealthy": 99
  },
  "bySource": { "dailymed": {...}, "atc": {...}, ... },
  "unhealthyEntries": [ { "cid": "...", "url": "...", "latestStatus": 404 } ]
}`,
  },
  {
    method: 'GET',
    path: '/api/dataset',
    tier: 'institutional',
    description: 'Bulk dataset export. Phase 1+. Today: returns 402 + contact instructions.',
    example: `curl -i ${BASE}/api/dataset`,
    response: `HTTP/2 402
{
  "error": { "code": "institutional-tier-required", ... },
  "contact": { "email": "palm@cuvetsmo.com", ... }
}`,
  },
]

export default function APIDocsPage() {
  return (
    <article className="prose-academic max-w-4xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-source-700">
          Public API — v0.0.1
        </p>
        <h1 className="mt-2 text-3xl font-bold text-paper-900">API documentation</h1>
        <p className="mt-2 text-paper-700">
          Free public read of every canonical entry, ontology cross-reference, public key, and signature event.
          CORS-enabled. Edge-cached. No API key required.
        </p>
      </header>

      {/* Economics framing */}
      <section className="mt-8 rounded-2xl border-2 border-source-300 bg-source-50 p-5">
        <h2 className="text-lg font-bold text-source-900">Inverted economics</h2>
        <p className="mt-2 text-sm text-source-800">
          Public read is free forever. Hospital EHRs, AI agents, research workflows can integrate without
          paying anything. <b>Institutional write</b> (POST contributions back, bulk dataset export, dataset
          DOI minting) is paid — revenue flows back to the contributing department per their reviewed entries.
          Phase 0 ships the read surface; institutional write comes online Phase 1.
        </p>
      </section>

      {/* Endpoints */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-paper-900">Endpoints</h2>
        <div className="mt-4 space-y-6">
          {ENDPOINTS.map(e => <EndpointCard key={e.path} ep={e} />)}
        </div>
      </section>

      {/* Rate limits */}
      <section className="mt-12 rounded-xl border border-paper-200 bg-white p-5">
        <h2 className="text-lg font-bold text-paper-900">Rate limits + response headers</h2>
        <p className="mt-2 text-sm text-paper-700">
          Phase 0 ships rate-limit headers but does not enforce them yet (so you can build integrations
          today and not break when enforcement flips on in Phase 1):
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-paper-100 p-3 text-[11px] font-mono text-paper-800">{`X-Source-Tier: public
X-Source-Limit-RPD: 1000
X-Source-Cost: 1
X-Source-Enforcement: phase-0-soft`}</pre>
        <p className="mt-3 text-xs text-paper-700">
          Tier <code>public</code> = anonymous. Tier <code>institutional</code> = paid. Tier <code>admin</code>
          = maintainers only. When enforcement flips on, exceeding RPD returns HTTP 429 with the same
          shape as the 402 dataset response.
        </p>
      </section>

      {/* CORS */}
      <section className="mt-8 rounded-xl border border-paper-200 bg-white p-5">
        <h2 className="text-lg font-bold text-paper-900">CORS</h2>
        <p className="mt-2 text-sm text-paper-700">
          All GET endpoints set <code>Access-Control-Allow-Origin: *</code>. You can fetch from any origin
          (browser, curl, Node, Python, Go). POST is locked — Phase 1 enables it for institutional keys only.
        </p>
      </section>

      {/* Sample integration */}
      <section className="mt-8 rounded-xl border border-paper-200 bg-paper-100 p-5">
        <h2 className="text-lg font-bold text-paper-900">Sample integration</h2>
        <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-[11px] font-mono text-paper-800">{`// Browser — fetch + verify a single entry
const drug = await fetch('${BASE}/api/drugs/meloxicam').then(r => r.json())
const key = await fetch(\`${BASE}/api/keys/\${drug.data.signatures[0].signerKeyId.split(':')[1].slice(0,99)}\`)
// For real verification, fetch by signerId not by fingerprint slice
// see /verify/[slug] for the proper pattern`}</pre>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-sm text-paper-700">
        <p>
          See the full editorial workflow in{' '}
          <a href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/CONTRIBUTING.md" className="text-source-700 hover:underline" target="_blank" rel="noreferrer">CONTRIBUTING.md</a>
          {' '}or the architecture spec in{' '}
          <a href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/ARCHITECTURE.md" className="text-source-700 hover:underline" target="_blank" rel="noreferrer">ARCHITECTURE.md</a>.
          For institutional partnership inquiries:{' '}
          <a href="mailto:palm@cuvetsmo.com" className="text-source-700 hover:underline">palm@cuvetsmo.com</a>.
        </p>
        <p className="mt-2">
          For browser-side signature verification UX, see{' '}
          <Link href="/verify" className="text-source-700 hover:underline">/verify</Link>.
        </p>
      </footer>
    </article>
  )
}

type Endpoint = {
  method: 'GET' | 'POST'
  path: string
  tier: 'public' | 'institutional' | 'admin'
  rateLimit?: string
  description: string
  example: string
  response: string
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const tierStyles = {
    public:        'border-emerald-300 bg-emerald-50 text-emerald-900',
    institutional: 'border-amber-300   bg-amber-50   text-amber-900',
    admin:         'border-red-300     bg-red-50     text-red-900',
  } as const
  return (
    <div className="rounded-xl border border-paper-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-paper-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
          {ep.method}
        </span>
        <code className="text-sm font-bold text-paper-900">{ep.path}</code>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${tierStyles[ep.tier]}`}>
          {ep.tier}
        </span>
      </div>
      <p className="mt-2 text-sm text-paper-700">{ep.description}</p>
      {ep.rateLimit && (
        <p className="mt-1 text-[11px] text-paper-700">Rate limit: {ep.rateLimit}</p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-paper-700">Example</p>
          <pre className="mt-1 overflow-x-auto rounded bg-paper-100 p-2 text-[11px] font-mono text-paper-800">{ep.example}</pre>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-paper-700">Response shape</p>
          <pre className="mt-1 overflow-x-auto rounded bg-paper-100 p-2 text-[11px] font-mono text-paper-800">{ep.response}</pre>
        </div>
      </div>
    </div>
  )
}
