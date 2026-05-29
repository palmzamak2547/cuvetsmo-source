// /privacy — explicit, structural privacy stance.
//
// Designed to read like an honest contract, not legalese. The privacy
// posture is itself a feature: vet faculty + clinicians + AI tools
// can integrate without worrying about data leakage. Plumb's, MIMS,
// UpToDate all run analytics + cookies + paywalls.

import Link from 'next/link'

export const metadata = {
  title: 'Privacy',
  description: 'How source.cuvetsmo.com handles (or rather, does not handle) your data. No analytics, no cookies, no tracking — by design.',
}

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Privacy stance</p>
        <h1 className="display-h1 mt-3">
          We don&apos;t want your data. Here&apos;s how that works in practice.
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          Most medical reference platforms make money from you (Plumb&apos;s/UpToDate paywalls) or about you
          (ad-supported sites tracking what drugs you look up). We do neither. This page is the explicit
          version of that — not legal boilerplate, an actual stance.
        </p>
      </header>

      {/* The five claims */}
      <section className="mt-10 space-y-5">
        <Claim
          title="No analytics. No tracking pixels. No fingerprinting."
          body={
            <>
              <p>
                There is no Google Analytics, no Plausible, no Fathom, no Hotjar, no Mixpanel. No third-party
                JavaScript runs on these pages. Your browser tab&apos;s DevTools → Network panel will confirm:
                only assets from <code>source.cuvetsmo.com</code> + (eventually) Vercel&apos;s edge.
              </p>
              <p className="text-[13px] text-ink-500 italic">
                We give up the ability to know what drugs are most-viewed. We accept that trade.
              </p>
            </>
          }
        />

        <Claim
          title="No cookies. No localStorage tracking. No IDs of any kind."
          body={
            <p>
              The service worker uses <code>caches.open()</code> for offline content (cached drug entries +
              UI shell). That cache lives only in your browser, never sent to us. No cookies are set. No
              localStorage / sessionStorage values are used for user identification.
            </p>
          }
        />

        <Claim
          title="Free public reads — no signup, no API key, no rate-limit identity"
          body={
            <>
              <p>
                Every <code>/api/*</code> endpoint is open. CORS-enabled. No Bearer token required for read.
                Rate-limit headers identify <i>your IP</i> at the edge (Vercel CDN); we do not log or persist
                it server-side.
              </p>
              <p className="text-[13px] text-ink-500 italic">
                Phase 1+ may introduce optional API keys for institutional tier (bulk export, contribute back).
                Those will be opt-in and the public read tier stays anonymous.
              </p>
            </>
          }
        />

        <Claim
          title="Server logs: edge-level only, kept ≤ 7 days"
          body={
            <p>
              Vercel keeps standard CDN access logs (URL, response code, timestamp, IP, user-agent) at the
              edge for ~7 days for operational reasons. We do not augment, export, or analyze these. They
              roll off automatically.
            </p>
          }
        />

        <Claim
          title="Your reading list never leaves your browser"
          body={
            <p>
              Search queries, bookmark navigation, scroll depth, time-on-page — all stay local. The PWA caches
              content, but the cache index is not transmitted. If you save the page for offline (Ctrl+S /
              &quot;add to home screen&quot;), nothing is sent.
            </p>
          }
        />
      </section>

      <hr className="rule-double" />

      {/* What we DO collect */}
      <section>
        <p className="eyebrow">What we DO collect (transparency &gt; pretending zero)</p>
        <h2 className="display-h2 mt-2">การ collect ที่หลีกเลี่ยงไม่ได้</h2>
        <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink-800">
          <Item>
            <b>Edge CDN access logs</b> (Vercel, ~7 days, then auto-rolloff). Standard HTTP request metadata.
            We do not query or export these.
          </Item>
          <Item>
            <b>GitHub commit history</b>. Every change to <code>content/</code> is a public git commit by a
            named GitHub user. This is by design — the editorial audit trail is itself the trust mechanism.
            If you contribute, your GitHub identity is visible in the commit log forever.
          </Item>
          <Item>
            <b>Faculty signatures</b>. When a faculty member signs an entry, their name + title +
            affiliation + date are committed to the entry JSON + the transparency log. This is also by
            design — accountability requires identity. Faculty consent to this when generating their key.
          </Item>
        </ul>
      </section>

      <hr className="rule-double" />

      {/* What we will never do */}
      <section>
        <p className="eyebrow">Never</p>
        <h2 className="display-h2 mt-2">เราจะไม่ทำ</h2>
        <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink-800">
          <Never>Sell or share IP/user data with third parties</Never>
          <Never>Add advertising of any kind</Never>
          <Never>Track reader behavior across pages</Never>
          <Never>Require an account or signup for public reading</Never>
          <Never>Hold reader content (notes, bookmarks, queries) on our servers</Never>
          <Never>Integrate third-party JavaScript SDKs for tracking</Never>
        </ul>
      </section>

      <hr className="rule-double" />

      {/* Compare */}
      <section>
        <p className="eyebrow">For context</p>
        <h2 className="display-h2 mt-2">เทียบกับเครื่องมือที่ใช้กันอยู่</h2>
        <div className="mt-6 overflow-x-auto rounded-md border border-paper-300">
          <table className="min-w-full text-sm">
            <thead className="border-b border-paper-300 bg-paper-100/70 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Platform</th>
                <th className="px-4 py-2.5 text-left font-medium">Analytics</th>
                <th className="px-4 py-2.5 text-left font-medium">Cookies</th>
                <th className="px-4 py-2.5 text-left font-medium">Account required</th>
                <th className="px-4 py-2.5 text-left font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              <Row name="ChatGPT/Gemini" analytics="yes" cookies="yes" account="yes" cost="$20-30/mo" />
              <Row name="Plumb's" analytics="yes" cookies="yes" account="yes" cost="USD 300/yr" />
              <Row name="UpToDate" analytics="yes" cookies="yes" account="yes" cost="USD 500+/yr" />
              <Row name="MIMS Thailand" analytics="yes" cookies="yes" account="yes" cost="Free w/ login" />
              <Row name="DailyMed (FDA)" analytics="public-sector" cookies="some" account="no" cost="Free" />
              <Row name="Wikipedia" analytics="aggregate" cookies="some" account="optional" cost="Free" />
              <Row name="source.cuvetsmo.com" analytics="no" cookies="no" account="no" cost="Free public" highlight />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] italic text-ink-500">
          ตัวเลขนี้คือสิ่งที่เราเช็คในเดือน 2026-05 ผ่านการเปิด DevTools + อ่าน privacy policy ของแต่ละ platform.
        </p>
      </section>

      <hr className="rule-double" />

      {/* Cost question */}
      <section>
        <p className="eyebrow">The honest question</p>
        <h2 className="display-h2 mt-2">แล้วเราจ่ายค่า server ยังไง?</h2>
        <div className="prose-academic mt-5 space-y-4 text-ink-800">
          <p>
            Phase 0: server cost ใกล้ศูนย์ — เว็บนี้คือ static content + edge-cached API responses. Vercel
            hosting tier ฟรีอยู่ในวง free quota.
          </p>
          <p>
            Phase 1+: revenue ผ่าน <b>institutional API tier</b> (hospital chains, AI startups, government
            integrators ที่ต้องการ bulk export + SLA + dataset DOI). Revenue ส่วนนี้กระจายกลับสู่ภาควิชา
            ของ faculty ผู้ contribute. Public read ยังฟรีตลอดไป.
          </p>
          <p>
            Iron Rule: <i>เราจะไม่เก็บเงินจาก readers, ไม่เก็บข้อมูล readers, ไม่ขายอะไรกับใครเกี่ยวกับ readers</i>.
            ดูรายละเอียดที่ <Link href="/api" className="text-source-800 underline-offset-2 hover:underline">/api</Link>{' '}
            ภายใต้ &ldquo;Inverted economics&rdquo;.
          </p>
        </div>
      </section>

      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Verify these claims yourself</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          เปิด DevTools (F12) → Network tab → reload หน้านี้. ดูทุก request. มี request ไปนอก <code>source.cuvetsmo.com</code> ไหม?
          ดู <a href="https://github.com/palmzamak2547/cuvetsmo-source" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">source code บน GitHub</a> —
          ค้น string <code>analytics</code>, <code>tracking</code>, <code>gtag</code>, <code>fbq</code>. ไม่มี.
          คุณ verify policy ของเราได้ด้วย code ของเราเอง.
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function Claim({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-4 border-emerald-400 bg-emerald-50/40 px-6 py-5">
      <h3 className="text-[17px] font-semibold text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
        <span aria-hidden className="mr-2 text-emerald-700">✓</span>
        {title}
      </h3>
      <div className="prose-academic mt-3 space-y-2 text-ink-800">
        {body}
      </div>
    </div>
  )
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-source-400" aria-hidden />
      <span className="flex-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</span>
    </li>
  )
}

function Never({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-red-500 text-[10px] font-bold text-red-700">✗</span>
      <span className="flex-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</span>
    </li>
  )
}

function Row({ name, analytics, cookies, account, cost, highlight = false }: { name: string; analytics: string; cookies: string; account: string; cost: string; highlight?: boolean }) {
  const yes = 'text-red-700'
  const no = 'text-emerald-700 font-semibold'
  const cls = (val: string) => {
    if (val === 'no') return no
    if (val === 'yes') return yes
    return 'text-ink-700'
  }
  return (
    <tr className={`border-t border-paper-200 ${highlight ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-paper-100/40'}`}>
      <td className="px-4 py-3 font-medium text-ink-900">{name}</td>
      <td className={`px-4 py-3 ${cls(analytics)}`}>{analytics}</td>
      <td className={`px-4 py-3 ${cls(cookies)}`}>{cookies}</td>
      <td className={`px-4 py-3 ${cls(account)}`}>{account}</td>
      <td className="px-4 py-3 text-ink-700">{cost}</td>
    </tr>
  )
}
