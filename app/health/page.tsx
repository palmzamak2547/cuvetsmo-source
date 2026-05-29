// /health — citation-probe health dashboard.
//
// Visible signal that the bytes-fingerprint infrastructure is real and
// running. Shows aggregate stats + flags any dead upstream URLs so
// faculty maintainers can fix them in PRs.

import Link from 'next/link'
import { computeProbeStats } from '@/lib/probe-stats'
import { shortCID } from '@/lib/cid'

export const metadata = {
  title: 'Citation health',
  description: 'Live status of every upstream citation URL. Probe metadata captured by scripts/mirror.mjs, body hashes verifiable in your browser.',
}

export default function HealthPage() {
  const stats = computeProbeStats()
  const pctHealthy = stats.probed > 0 ? Math.round((stats.healthy / stats.probed) * 100) : 0
  const pctProbed = stats.total > 0 ? Math.round((stats.probed / stats.total) * 100) : 0

  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Citation health · upstream URL probes</p>
        <h1 className="display-h1 mt-3">Are the sources still alive?</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุก citation บนเว็บนี้ชี้ไปยัง URL ภายนอก (DailyMed, WHO EML, PubChem, ATC, WSAVA). เราตรวจสอบเป็นระยะว่า URL
          เหล่านั้นยังอยู่และ body hash เปลี่ยนหรือไม่. หน้านี้คือสถานะปัจจุบัน — <b>citation rot</b> = visible.
        </p>
      </header>

      {/* Top-level stats */}
      <section className="mt-8 grid gap-px overflow-hidden rounded-md border border-paper-300 bg-paper-300 sm:grid-cols-4">
        <Tile
          label="Citations on disk"
          value={stats.total.toString()}
          sub="content/citations/*.json files"
          tone="paper"
        />
        <Tile
          label="Probed"
          value={`${stats.probed} / ${stats.total}`}
          sub={`${pctProbed}% of catalog probed at least once`}
          tone="source"
        />
        <Tile
          label="Healthy"
          value={`${stats.healthy}`}
          sub={`${pctHealthy}% of probed return HTTP 2xx/3xx`}
          tone="emerald"
        />
        <Tile
          label="Unhealthy"
          value={`${stats.unhealthy}`}
          sub={stats.unhealthy === 0 ? 'no dead URLs detected' : 'dead or error responses'}
          tone={stats.unhealthy === 0 ? 'paper' : 'red'}
        />
      </section>

      {/* Latest probe + staleness */}
      {(stats.latestProbedAt || stats.staleByDays > 0) && (
        <section className="mt-6 flex flex-wrap items-baseline justify-between gap-3 rounded-md border border-paper-300 bg-paper-50 px-5 py-4 text-sm text-ink-700">
          {stats.latestProbedAt && (
            <p>
              <span className="text-[11px] uppercase tracking-wider text-ink-500">Last probe</span>{' '}
              <span className="tabular">{stats.latestProbedAt.replace('T', ' · ').slice(0, 19)}</span> UTC
            </p>
          )}
          {stats.staleByDays > 0 && (
            <p>
              <span className="text-[11px] uppercase tracking-wider text-amber-700">Stale</span>{' '}
              <span className="tabular">{stats.staleByDays}</span> probed citation{stats.staleByDays === 1 ? '' : 's'} not refreshed in 30+ days
            </p>
          )}
        </section>
      )}

      {/* By-source breakdown */}
      {Object.keys(stats.bySource).length > 0 && (
        <section className="mt-12">
          <p className="eyebrow">By source dataset</p>
          <div className="mt-4 overflow-x-auto rounded-md border border-paper-300">
            <table className="min-w-full text-sm tabular">
              <thead className="border-b border-paper-300 bg-paper-100/70 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Source</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 text-right font-medium">Healthy</th>
                  <th className="px-4 py-2.5 text-right font-medium">Unhealthy</th>
                  <th className="px-4 py-2.5 text-right font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.bySource)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([src, s]) => {
                    const probedCount = s.healthy + s.unhealthy
                    const pct = s.total > 0 ? Math.round((probedCount / s.total) * 100) : 0
                    return (
                      <tr key={src} className="border-t border-paper-200 hover:bg-paper-100/40">
                        <td className="px-4 py-3 font-mono text-source-800">{src}</td>
                        <td className="px-4 py-3 text-right">{s.total}</td>
                        <td className="px-4 py-3 text-right text-emerald-800">{s.healthy}</td>
                        <td className={`px-4 py-3 text-right ${s.unhealthy > 0 ? 'font-semibold text-red-800' : 'text-ink-500'}`}>
                          {s.unhealthy}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-ink-500">{probedCount}/{s.total}</span>
                          <span className="ml-2 text-[11px] text-ink-700">({pct}%)</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Unhealthy entries — dead URL alert */}
      {stats.unhealthyEntries.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-red-200 pb-2.5">
            <h2 className="display-h2 text-red-800">Dead or erroring URLs</h2>
            <p className="text-[11px] uppercase tracking-wider text-red-700 tabular">
              {stats.unhealthyEntries.length} flagged
            </p>
          </div>
          <p className="text-sm text-ink-700">
            หน้านี้แสดง URL ที่ probe ล่าสุดไม่ผ่าน HTTP 2xx/3xx. faculty review queue ควรอัปเดต URL หรือ
            mark <code>status: rotted</code> ใน citation file.
          </p>
          <ul className="mt-5 space-y-3">
            {stats.unhealthyEntries.map(e => (
              <li
                key={e.cid}
                className="rounded-md border-l-4 border-red-400 bg-red-50/40 px-5 py-4 text-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink-900">
                    HTTP {e.latestStatus || '—'} · {e.sourceId}
                  </span>
                  <time className="text-[11px] tabular text-ink-500">{e.latestProbedAt.slice(0, 10)}</time>
                </div>
                <p className="mt-1 break-all text-[12px] text-ink-700">
                  <a href={e.url} target="_blank" rel="noreferrer" className="hover:text-red-700 hover:underline">{e.url}</a>
                </p>
                {e.error && <p className="mt-1 text-[11px] text-red-800">Error: {e.error}</p>}
                <Link href={`/c/${e.cid}`} className="mt-2 inline-block text-[11px] uppercase tracking-wider text-source-800 hover:underline">
                  c/{shortCID(e.cid)} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How probes work */}
      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">How citation health is measured</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          <code className="rounded bg-paper-100 px-1.5 py-0.5 text-[13px]">scripts/mirror.mjs</code> fetches each upstream URL,
          records HTTP status + headers + <b>SHA-256 of the body</b>, and appends to the citation file&apos;s probe history.
          We <i>never</i> store the body itself — copyright-safe. Cron-runs weekly produce git diffs that show
          which URLs changed, when. <Link href="/about" className="text-source-800 underline-offset-2 hover:underline">/about</Link>{' '}
          explains the full pattern.
        </p>
      </aside>
    </article>
  )
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'paper' | 'source' | 'emerald' | 'red' }) {
  const colors = {
    paper:   'bg-paper-50 text-ink-900',
    source:  'bg-paper-50 text-source-900',
    emerald: 'bg-emerald-50 text-emerald-900',
    red:     'bg-red-50 text-red-900',
  } as const
  return (
    <div className={`p-6 ${colors[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{value}</p>
      <p className="mt-1 text-[11px] opacity-70 leading-snug">{sub}</p>
    </div>
  )
}
