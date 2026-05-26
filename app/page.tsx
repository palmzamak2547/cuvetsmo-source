import Link from 'next/link'
import { DRUGS, pendingDrugs, publishedDrugs } from '@/lib/drugs'

export default function Landing() {
  const published = publishedDrugs().length
  const pending = pendingDrugs().length

  return (
    <article className="prose-academic">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-source-700">
          source.cuvetsmo.com · v0
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-paper-900">
          Verified Thai medical knowledge
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-paper-700">
          ในยุคที่ AI เสกข้อความได้ในวินาทีเดียว แต่ไม่มีใครรู้ว่าข้อความนั้นถูกหรือผิด —
          เราสร้างชั้นข้อมูลทางการแพทย์ภาษาไทยที่ทุกข้อความมี <b>citation chain</b>{' '}
          ที่ตรวจสอบได้ และอาจารย์ผู้เชี่ยวชาญ <b>เซ็นต์รับ</b> ทุก entry
        </p>
      </header>

      {/* Stats strip */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Published entries" value={published} note="faculty-reviewed" tone="emerald" />
        <Stat label="Pending review" value={pending} note="mirrored, awaiting signoff" tone="amber" />
        <Stat label="Source datasets" value={5} note="DailyMed · WHO · Thai FDA · PubChem · ATC" tone="source" />
      </section>

      {/* Thesis */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-paper-900">เราต่างจากเครื่องมือที่ใช้กันอยู่ยังไง</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card title="ต่างจาก ChatGPT / Gemini">
            ทุกคำตอบมี <b>citation chain</b> ที่ตรวจสอบได้ · อาจารย์เซ็นต์รับเป็นชื่อจริง ·
            ไม่มี hallucination
          </Card>
          <Card title="ต่างจาก Plumb's (USD 300/ปี)">
            <b>ภาษาไทย</b> · ฟรีสำหรับนิสิต + คลินิก · adapt กับยาที่มีในประเทศไทย ·
            อ้างอิงสมาคมสัตวแพทย์ไทย + WHO + FDA + อย.
          </Card>
          <Card title="ต่างจาก Wikipedia">
            ทุก edit ผ่าน <b>faculty review queue</b> ก่อน publish · ไม่ใช่ใครก็แก้ได้ · revision history เปิด audit ได้
          </Card>
          <Card title="ต่างจาก MIMS / UpToDate">
            <b>Provenance-first</b> — เห็นชัดว่าข้อมูลมาจากแหล่งไหน · ปรับให้เป็นภาษาไทย · เปิด source code
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-paper-900">วิธีการทำงาน</h2>
        <ol className="mt-4 space-y-3">
          <Step n={1} title="Mirror จาก authoritative source">
            เริ่มต้นทุก entry จากการ mirror ข้อมูลของ <b>DailyMed (FDA)</b>, <b>WHO Essential Medicines List</b>,
            <b> Thai FDA (อย.)</b>, <b>PubChem (NIH)</b>, <b>ATC (WHO)</b>, และ <b>WSAVA guidelines</b> —
            ทั้งหมดเป็นแหล่งที่เปิดให้ใช้ได้ตามใบอนุญาตของแต่ละแหล่ง
          </Step>
          <Step n={2} title="Tag กับ Chula curriculum">
            เชื่อมแต่ละ entry กับรายวิชาในหลักสูตรสัตวแพทย์ พ.ศ. 2561 และ พ.ศ. 2568 — นิสิตเห็นว่าหัวข้อไหนเกี่ยวกับรายวิชาไหน
          </Step>
          <Step n={3} title="Faculty review queue">
            อาจารย์ภาควิชาเภสัชวิทยา · ภาควิชาคลินิก · หรือผู้เชี่ยวชาญที่ระบุ ตรวจสอบ Thai translation +
            adapt เนื้อหากับ context ไทย — ลงชื่อเซ็นต์รับ
          </Step>
          <Step n={4} title="Publish + version">
            Entry ที่ผ่านการตรวจขึ้น public listing พร้อม <b>emerald trust stamp</b> · ทุก revision เก็บใน
            changelog · readers ดู diff ระหว่าง version ได้
          </Step>
          <Step n={5} title="Compound over years">
            ทุก entry คือ data point ถาวร · ปีที่ 5 มี dataset Thai medical ที่ไม่มีใครทำเทียบได้ →
            API license สำหรับ AI startups · institutional subscription · research grants
          </Step>
        </ol>
      </section>

      {/* Trust banner */}
      <section className="mt-12 rounded-2xl border-2 border-source-300 bg-source-50 p-6">
        <h2 className="text-lg font-bold text-source-900">Anti-AI-hallucination by construction</h2>
        <p className="mt-2 text-sm text-source-800">
          เราไม่ใช่ AI generator. เราคือ <b>citation-traceable knowledge layer</b> ที่ AI products
          สามารถ <b>อ้างอิงเรา</b> ได้ในอนาคต. ทุก fact ที่ปรากฏบนเว็บนี้ผ่านการ verify จากมนุษย์
          ที่มีชื่อ-ตำแหน่ง-สังกัด ของจริง
        </p>
        <p className="mt-3 text-xs text-source-700">
          Provenance + named accountability = scarce resource ใน era ที่ AI commoditize generation
        </p>
      </section>

      <p className="mt-12 text-sm text-paper-700">
        เริ่มต้นจาก{' '}
        <Link href="/drugs" className="font-semibold text-source-700 hover:underline">
          คู่มือยาสัตวแพทย์
        </Link>
        {' '}— Phase 0 มี {pending} entry ที่ mirrored + รอ faculty review.
        ดู{' '}
        <Link href="/sources" className="font-semibold text-source-700 hover:underline">
          methodology + sources
        </Link>
        {' '}ฉบับเต็ม
      </p>
    </article>
  )
}

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: number
  note: string
  tone: 'emerald' | 'amber' | 'source'
}) {
  const tones = {
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    amber:   'border-amber-300   bg-amber-50   text-amber-900',
    source:  'border-source-300  bg-source-50  text-source-900',
  }
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-75">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] opacity-75">{note}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-paper-200 bg-white p-5">
      <h3 className="text-base font-bold text-paper-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-paper-700">{children}</p>
    </div>
  )
}

function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-source-600 text-sm font-bold text-white">
        {n}
      </span>
      <div className="flex-1">
        <h3 className="text-base font-bold text-paper-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-paper-700">{children}</p>
      </div>
    </li>
  )
}

// Keep DRUGS referenced so the import survives tree-shake
export const _allEntries = DRUGS.length
