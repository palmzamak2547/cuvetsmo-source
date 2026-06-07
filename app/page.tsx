import Link from 'next/link'
import { DRUGS, verificationTier } from '@/lib/drugs'
import { THERAPEUTIC_CLASSES, classifyDrug, groupDrugsByClass } from '@/lib/classify'
import HomeQuickAccess from './HomeQuickAccess'

export default function Landing() {
  const total = DRUGS.length
  const community = DRUGS.filter(d => verificationTier(d) === 'community').length
  const expert = DRUGS.filter(d => verificationTier(d) === 'expert').length
  // Use the same first-match-wins grouping the /drugs page renders, so the
  // headline class count == the number of class sections a visitor actually sees
  // (a class whose drugs all fall under an earlier-matching class renders 0
  // sections and must not be counted). Keeps home == /drugs == README at 31.
  const classCount = groupDrugsByClass(DRUGS).length
  // citation count across all entries
  const citations = DRUGS.reduce((n, d) => n + d.citations.length, 0)

  // Top therapeutic classes for the quick-access bar — derived from the same
  // first-match-wins grouping the /drugs + class pages render, so every chip
  // links to a class page that actually has those entries (no dead chips for
  // classes whose drugs all fall under an earlier-matching class).
  const topClasses = groupDrugsByClass(DRUGS)
    .map(({ klass, entries }) => ({ slug: klass.slug, label: klass.label.split('·')[0].trim(), count: entries.length }))

  // Slim drug list for the recently-viewed lookup
  const drugIndex = DRUGS.map(d => ({
    slug: d.slug,
    nameEn: d.nameEn,
    nameTh: d.nameTh,
    class: d.class,
    isCanonical: verificationTier(d) === 'expert',
  }))

  return (
    <article>
      {/* ───── Hero ───── */}
      <header className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">Verified Thai medical knowledge — v0</p>
          <h1 className="display-h1 mt-4">
            Drug references whose every claim,<br className="hidden sm:inline" />
            citation, and signoff{' '}
            <span className="italic text-source-800">verifies in your browser</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-700">
            ในยุคที่ AI generate ข้อความได้เป็นล้านในนาที สิ่งที่ขาดแคลนคือ <b>ความเชื่อใจที่พิสูจน์ได้</b> —
            เว็บนี้คือชั้นข้อมูลทางการแพทย์ภาษาไทยที่ทุก dose, ทุก contraindication,
            ทุก signature ตรวจสอบกลับไปยังแหล่งต้นทางและคีย์อาจารย์ผู้รับผิดชอบได้
            โดยไม่ต้องเชื่อ server ของเรา
          </p>

          <HomeQuickAccess topClasses={topClasses} drugIndex={drugIndex} />

          <div className="mt-6 flex flex-wrap gap-3 text-[13px]">
            <Link href="/drugs"      className="text-source-800 underline-offset-4 hover:underline">Full Drug Reference →</Link>
            <span className="text-ink-500">·</span>
            <Link href="/use-cases"  className="text-source-800 underline-offset-4 hover:underline">Who actually uses this?</Link>
            <span className="text-ink-500">·</span>
            <Link href="/about"      className="text-source-800 underline-offset-4 hover:underline">How it works</Link>
          </div>
        </div>

        {/* Editorial colophon — stamped masthead with the source seal */}
        <aside className="relative rounded-md border border-paper-300 bg-paper-100/60 p-6 pt-8 text-xs leading-relaxed text-ink-700">
          {/* The seal mark — academic-stationery imprint */}
          <div className="mb-5 flex justify-center">
            <Seal className="h-24 w-24" />
          </div>
          <p className="eyebrow text-center">Phase 0 — current state</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 tabular">
            <Datum n={total} label="ยาในคลัง · entries" />
            <Datum n={total} label="◆ Verified · multi-source" tone="source" />
            <Datum n={citations} label="citations indexed" tone="source" />
            <Datum n={classCount} label="therapeutic classes" />
            {community > 0 && <Datum n={community} label="✓✓ community-checked" tone="source" />}
            {expert > 0 && <Datum n={expert} label="✓ expert-reviewed" tone="emerald" />}
          </dl>
          <hr className="rule mt-5 mb-3" />
          <p className="text-[11px] text-ink-500">
            Cross-checked against <b>DailyMed (FDA)</b>, <b>WHO EML</b>, <b>Thai FDA</b>,
            <b> PubChem (NIH)</b>, <b>WHO ATC</b>, and <b>WSAVA</b> guidelines
          </p>
        </aside>
      </header>

      <hr className="rule-double" />

      {/* ───── Thesis ───── */}
      <section>
        <p className="eyebrow">Position</p>
        <h2 className="display-h2 mt-2">เทียบกับเครื่องมือที่ใช้กันอยู่</h2>
        <div className="mt-6 grid gap-x-10 gap-y-7 md:grid-cols-2">
          <Compare
            against="ChatGPT / Gemini / Perplexity"
            point="ทุกประโยคมี citation chain ที่ตรวจสอบได้, อาจารย์เซ็นต์รับเป็นชื่อจริง, ไม่มี hallucination"
          />
          <Compare
            against="Plumb's (USD 300/ปี)"
            point="ภาษาไทย, ฟรีสำหรับนิสิต + คลินิก, adapt กับยาที่มีในประเทศไทย, อ้างอิงสมาคมสัตวแพทย์ไทย + WHO + FDA + อย."
          />
          <Compare
            against="Wikipedia"
            point="ทุก edit ผ่าน faculty review queue ก่อน publish, ไม่ใช่ใครก็แก้ได้, revision history เปิด audit ได้"
          />
          <Compare
            against="MIMS / UpToDate"
            point="Provenance-first — เห็นชัดว่าข้อมูลมาจากแหล่งไหน, ปรับเป็นภาษาไทย, เปิด source code"
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
            body="เริ่มต้นทุก entry จากการ mirror DailyMed (FDA), WHO Essential Medicines List, Thai FDA, PubChem, ATC, WSAVA — แหล่งที่เปิดให้ใช้ได้ตามใบอนุญาตของแต่ละแหล่ง"
          />
          <Step
            n={2}
            title="Tag กับ Chula curriculum"
            body="เชื่อม entry กับรายวิชาในหลักสูตรสัตวแพทย์ พ.ศ. 2561 + 2568 — นิสิตเห็นว่าหัวข้อไหนเกี่ยวกับรายวิชาไหน"
          />
          <Step
            n={3}
            title="Faculty review queue"
            body="อาจารย์ภาควิชาเภสัชวิทยา ภาควิชาคลินิก หรือผู้เชี่ยวชาญที่ระบุ ตรวจ Thai translation, adapt context ไทย, เซ็นต์ Ed25519 ด้วยคีย์ส่วนตัว"
          />
          <Step
            n={4}
            title="Publish — math takes over"
            body="Entry ที่ผ่านการตรวจขึ้น public listing พร้อม emerald trust stamp, ทุก reader ตรวจ signature ในเครื่องตัวเองได้ด้วย Web Crypto"
          />
          <Step
            n={5}
            title="Compound over years"
            body="ทุก entry คือ data point ถาวร — ปีที่ 5 มี Thai medical dataset ที่ไม่มีใครทำเทียบได้ → API license, institutional subscription, research grants"
          />
        </ol>
      </section>

      <hr className="rule-double" />

      {/* ───── Trust banner ───── */}
      <section className="relative overflow-hidden rounded-md border border-source-300 bg-source-50/70 p-8">
        <p className="eyebrow text-source-800">Iron Rule 0</p>
        <h2 className="display-h2 mt-2 text-source-900">Anti-AI-hallucination by construction</h2>
        <p className="mt-4 max-w-3xl text-source-900">
          เราไม่ใช่ AI generator — เราคือ <b>citation-traceable knowledge layer</b> ที่ AI products
          อ้างอิงเราได้ ไม่ใช่กลับกัน ทุก fact ที่ปรากฏผ่านการ verify จากมนุษย์
          ที่มีชื่อ–ตำแหน่ง–สังกัด ของจริง คีย์ของเขา committed อยู่ในเรโปและตรวจสอบได้ทุกเวลา
        </p>
        <p className="mt-4 text-sm text-source-800">
          Provenance + named accountability = scarce resource ในยุคที่ AI commoditize generation
        </p>
      </section>

      {/* ───── Surfaces ───── */}
      <section className="mt-16">
        <p className="eyebrow">Phase 0 — 8 primitives shipped</p>
        <h2 className="display-h2 mt-2">Surfaces</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          แต่ละ surface ด้านล่างคือ working artifact ของหนึ่งใน primitives ที่ออกแบบไว้ใน ARCHITECTURE.md
        </p>
        <div className="mt-7 grid gap-px overflow-hidden rounded-md border border-paper-200 bg-paper-200 sm:grid-cols-2 lg:grid-cols-3">
          <Surface
            href="/drugs"
            title="Drug Reference"
            sub={`คู่มือยาสัตวแพทย์ — ${total} entries, ${classCount} therapeutic classes`}
            tag="P7 git-native"
          />
          <Surface
            href="/search"
            title="Search"
            sub="ค้นจากชื่อ, ATC, RxNorm, indication — works offline"
            tag="P8 offline PWA"
          />
          <Surface
            href="/verify"
            title="Verify"
            sub="Browser-side Ed25519 verification, no server trust"
            tag="P1 provenance"
          />
          <Surface
            href="/credentials"
            title="Credentials"
            sub="W3C Verifiable Credentials, did:web root of trust"
            tag="P4 VC pipeline"
          />
          <Surface
            href="/api"
            title="Public API"
            sub="Free read, CORS, rate-limit headers, 402 paid tier"
            tag="P6 inverted economics"
          />
          <Surface
            href="/health"
            title="Citation health"
            sub="132/132 probed, 100% healthy, dead-URL detection"
            tag="P2 fingerprint probes"
          />
          <Surface
            href="/trust"
            title="Chain of trust"
            sub="DID → keys → credentials + signed entries"
            tag="P1+P4 hierarchy"
          />
          <Surface
            href="/log"
            title="Transparency log"
            sub="Append-only audit trail, git-tracked, tamper-evident"
            tag="P1 append-only"
          />
          <Surface
            href="/assist"
            title="Faculty assistant"
            sub="Side-by-side EN→TH translation editor for reviewers"
            tag="P8 client-side"
          />
        </div>
      </section>

      <p className="mt-16 text-sm text-ink-700">
        เริ่มต้นจาก{' '}
        <Link href="/drugs" className="font-semibold text-source-800 underline-offset-4 hover:underline">คู่มือยาสัตวแพทย์</Link>
        {' '}— ทุก entry ◆ Verified: อ้างอิงและ cross-check จากหลายแหล่ง authoritative ตรวจสอบได้ทุกบรรทัด.
        อ่าน{' '}
        <Link href="/sources" className="font-semibold text-source-800 underline-offset-4 hover:underline">methodology + sources</Link>
        {' '}ฉบับเต็มที่ /sources
      </p>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────
// Source Seal — editorial stamp mark used in the colophon.
// Scale via className (h-24 w-24, etc.).

function Seal({ className }: { className?: string }) {
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5)
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label="CUVETSMO Source seal">
      <g transform="translate(100 100)">
        {/* outer ring */}
        <circle r="92" fill="none" stroke="#0a635a" strokeWidth="2.4" />
        {/* inner double-stroke */}
        <circle r="80" fill="none" stroke="#0a635a" strokeWidth="1" />
        {/* 16 ticks */}
        <g stroke="#0a635a" strokeWidth="1.7" strokeLinecap="round">
          {ticks.map(deg => (
            <line key={deg} x1="0" y1="-95" x2="0" y2="-87" transform={`rotate(${deg})`} />
          ))}
        </g>
        {/* 12 o'clock anchor */}
        <circle cx="0" cy="-100" r="3" fill="#0a635a" />
        {/* hairline frame around S */}
        <circle r="60" fill="none" stroke="#0a635a" strokeWidth="0.6" strokeOpacity="0.35" />
        {/* central S */}
        <text
          x="0" y="33"
          fontFamily="var(--font-serif), Newsreader, 'Source Serif Pro', Georgia, serif"
          fontSize="126" fontWeight="700"
          fill="#0a635a" textAnchor="middle"
        >S</text>
        {/* year stamp */}
        <text
          x="0" y="60"
          fontFamily="ui-monospace, 'SF Mono', monospace"
          fontSize="7" letterSpacing="2.5"
          fill="#0a635a" fillOpacity="0.55"
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

// Keep DRUGS referenced so the import survives tree-shake
export const _allEntries = DRUGS.length
