// /sources — where every citation actually points, and how we curate.
//
// The source table is computed from the citation corpus at build time, so
// this page can never name a source we do not actually cite, or a count
// that has drifted from the data (Iron Rule 0 applied to our own copy).

import Link from 'next/link'
import { DRUGS, verificationTier } from '@/lib/drugs'
import { computeProbeStats } from '@/lib/probe-stats'

export const metadata = {
  title: 'Sources & curation methodology',
  description: 'แหล่งอ้างอิงที่ citation ทั้งหมดของ source.cuvetsmo.com ชี้ไปจริง — นับจากข้อมูล ณ build ล่าสุด — และกระบวนการ cross-check อย่างน้อย 2 แหล่งก่อน publish',
}

// Curated descriptions for the hosts we cite most. Anything not listed still
// appears in the table by hostname — the data drives the table, not this map.
const KNOWN: Record<string, { name: string; body: string; license: string }> = {
  'merckvetmanual.com':          { name: 'Merck/MSD Veterinary Manual',        body: 'ตำราอ้างอิงสัตวแพทย์มาตรฐาน — pharmacology, dose ranges, contraindications ตามชนิดสัตว์', license: 'อ่านฟรี, © Merck & Co. — อ้างอิง ไม่คัดลอก' },
  'dailymed.nlm.nih.gov':        { name: 'NLM DailyMed (FDA labels)',           body: 'FDA-approved Structured Product Labeling รวมฉลากยาสัตวแพทย์ที่ขึ้นทะเบียนในสหรัฐฯ', license: 'U.S. Government work — public domain' },
  'plumbs.com':                  { name: "Plumb's Veterinary Drugs",            body: 'formulary สัตวแพทย์ที่ใช้เป็นมาตรฐานทั่วโลก — ใช้ cross-check dose ต่อชนิดสัตว์', license: 'Subscription — อ้างอิงเพื่อยืนยัน ไม่ทำซ้ำเนื้อหา' },
  'whocc.no':                    { name: 'WHO ATC/DDD Index',                   body: 'รหัส Anatomical Therapeutic Chemical ของ WHO รวม Q-codes สำหรับยาสัตว์ (ATCvet)', license: 'WHO Collaborating Centre — ใช้ได้โดยระบุที่มา' },
  'en.wikipedia.org':            { name: 'Wikipedia (drug infobox)',            body: 'ใช้ยืนยันรหัส ATC/ATCvet ชื่อสามัญ และภาพรวมกลไกเท่านั้น — ไม่ใช่แหล่งของ dose แม้แต่แถวเดียว', license: 'CC BY-SA 4.0' },
  'pubchem.ncbi.nlm.nih.gov':    { name: 'PubChem (NIH/NLM)',                   body: 'identifiers, โครงสร้างโมเลกุล และ pharmacology summary', license: 'NIH open data — public domain' },
  'who.int':                     { name: 'WHO publications',                    body: 'Essential Medicines List และเอกสาร WHO ที่เกี่ยวข้อง', license: 'CC BY-NC-SA 3.0 IGO' },
  'pubmed.ncbi.nlm.nih.gov':     { name: 'PubMed',                              body: 'วารสาร peer-reviewed — abstract + ลิงก์บทความ', license: 'Abstract public domain; บทความตาม license ของผู้จัดพิมพ์' },
  'pmc.ncbi.nlm.nih.gov':        { name: 'PubMed Central',                      body: 'บทความฉบับเต็ม open access', license: 'ตาม license ของแต่ละบทความ' },
  'wsava.org':                   { name: 'WSAVA Guidelines',                    body: 'pain management, vaccination, nutrition guidelines ของ World Small Animal Veterinary Association', license: 'Free for educational use with attribution' },
  'petplace.com':                { name: 'PetPlace',                            body: 'monograph สำหรับเจ้าของสัตว์ที่เขียนโดยสัตวแพทย์ — ใช้เป็นแหล่งที่สองประกอบ', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'vcahospitals.com':            { name: 'VCA Animal Hospitals',                body: 'client-education monographs เขียนโดยสัตวแพทย์ — ใช้เป็นแหล่งที่สองประกอบ', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'todaysveterinarypractice.com':{ name: "Today's Veterinary Practice",         body: 'บทความคลินิก peer-reviewed สำหรับสัตวแพทย์ (NAVC)', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'drugs.com':                   { name: 'Drugs.com',                           body: 'monograph ยาและ section สัตวแพทย์จากฉลากผู้ผลิต', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'vsso.org':                    { name: 'Veterinary Society of Surgical Oncology', body: 'chemotherapy protocols และ dose ของยา oncology', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'dvm360.com':                  { name: 'dvm360',                              body: 'บทความคลินิกและ CE สำหรับสัตวแพทย์', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'sites.tufts.edu':             { name: 'Tufts Cummings School of Veterinary Medicine', body: 'cardiology dosing references', license: '© เจ้าของเว็บ — อ้างอิงเท่านั้น' },
  'aaha.org':                    { name: 'AAHA Guidelines',                     body: 'guidelines ของ American Animal Hospital Association', license: 'อ่านฟรี — อ้างอิงเท่านั้น' },
  'onlinelibrary.wiley.com':     { name: 'Wiley Online Library',                body: 'วารสารสัตวแพทย์ peer-reviewed', license: 'ตาม license ของแต่ละบทความ' },
}

const TYPE_LABEL: Record<string, string> = {
  monograph: 'monograph',
  textbook: 'ตำรา',
  guideline: 'guideline สมาคมวิชาชีพ',
  'regulatory-database': 'ฐานข้อมูลทะเบียน / ฉลากยา',
  'package-insert': 'เอกสารกำกับยา',
  paper: 'วารสาร peer-reviewed',
  'faculty-statement': 'คำชี้แจงจากอาจารย์',
}

export default function Sources() {
  const total = DRUGS.length
  const all = DRUGS.flatMap(d => d.citations)
  const citations = all.length
  const withCid = all.filter(c => c.cid).length
  const doses = DRUGS.reduce((n, d) => n + d.dosages.length, 0)

  const byHost = new Map<string, number>()
  for (const c of all) {
    let host = '(ไม่มี URL — เอกสารพิมพ์)'
    try { if (c.url) host = new URL(c.url).hostname.replace(/^www\./, '') } catch { /* keep label */ }
    byHost.set(host, (byHost.get(host) ?? 0) + 1)
  }
  const hosts = [...byHost.entries()].sort((a, b) => b[1] - a[1])
  const top = hosts.slice(0, 18)
  const restCount = hosts.slice(18).reduce((n, [, c]) => n + c, 0)
  const restHosts = hosts.length - top.length

  const byType = new Map<string, number>()
  for (const c of all) byType.set(c.type, (byType.get(c.type) ?? 0) + 1)
  const types = [...byType.entries()].sort((a, b) => b[1] - a[1])

  const community = DRUGS.filter(d => verificationTier(d) === 'community').length
  const expert = DRUGS.filter(d => verificationTier(d) === 'expert').length
  const probes = computeProbeStats()

  return (
    <article className="max-w-3xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Curation methodology</p>
        <h1 className="display-h1 mt-3">Sources & how we curate</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          เราไม่สร้างข้อมูลทางการแพทย์ขึ้นเอง — ทุก entry <b>เรียบเรียงจากแหล่งที่ระบุชื่อได้</b>, ทุก dose และข้อห้ามใช้
          ต้อง <b>ตรงกันอย่างน้อย 2 แหล่ง</b>, และทุกบรรทัดชี้กลับไปยัง citation ที่คลิกตรวจได้. ตารางด้านล่างนับจาก
          citation จริงทั้ง {citations.toLocaleString()} รายการใน {total} entries ณ build ล่าสุด — ไม่ใช่รายชื่อที่เขียนไว้ล่วงหน้า.
        </p>
      </header>

      {/* ───── Where citations point ───── */}
      <section className="mt-10">
        <p className="eyebrow">Where the citations actually point</p>
        <h2 className="display-h2 mt-2">แหล่งที่ถูกอ้างอิง เรียงตามจำนวนครั้ง</h2>
        <ul className="mt-5 space-y-3">
          {top.map(([host, count]) => {
            const k = KNOWN[host]
            return (
              <li key={host} className="rounded-md border border-paper-300 bg-paper-50 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[16px] font-semibold text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                    {k?.name ?? host}
                  </h3>
                  <span className="text-[11px] tabular text-ink-500">
                    {count.toLocaleString()} citation{count === 1 ? '' : 's'}
                  </span>
                </div>
                {k ? (
                  <>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">{k.body}</p>
                    <p className="mt-1 text-[11px] text-ink-500">License: {k.license}</p>
                  </>
                ) : (
                  <p className="mt-1.5 text-[12px] text-ink-500">{host}</p>
                )}
                {host.includes('.') && (
                  <a
                    href={`https://${host}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[11px] text-source-800 hover:underline"
                  >
                    {host} ↗
                  </a>
                )}
              </li>
            )
          })}
        </ul>
        {restHosts > 0 && (
          <p className="mt-3 text-[12px] text-ink-500">
            + อีก {restHosts} แหล่ง รวม {restCount.toLocaleString()} citations (วารสารและเว็บวิชาชีพที่อ้างน้อยกว่า 10 ครั้ง) —
            ดูรายการเต็มได้ในหน้า References ของแต่ละ entry
          </p>
        )}

        <div className="mt-6 rounded-md border border-paper-300 bg-paper-100/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">แยกตามประเภท citation</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {types.map(([type, count]) => (
              <li key={type} className="inline-flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-50 px-3 py-1 text-[12px] text-ink-700">
                {TYPE_LABEL[type] ?? type}
                <span className="rounded-full bg-paper-200 px-1.5 py-px text-[10px] font-semibold tabular">{count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="rule-double" />

      {/* ───── How we cross-check ───── */}
      <section>
        <p className="eyebrow">Method</p>
        <h2 className="display-h2 mt-2">เราตรวจอย่างไร</h2>
        <ol className="mt-6 space-y-5">
          <Step n={1} title="เริ่มจากแหล่ง authoritative">
            entry ทุกตัวเริ่มจาก Merck/MSD Vet Manual, ฉลากยา FDA (DailyMed) / EMA, WHO ATC และ guideline ของสมาคมวิชาชีพ
            แล้วจึงเติมรายละเอียดจากตำรา วารสาร และ monograph ที่ระบุไว้ข้างบน
          </Step>
          <Step n={2} title="cross-check อย่างน้อย 2 แหล่งต่อ claim">
            dose ต่อชนิดสัตว์ ข้อห้ามใช้ และผลข้างเคียงต้องตรงกันอย่างน้อย 2 แหล่ง — หากแหล่งขัดแย้งกัน เราระบุช่วงและหมายเหตุไว้ในแถวนั้น
            ไม่เลือกข้างเงียบ ๆ. Wikipedia ใช้ยืนยันรหัส ATC และชื่อเท่านั้น
          </Step>
          <Step n={3} title="ปรับเป็นภาษาไทยและบริบทสัตวแพทย์ไทย">
            ชื่อสามัญ ชื่อการค้าที่พบในไทย และคำอธิบายเป็นภาษาไทย โดยคง dose และหน่วยตามแหล่งต้นทางทุกตัวอักษร
          </Step>
          <Step n={4} title="gate ก่อนขึ้นเว็บ — ทั้งบนเครื่องผู้เขียนและใน CI">
            <code>scripts/verify.mjs</code> ตรวจทุกไฟล์: ฟิลด์ที่จำเป็นครบ, ทุก citation id ที่ถูกอ้างมีอยู่จริง, ทุกหัวข้อและทุกแถว dose
            มี citation อย่างน้อย 1 รายการ, รหัส ATC อยู่ใน ontology จริง, CID ที่ระบุ hash ตรงกับไฟล์, และ entry ต้องมีชื่อผู้เรียบเรียง.
            ไม่ผ่านข้อใดข้อหนึ่ง = push ไม่ได้และ CI แดง
          </Step>
          <Step n={5} title="probe แหล่งต้นทางต่อเนื่อง">
            URL ของ citation ที่ mirror ไว้ถูกตรวจซ้ำว่ายังเปิดได้ —{' '}
            {probes.probed > 0
              ? `ตอนนี้ ${probes.healthy}/${probes.probed} รายการที่ probe แล้วยังปกติ`
              : 'ผลล่าสุดอยู่ที่หน้า Citation health'}{' '}
            (<Link href="/health" className="text-source-800 underline-offset-2 hover:underline">/health</Link>)
          </Step>
        </ol>
      </section>

      <hr className="rule-double" />

      {/* ───── Verification ladder ───── */}
      <section>
        <p className="eyebrow">Verification ladder</p>
        <h2 className="display-h2 mt-2">ขั้นความเชื่อถือ — นับตามจริง</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Rung
            stamp="◆ Verified"
            tone="source"
            n={total}
            body="ทุก claim อ้างอิงแหล่ง authoritative และ cross-check ≥ 2 แหล่ง — ใช้อ้างอิงได้ ยืนยันขนาดยากับตำราหรือดุลพินิจทางคลินิกก่อนใช้จริงเสมอ"
          />
          <Rung
            stamp="✓✓ Community-checked"
            tone="sky"
            n={community}
            body="ผู้ใช้อิสระอย่างน้อย 2 คนยืนยันว่า entry ตรงกับแหล่งที่อ้าง — โครงสร้างมีแล้ว ยังไม่มี entry ไหนไปถึง"
          />
          <Rung
            stamp="✓ Expert-reviewed"
            tone="emerald"
            n={expert}
            body="อาจารย์หรือสัตวแพทย์ที่ยืนยันตัวตนรับรองและลงนาม Ed25519 — ระบบลงนามและหน้า verify พร้อมแล้ว ยังไม่มี entry ไหนไปถึง"
          />
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-700">
          ภาควิชาที่เราตั้งใจเชิญให้รับรอง entry กลุ่มยาต่าง ๆ: <b>ภาควิชาเภสัชวิทยา</b> (pharmacology, toxicology, interactions),{' '}
          <b>ภาควิชาอายุรศาสตร์</b> (clinical use, dosing ในสัตว์เลี้ยง) และ <b>ภาควิชาสัตวแพทยสาธารณสุข</b> (food safety, withdrawal period).
          ยังไม่มีการรับรองอย่างเป็นทางการจากภาควิชาใด — เมื่อมี ชื่อและวันที่จะปรากฏบน entry และใน{' '}
          <Link href="/log" className="text-source-800 underline-offset-2 hover:underline">transparency log</Link>.
          อาจารย์ที่สนใจเริ่มได้ที่ <Link href="/onboarding" className="text-source-800 underline-offset-2 hover:underline">/onboarding</Link>.
        </p>
      </section>

      <hr className="rule-double" />

      {/* ───── Iron Rule 0 ───── */}
      <section>
        <p className="eyebrow">Iron Rule 0</p>
        <h2 className="display-h2 mt-2">ไม่มีการแต่งข้อมูล</h2>
        <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed text-ink-800">
          <Rule>ห้าม publish ข้อความทางคลินิกที่ไม่มี citation — gate ปฏิเสธก่อนถึงเว็บ</Rule>
          <Rule>ทุก dose, indication, contraindication โยงกลับไป citation ที่มีอยู่จริงและคลิกได้</Rule>
          <Rule>ทุก citation มีประเภท ชื่อ และ URL (หรือระบุว่าเป็นเอกสารพิมพ์) — {withCid} รายการมีสำเนา content-addressed ที่ <code>/c/&lt;cid&gt;</code></Rule>
          <Rule>ทุก entry แสดงขั้นความเชื่อถือตามจริง — ไม่มีป้าย "pending" หรือ "ห้ามใช้" และไม่มีป้าย "รับรองแล้ว" ที่ยังไม่มีคนรับรอง</Rule>
          <Rule>หากพบข้อผิดพลาด แก้ที่ไฟล์ต้นทางใน git — ทุกช่องทาง (เว็บ, API, MCP, export) เปลี่ยนพร้อมกัน และ history เปิดให้ตรวจย้อนหลัง</Rule>
        </ul>
      </section>

      <hr className="rule-double" />

      {/* ───── Known limitations ───── */}
      <section>
        <p className="eyebrow">Honest limits</p>
        <h2 className="display-h2 mt-2">สิ่งที่หน้านี้ยังไม่รับรอง</h2>
        <ul className="mt-5 space-y-2.5 text-[15px] leading-relaxed text-ink-800">
          <Rule>dose ทั้ง {doses.toLocaleString()} แถวเป็น <b>ค่าอ้างอิงจากแหล่งต้นทาง</b> ไม่ใช่ใบสั่งยา — ต้องใช้ดุลพินิจของสัตวแพทย์ผู้ตรวจรักษาเสมอ</Rule>
          <Rule>การมีจำหน่ายในประเทศไทยระบุเฉพาะ entry ที่มีชื่อการค้าไทยบันทึกไว้ — เรายังไม่ได้ตรวจทะเบียน อย. รายตัว</Rule>
          <Rule>แหล่งส่วนใหญ่เป็นภาษาอังกฤษจากสหรัฐฯ/ยุโรป — ขนาดยาและข้อบ่งใช้อาจต่างจากทะเบียนยาในไทย</Rule>
          <Rule>ยังไม่มี entry ใดผ่านการรับรองโดยอาจารย์หรือผู้ตรวจอิสระ — ทุก entry อยู่ที่ขั้น ◆ Verified</Rule>
        </ul>
        <p className="mt-6 text-sm text-ink-700">
          พบข้อผิดพลาดหรือแหล่งที่ดีกว่า? แจ้งที่{' '}
          <Link href="/feedback" className="text-source-800 underline-offset-2 hover:underline">/feedback</Link>{' '}
          หรือเปิด issue ใน{' '}
          <a href="https://github.com/palmzamak2547/cuvetsmo-source/issues" target="_blank" rel="noopener noreferrer" className="text-source-800 underline-offset-2 hover:underline">GitHub</a>.
        </p>
      </section>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
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
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</p>
      </div>
    </li>
  )
}

function Rung({ stamp, tone, n, body }: { stamp: string; tone: 'source' | 'sky' | 'emerald'; n: number; body: string }) {
  const styles = {
    source:  { box: 'border-source-300 bg-source-50/60', stamp: 'border-source-600 text-source-800', n: 'text-source-800' },
    sky:     { box: 'border-sky-300 bg-sky-50/50',       stamp: 'border-sky-700 text-sky-800',       n: 'text-sky-800' },
    emerald: { box: 'border-emerald-300 bg-emerald-50/50', stamp: 'border-emerald-700 text-emerald-800', n: 'text-emerald-800' },
  } as const
  const s = styles[tone]
  return (
    <div className={`rounded-md border p-4 ${s.box}`}>
      <p className={`stamp ${s.stamp}`}>{stamp}</p>
      <p className={`mt-3 text-3xl font-semibold tabular ${s.n}`} style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
        {n.toLocaleString()}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-700">{body}</p>
    </div>
  )
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-source-400" aria-hidden />
      <span className="flex-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</span>
    </li>
  )
}
