import Link from 'next/link'
import { DRUGS, findDrug, verificationTier } from '@/lib/drugs'
import { groupDrugsByClass } from '@/lib/classify'
import { computeProbeStats } from '@/lib/probe-stats'
import HomeQuickAccess from './HomeQuickAccess'

const REPO = 'https://github.com/palmzamak2547/cuvetsmo-source'

export default function Landing() {
  const total = DRUGS.length
  // Same first-match-wins grouping /drugs renders, so the headline class count
  // equals the number of class sections a visitor actually sees.
  const groups = groupDrugsByClass(DRUGS)
  const classCount = groups.length
  const citations = DRUGS.reduce((n, d) => n + d.citations.length, 0)
  const doses = DRUGS.reduce((n, d) => n + d.dosages.length, 0)
  const community = DRUGS.filter(d => verificationTier(d) === 'community').length
  const expert = DRUGS.filter(d => verificationTier(d) === 'expert').length
  const probes = computeProbeStats()

  const topClasses = groups.map(({ klass, entries }) => ({
    slug: klass.slug,
    label: klass.label.split('·')[0].trim(),
    count: entries.length,
  }))

  // Freshness signal — the six entries touched most recently (ties by name).
  const recent = [...DRUGS]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated) || a.nameEn.localeCompare(b.nameEn))
    .slice(0, 6)

  const drugIndex = DRUGS.map(d => ({
    slug: d.slug,
    nameEn: d.nameEn,
    nameTh: d.nameTh,
    class: d.class,
    isCanonical: verificationTier(d) === 'expert',
  }))

  // API excerpt rendered from the live entry, so the sample can never drift
  // from what /api/drugs/<slug> actually returns.
  const sample = findDrug('meloxicam') ?? DRUGS[0]
  const sampleJson = JSON.stringify(
    {
      apiVersion: '0.0.1',
      data: {
        slug: sample.slug,
        nameEn: sample.nameEn,
        nameTh: sample.nameTh,
        class: sample.class,
        codes: { atc: sample.codes?.atc?.code ?? null },
        dosages: sample.dosages.slice(0, 1),
      },
    },
    null,
    2,
  )

  return (
    <article>
      {/* ───── Hero ───── */}
      <header className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">Verified veterinary drug reference · คลังยาสัตวแพทย์ที่ตรวจสอบได้</p>
          <h1 className="display-h1 mt-4">
            {total} drugs. Every claim{' '}
            <span className="italic text-source-800">traces to its source</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-700">
            คลังอ้างอิงยาสัตวแพทย์ภาษาไทย — ทุก dose ทุกข้อห้ามใช้ ทุกผลข้างเคียง อ้างอิงแหล่ง authoritative
            อย่างน้อย 2 แหล่ง และคลิกตามไปถึงต้นทางได้ทีละบรรทัด <b>ไม่ต้องเชื่อเรา — ตรวจเองได้</b>
          </p>

          <HomeQuickAccess topClasses={topClasses} drugIndex={drugIndex} />

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <Link href="/drugs"   className="text-source-800 underline-offset-4 hover:underline">Full Drug Reference →</Link>
            <Link href="/sources" className="text-source-800 underline-offset-4 hover:underline">Sources + methodology</Link>
            <Link href="/api"     className="text-source-800 underline-offset-4 hover:underline">Public API</Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Recently updated</span>
            {recent.map(d => (
              <Link
                key={d.slug}
                href={`/drugs/${d.slug}`}
                className="inline-flex items-baseline gap-1.5 text-ink-700 underline-offset-4 hover:text-source-800 hover:underline"
              >
                <span style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{d.nameEn}</span>
                <span className="text-[10px] tabular text-ink-500">{d.lastUpdated}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Editorial colophon — stamped masthead with the source seal */}
        <aside className="relative rounded-md border border-paper-300 bg-paper-100/60 p-6 pt-8 text-xs leading-relaxed text-ink-700">
          <div className="mb-5 flex justify-center">
            <Seal className="h-24 w-24" />
          </div>
          <p className="eyebrow text-center">Current state</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 tabular">
            <Datum n={total} label="drugs · ◆ Verified" tone="source" />
            <Datum n={classCount} label="therapeutic classes" />
            <Datum n={citations} label="cited sources" tone="source" />
            <Datum n={doses} label="species-specific doses" />
            {community > 0 && <Datum n={community} label="✓✓ community-checked" tone="source" />}
            {expert > 0 && <Datum n={expert} label="✓ expert-reviewed" tone="emerald" />}
          </dl>
          <hr className="rule mt-5 mb-3" />
          <p className="text-[11px] text-ink-500">
            Cross-checked against <b>Merck/MSD Vet Manual</b>, <b>FDA/EMA labels</b>, <b>WHO ATC</b>,
            <b> RECOVER 2024</b>, specialty guidelines, and peer-reviewed journals
          </p>
        </aside>
      </header>

      <hr className="rule-double" />

      {/* ───── Data plane ───── */}
      <section>
        <p className="eyebrow">One truth, many surfaces</p>
        <h2 className="display-h2 mt-2">อ่านบนเว็บ ดึงผ่าน API หรือให้ agent เรียกผ่าน MCP — ข้อมูลชุดเดียวกัน</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          ทุกช่องทางอ่านไฟล์ชุดเดียวกันบนดิสก์ ไม่มีสำเนา ไม่มีฐานข้อมูลแยก
          แก้ยาหนึ่งตัว ทุกช่องทางเห็นพร้อมกัน
        </p>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div className="min-w-0">
            <pre className="terminal overflow-x-auto rounded-md p-4 text-[12px] leading-relaxed">
              <span className="prompt">$ curl https://source.cuvetsmo.com/api/drugs/{sample.slug}</span>
              {'\n'}
              {sampleJson}
            </pre>
            <p className="mt-2 text-[11px] text-ink-500">
              ตัดมาบางส่วน — response จริงมีครบทุกหัวข้อ พร้อม citations {sample.citations.length} รายการของ {sample.nameEn}
            </p>
          </div>
          <ul className="space-y-5">
            <Channel
              kicker="Website"
              title="อ่านบนเว็บ"
              body="ทุก entry เปิดอ่านได้ทันที ค้นหาจากชื่อ รหัส ATC หรือข้อบ่งใช้ และค้นต่อได้แม้ไม่มีเน็ตหลังเปิดครั้งแรก"
              href="/drugs"
              cta="เปิดคู่มือยา"
            />
            <Channel
              kicker="REST API"
              title="ดึงผ่าน JSON"
              body="อ่านฟรี เปิด CORS และ cache ที่ edge หรือดาวน์โหลดทั้งคลังทีเดียวเป็น JSON หรือ CSV ที่ /api/catalog"
              href="/api"
              cta="ดู endpoints"
            />
            <Channel
              kicker="MCP server"
              title="ให้ agent เรียกเป็น tool"
              body="search_drugs, get_drug, get_by_code, list_classes, verify_citation และ catalog_stats ผ่าน stdio หรือ streamable HTTP — เปิด source ทั้งหมดใน repo"
              href={`${REPO}/tree/main/mcp`}
              cta="อ่านวิธีติดตั้ง"
            />
          </ul>
        </div>
      </section>

      <hr className="rule-double" />

      {/* ───── Position ───── */}
      <section>
        <p className="eyebrow">Position</p>
        <h2 className="display-h2 mt-2">เทียบกับเครื่องมือที่ใช้กันอยู่</h2>
        <div className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
          <Compare
            against="ChatGPT / Gemini / Perplexity"
            point="ทุกประโยคมี citation ที่คลิกไปตรวจได้จริง ไม่มี claim ลอย ๆ — ข้อความที่ไม่มีแหล่งอ้างอิงถูก gate ปฏิเสธก่อนขึ้นเว็บ"
          />
          <Compare
            against="Plumb's (USD 300/ปี)"
            point="ภาษาไทย ฟรีสำหรับนิสิตและคลินิก เน้นยาที่มีใช้จริงในประเทศไทย และเปิดข้อมูลทั้งชุดให้ดึงไปใช้ต่อได้"
          />
          <Compare
            against="Wikipedia"
            point="ทุกการแก้ไขผ่านสคริปต์ตรวจ citation ทุกบรรทัดก่อน publish ไม่ใช่ใครก็แก้ได้ และประวัติทั้งหมดเปิดให้ audit ใน git"
          />
          <Compare
            against="MIMS / UpToDate"
            point="Provenance-first — เห็นชัดว่าแต่ละบรรทัดมาจากแหล่งไหน ปรับเป็นบริบทสัตวแพทย์ไทย และเปิด source code ทั้งหมด"
          />
        </div>
      </section>

      <hr className="rule-double" />

      {/* ───── How it works ───── */}
      <section>
        <p className="eyebrow">Editorial pipeline</p>
        <h2 className="display-h2 mt-2">วิธีการทำงาน</h2>
        <ol className="mt-7 grid gap-x-10 gap-y-7 md:grid-cols-2">
          <Step
            n={1}
            title="Mirror จาก authoritative source"
            body="เริ่มทุก entry จาก Merck/MSD Vet Manual, FDA/EMA labels, WHO ATC, guideline ของสมาคมวิชาชีพ และวารสาร peer-reviewed"
          />
          <Step
            n={2}
            title="Cross-check อย่างน้อย 2 แหล่ง"
            body="ทุก dose ทุกข้อห้ามใช้ ต้องตรงกันอย่างน้อย 2 แหล่ง หากแหล่งขัดแย้งกันจะระบุไว้ในหมายเหตุ ไม่เลือกข้างเงียบ ๆ"
          />
          <Step
            n={3}
            title="Gate ก่อน publish"
            body="สคริปต์ตรวจทุกไฟล์: citation ต้องมีอยู่จริง ทุกหัวข้อต้องอ้างอิงอย่างน้อย 1 แหล่ง รหัส ATC ต้องอยู่ใน ontology — ไม่ผ่านคือไม่ขึ้นเว็บ ทั้งบนเครื่องผู้เขียนและใน CI"
          />
          <Step
            n={4}
            title="Publish ทุกช่องทางพร้อมกัน"
            body="เว็บ, API, MCP และไฟล์ export อ่านไฟล์ชุดเดียวกัน ทุก entry มีเลข version และ changelog ให้ย้อนดูได้ว่าอะไรเปลี่ยนเมื่อไร"
          />
        </ol>
      </section>

      <hr className="rule-double" />

      {/* ───── Iron Rule 0 ───── */}
      <section className="relative overflow-hidden rounded-md border border-source-300 bg-source-50/70 p-8">
        <p className="eyebrow text-source-800">Iron Rule 0</p>
        <h2 className="display-h2 mt-2 text-source-900">ไม่มีการแต่งข้อมูล — โดยโครงสร้าง ไม่ใช่โดยคำสัญญา</h2>
        <p className="mt-4 max-w-3xl text-source-900">
          เราไม่ใช่เครื่องมือสร้างข้อความ — เราคือ <b>ชั้นข้อมูลที่อ้างอิงได้</b> ซึ่งเครื่องมืออื่นควรอ้างอิงเรา
          ไม่ใช่กลับกัน ทุกบรรทัดที่ปรากฏต้องชี้กลับไปยังแหล่งที่มีตัวตนจริง
          และสคริปต์ตรวจสอบชุดเดียวกับที่เราใช้ก็เปิดให้ทุกคนรันเองได้จาก repo
        </p>
        <p className="mt-4 text-sm text-source-800">
          Provenance ที่ตรวจสอบได้ = สิ่งที่หายากที่สุดในยุคที่ข้อความถูกสร้างได้ไม่จำกัด
        </p>
      </section>

      {/* ───── Surfaces ───── */}
      <section className="mt-16">
        <p className="eyebrow">Everything that is live today</p>
        <h2 className="display-h2 mt-2">Surfaces</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          ทุกหน้าด้านล่างใช้งานได้จริงตอนนี้ — ไม่มีหน้าไหนเป็นแผนในอนาคต
        </p>
        <div className="mt-7 grid gap-px overflow-hidden rounded-md border border-paper-200 bg-paper-200 sm:grid-cols-2 lg:grid-cols-3">
          <Surface
            href="/drugs"
            title="Drug Reference"
            sub={`คู่มือยาสัตวแพทย์ — ${total} entries, ${classCount} therapeutic classes`}
            tag="Read"
          />
          <Surface
            href="/search"
            title="Search"
            sub="ค้นจากชื่อ, ATC, RxNorm, indication — works offline"
            tag="Read"
          />
          <Surface
            href="/sources"
            title="Sources + methodology"
            sub="แหล่งที่ใช้ กระบวนการ cross-check และสิ่งที่ยังไม่ได้ทำ"
            tag="Read"
          />
          <Surface
            href="/api"
            title="Public API"
            sub="Free JSON read, CORS, bulk JSON + CSV export of the whole catalog"
            tag="Machine"
          />
          <Surface
            href={`${REPO}/tree/main/mcp`}
            title="MCP server"
            sub="6 tools over stdio + streamable HTTP, same files as the website"
            tag="Machine"
          />
          <Surface
            href="/health"
            title="Citation health"
            sub={
              probes.probed > 0
                ? `${probes.healthy}/${probes.probed} probed upstream URLs healthy, dead-link detection`
                : 'Upstream URL probes and dead-link detection'
            }
            tag="Trust"
          />
          <Surface
            href="/verify"
            title="Verify"
            sub="Browser-side Ed25519 verification, no server trust"
            tag="Trust"
          />
          <Surface
            href="/trust"
            title="Chain of trust"
            sub="DID → keys → credentials + signed entries"
            tag="Trust"
          />
          <Surface
            href="/log"
            title="Transparency log"
            sub="Append-only audit trail, git-tracked, tamper-evident"
            tag="Trust"
          />
        </div>
      </section>

      <p className="mt-16 text-sm text-ink-700">
        เริ่มต้นจาก{' '}
        <Link href="/drugs" className="font-semibold text-source-800 underline-offset-4 hover:underline">คู่มือยาสัตวแพทย์</Link>
        {' '}— ทุก entry ◆ Verified: อ้างอิงและ cross-check จากหลายแหล่ง authoritative ตรวจสอบได้ทุกบรรทัด
        อ่าน{' '}
        <Link href="/sources" className="font-semibold text-source-800 underline-offset-4 hover:underline">methodology + sources</Link>
        {' '}ฉบับเต็มที่ /sources
      </p>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────
// Source Seal — editorial stamp mark used in the colophon.
// Scale via className (h-24 w-24, etc.).

function Seal({ className }: { className?: string }) {
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5)
  return (
    <svg viewBox="0 0 200 200" className={`text-source-700 ${className ?? ''}`} role="img" aria-label="CUVETSMO Source seal">
      <g transform="translate(100 100)">
        <circle r="92" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle r="80" fill="none" stroke="currentColor" strokeWidth="1" />
        <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          {ticks.map(deg => (
            <line key={deg} x1="0" y1="-95" x2="0" y2="-87" transform={`rotate(${deg})`} />
          ))}
        </g>
        <circle cx="0" cy="-100" r="3" fill="currentColor" />
        <circle r="60" fill="none" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.35" />
        <text
          x="0" y="33"
          fontFamily="var(--font-serif), Newsreader, 'Source Serif Pro', Georgia, serif"
          fontSize="126" fontWeight="700"
          fill="currentColor" textAnchor="middle"
        >S</text>
        <text
          x="0" y="60"
          fontFamily="ui-monospace, 'SF Mono', monospace"
          fontSize="7" letterSpacing="2.5"
          fill="currentColor" fillOpacity="0.55"
          textAnchor="middle"
        >MMXXVI</text>
      </g>
    </svg>
  )
}

function Datum({ n, label, tone = 'ink' }: { n: number; label: string; tone?: 'ink' | 'emerald' | 'amber' | 'source' }) {
  const colors = {
    ink:     'text-ink-900',
    emerald: 'text-emerald-800',
    amber:   'text-amber-800',
    source:  'text-source-800',
  }
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className={`mt-0.5 text-2xl font-semibold ${colors[tone]}`} style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontFeatureSettings: '"tnum"' }}>
        {n.toLocaleString()}
      </dd>
    </div>
  )
}

function Channel({ kicker, title, body, href, cta }: { kicker: string; title: string; body: string; href: string; cta: string }) {
  return (
    <li className="border-l-2 border-source-300 pl-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-source-800">{kicker}</p>
      <h3 className="mt-1 text-[17px] font-semibold text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-700">{body}</p>
      <Link href={href} className="mt-2 inline-block text-[13px] text-source-800 underline-offset-4 hover:underline">{cta} →</Link>
    </li>
  )
}

function Compare({ against, point }: { against: string; point: string }) {
  return (
    <div className="border-l-2 border-paper-300 pl-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        ต่างจาก {against}
      </p>
      <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
        {point}
      </p>
    </div>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-5">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-source-400 bg-paper-50 text-base font-bold text-source-800 tabular"
        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
      >
        {n}
      </span>
      <div className="flex-1">
        <h3 className="text-[17px] font-semibold text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{body}</p>
      </div>
    </li>
  )
}

function Surface({ href, title, sub, tag }: { href: string; title: string; sub: string; tag: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 bg-paper-50 p-6 transition hover:bg-paper-100"
    >
      <span className="text-[10px] uppercase tracking-[0.16em] text-source-800">{tag}</span>
      <h3 className="text-lg font-semibold text-ink-900 group-hover:text-source-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
        {title} <span aria-hidden className="text-source-700 opacity-0 transition group-hover:opacity-100">→</span>
      </h3>
      <p className="text-[13px] leading-snug text-ink-700">{sub}</p>
    </Link>
  )
}
