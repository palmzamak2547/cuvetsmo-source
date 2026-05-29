// /use-cases — concrete personas + adoption ladder.
//
// Built in response to a real concern: many Defi/Web3 projects died
// because they were "solution looking for problem." This page makes
// the inverse argument — there are concrete user pain points being
// solved badly today, and the platform delivers value even if you
// strip out all the cryptographic infrastructure.

import Link from 'next/link'

export const metadata = {
  title: 'Use cases · Who actually uses this',
  description: 'Concrete user personas across 3 adoption tiers, each with current pain + workaround + value of cryptographic provenance. Why this is not a solution-looking-for-problem.',
}

type Persona = {
  who: string
  whoEn: string
  pain: string
  currentWorkaround: string
  whatTheyUse: string
  cryptoValue: 'low' | 'medium' | 'high' | 'very-high'
  networkEffect: string
  surfaces: Array<{ href: string; label: string }>
}

const TIER_1: Persona[] = [
  {
    who: 'นิสิตสัตวแพทย์ Vet 4-6 (CU + Mahidol + Kasetsart + etc.)',
    whoEn: 'Veterinary student, years 4-6',
    pain: 'ก่อน rotation/สอบ/การบ้านต้องดู dose ของยาที่เพิ่งเรียน, แต่ Plumb\'s เป็นภาษาอังกฤษ + แพง (USD 300/yr), MIMS ไม่ครอบคลุมยา vet, ChatGPT hallucinate dose, ถามอาจารย์ตอน 23:00 ก็ไม่สะดวก',
    currentWorkaround: 'Google Image search หา slide, ถาม ChatGPT แล้วก็กล้าๆ กลัวๆ, screenshot ใน LINE group',
    whatTheyUse: 'Phone-first search by drug name → Thai dose table by species → cite source ในการบ้าน/case discussion',
    cryptoValue: 'low',
    networkEffect: 'Cohort retention. Vet 86 ใช้ → แนะ Vet 87 → ทุก year ใหม่ก็ใช้. เริ่มจาก 1 cohort, compound.',
    surfaces: [{ href: '/drugs', label: 'Drug Reference' }, { href: '/search', label: 'Search' }, { href: '/drugs/class/nsaids', label: 'NSAID class' }],
  },
  {
    who: 'สัตวแพทย์ practicing (คลินิก/รพ.สัตว์ ในต่างจังหวัด)',
    whoEn: 'Practicing veterinarian, rural Thai clinic',
    pain: 'คนไข้มาตอนกลางคืน, dose ของยาที่ไม่ค่อยใช้, internet ล่ม, Plumb\'s subscription ทั้งคลินิก ใช้ 1 คน',
    currentWorkaround: 'Google ในมือถือ (ภาษาอังกฤษ + ช้า + offline เสมอ), ถามรุ่นพี่ผ่าน LINE, เปิด PDF จาก driver',
    whatTheyUse: 'PWA install บนมือถือ → offline lookup → ATC code + dose by species table → emerald canonical stamp ถ้ามี',
    cryptoValue: 'medium',
    networkEffect: 'Vet เก่าสอน vet ใหม่. คลินิก 1 ใช้, vet 2-3 คน ใช้ตาม.',
    surfaces: [{ href: '/search', label: 'Search (offline)' }, { href: '/drugs/morphine', label: 'Sample drug page' }],
  },
  {
    who: 'อาจารย์ภาควิชาเภสัชวิทยา / คลินิก (faculty contributors)',
    whoEn: 'Faculty in pharmacology or clinical departments',
    pain: 'lecture update ทุกปี, citation ต้องครบ, ต้องเลือกยาที่นิสิตจะเจอจริง, paper review need stable references',
    currentWorkaround: 'ส่วนตัว + textbook + research papers, slide ปีเก่าๆ',
    whatTheyUse: 'Contribute Thai-translated entry → ลง signature ด้วย Ed25519 → ชื่อปรากฏใน /trust → use ใน lecture, cite ใน paper, มี audit trail',
    cryptoValue: 'high',
    networkEffect: '1 faculty → 3 faculty (peer/department effect). Department reputation compounds.',
    surfaces: [{ href: '/onboarding', label: 'Onboarding walkthrough' }, { href: '/trust', label: 'Chain of trust' }, { href: '/verify', label: 'Verify in browser' }],
  },
]

const TIER_2: Persona[] = [
  {
    who: 'AI startups + LLM-grounded vet tools (telemedicine, decision support)',
    whoEn: 'AI startup building vet-facing or pet-owner-facing AI tools',
    pain: 'Hallucination liability is existential. ChatGPT/Gemini answer พ.ร.บ./dose ผิด = ลูกค้าฟ้อง. DailyMed ภาษาอังกฤษเท่านั้น. Plumb\'s ToS forbids automation. ไม่มี API ที่เปิดเสรีสำหรับ AI grounding ในวง vet ไทย',
    currentWorkaround: 'Hand-craft prompts + vague disclaimers + พยายาม fine-tune model ด้วย DailyMed text',
    whatTheyUse: '/api/drugs + /api/by-code + /api/keys → ground LLM responses → แสดง user "ที่มา: cuvetsmo.com, ลงนามโดย Dr. X" + ลิงก์ไป /verify/<slug>',
    cryptoValue: 'very-high',
    networkEffect: 'Trust layer effect. AI tool cite เรา → user เห็น "source: cuvetsmo.com" → trust AI tool → AI startup คนอื่น มาใช้ตาม → เรากลายเป็น default grounding ของ vet AI ecosystem ในไทย',
    surfaces: [{ href: '/api', label: 'Public API docs' }, { href: '/api/health', label: 'Citation health (JSON)' }],
  },
  {
    who: 'นักวิจัย CU Vet / Mahidol / Kasetsart + senior project students',
    whoEn: 'Veterinary researchers + senior project students',
    pain: 'Citation rot — URL ที่อ้างใน paper ปี 2020 ตายปี 2025. Reference rot ทำให้ paper old ไม่ replicate ได้',
    currentWorkaround: 'archive.org, screenshot, manual download PDF',
    whatTheyUse: 'cite c/<cid> URL ที่ไม่มีวันหาย (git history + content addressing). อ้างในงานวิจัย scientometric, รวมถึง Palm research synthesis paper',
    cryptoValue: 'high',
    networkEffect: 'Academic citations are permanent (papers indexed forever). 1 cite → discoverability ใน Scopus + Google Scholar.',
    surfaces: [{ href: '/c/65f15af11f2c1a6a4a23ff7b3094af2e36fef477c604bc34461641fa3fa50d5a', label: 'Sample CID page' }, { href: '/about', label: 'How it works' }],
  },
]

const TIER_3: Persona[] = [
  {
    who: 'Hospitals / Animal Hospital chains (Kasetpaibul, Thonglor, รพ.สัตว์ จุฬา)',
    whoEn: 'Hospital chains + university teaching hospitals',
    pain: 'Formulary management, drug interaction checks, compliance audits, insurance audit',
    currentWorkaround: 'Plumb\'s institutional license (USD-grade per seat), manual SOPs',
    whatTheyUse: 'Institutional API tier — EHR integration + ATC join + signatures สำหรับ compliance + audit log',
    cryptoValue: 'very-high',
    networkEffect: '1 reference hospital → standard ใน vet network. Insurance + accreditation bodies start citing.',
    surfaces: [{ href: '/api', label: 'Public API' }, { href: '/credentials', label: 'Verifiable Credentials' }],
  },
  {
    who: 'Thai FDA (อย.) + Department of Livestock Development',
    whoEn: 'Government regulators',
    pain: 'AMR surveillance สำคัญตาม One Health framework, antimicrobial use audit, prescription monitoring',
    currentWorkaround: 'Paper-based reporting + survey + ad-hoc data calls',
    whatTheyUse: 'Free open dataset + ATC + signatures for audit-grade provenance + structured JSON API',
    cryptoValue: 'very-high',
    networkEffect: 'Government adoption → mandate flow-through to all clinics → universal coverage',
    surfaces: [{ href: '/api', label: 'Public API' }, { href: '/log', label: 'Transparency log' }],
  },
  {
    who: 'Pet owners (concerned, English-literate-limited)',
    whoEn: 'Pet owners researching their pet\'s medication',
    pain: 'สัตวแพทย์สั่งยา, อยากเข้าใจมากกว่านี้, ไม่กล้าถามต่อ, Google เป็นภาษาอังกฤษ, ChatGPT กลัว hallucinate',
    currentWorkaround: 'ถามรพ.สัตว์ซ้ำ (เกรงใจ), Pantip, ถาม ChatGPT',
    whatTheyUse: 'Public reading, Thai language, drug name lookup, ATC class context',
    cryptoValue: 'low',
    networkEffect: 'Word-of-mouth, search-driven, slowly compounds.',
    surfaces: [{ href: '/drugs', label: 'Drug list' }, { href: '/search', label: 'Search' }],
  },
  {
    who: 'International expansion target — ASEAN + Thai human medical',
    whoEn: 'Future markets',
    pain: 'Same Thai vet pain pattern repeats in MY/VN/PH/ID + in Thai human medicine',
    currentWorkaround: 'N/A (we get there later)',
    whatTheyUse: 'Open-source spec replicates — fork the architecture, swap content',
    cryptoValue: 'high',
    networkEffect: 'Open source spec → other countries adopt + contribute back',
    surfaces: [{ href: '/about', label: 'How it works' }, { href: 'https://github.com/palmzamak2547/cuvetsmo-source', label: 'GitHub' }],
  },
]

export default function UseCasesPage() {
  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Use cases · who actually uses this</p>
        <h1 className="display-h1 mt-3">
          Real pain. <span className="italic text-source-800">Concrete users.</span> Not a vapor project.
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุกหน้าก่อนหน้านี้อธิบาย <i>เทคโนโลยีอะไร</i>. หน้านี้อธิบาย <i>ใครจะใช้</i> — และทำไมจึงต่างจาก
          Web3/Defi project ที่ตายเพราะไม่มี use case จริง.
        </p>
      </header>

      {/* The acid test */}
      <section className="mt-10 rounded-md border-2 border-source-400 bg-source-50/60 p-7">
        <p className="eyebrow text-source-800">The acid test</p>
        <h2 className="display-h2 mt-2 text-source-900">ถ้าตัด crypto ทิ้งหมด ยังมีประโยชน์ไหม?</h2>
        <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-source-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          <b>มี.</b> เหลือ "คู่มือยาสัตวแพทย์ภาษาไทย ที่อาจารย์ review" — และตลาดสำหรับ product นี้
          มีอยู่จริง: <b>Plumb&apos;s</b> ขาย USD 300/ปี ทั่วโลก, มีทีม editor 200+ คน, เป็น
          standard ของ vet ทั่ว US/UK/CA. คนต้องการคู่มือยา ภาษาไทย ฟรี ที่ adapt กับ context ไทย —{' '}
          <i>มีอยู่แล้ว ก่อนเราเริ่ม</i>.
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-source-800">
          Crypto ของเราเป็น <b>moat</b> (กันคู่แข่ง + ต่อต้าน AI hallucination), ไม่ใช่ <b>product</b> ที่ขาย.
          ผู้อ่านได้ value โดยไม่ต้องสนใจคณิตศาสตร์เลย. เปรียบเทียบกับ Defi — value อยู่ใน token speculation
          เท่านั้น, ตัด crypto ออก = ไม่เหลืออะไร.
        </p>
      </section>

      <hr className="rule-double" />

      {/* Tier 1 */}
      <section>
        <p className="eyebrow">Tier 1 · Day-1 users</p>
        <h2 className="display-h2 mt-2">Real pain, currently being worked around badly</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          {TIER_1.length} กลุ่มผู้ใช้ที่จะใช้เราเป็น primary tool ในระยะแรก. คนเหล่านี้
          <b> currently struggling</b> ทุกวัน, ไม่ใช่ "imagine the future".
        </p>
        <div className="mt-8 space-y-8">
          {TIER_1.map((p, i) => <PersonaCard key={i} persona={p} />)}
        </div>
      </section>

      <hr className="rule-double" />

      {/* Tier 2 */}
      <section>
        <p className="eyebrow">Tier 2 · 1–2 year horizon</p>
        <h2 className="display-h2 mt-2">Once we have signed canonical entries</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          ผู้ใช้ที่ต้องการ canonical content (faculty-signed) ก่อนจะ integrate. รอ Tier 1 ส่ง signal แล้วเข้ามา.
        </p>
        <div className="mt-8 space-y-8">
          {TIER_2.map((p, i) => <PersonaCard key={i} persona={p} />)}
        </div>
      </section>

      <hr className="rule-double" />

      {/* Tier 3 */}
      <section>
        <p className="eyebrow">Tier 3 · 3–5 year horizon</p>
        <h2 className="display-h2 mt-2">Institutional + expansion</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          กลุ่มผู้ใช้ขนาดใหญ่ที่จะ adopt เมื่อ Tier 1+2 มี traction ชัดเจน. นี่คือกลุ่มที่ทำให้ project sustainable
          ระยะยาว (revenue ผ่าน institutional API tier).
        </p>
        <div className="mt-8 space-y-8">
          {TIER_3.map((p, i) => <PersonaCard key={i} persona={p} />)}
        </div>
      </section>

      <hr className="rule-double" />

      {/* Why not Defi-failure */}
      <section>
        <p className="eyebrow">Why this is structurally different from Web3 vaporware</p>
        <h2 className="display-h2 mt-2">เรา ≠ Defi project ที่ตาย</h2>
        <div className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
          <DiffCol
            label="Defi projects ที่ตาย"
            tone="red"
            points={[
              'No use case นอก speculation (yield farming = แค่ trading)',
              'Token incentives → rug pulls, exit liquidity',
              '"Decentralization" เป็น feature looking for problem',
              'Network effects ไหล OUT (whales extract value)',
              'อยู่ได้ด้วย hype, ตัด hype = ตาย',
              'Value อยู่ใน asset speculation, ไม่ใช่ utility',
            ]}
          />
          <DiffCol
            label="source.cuvetsmo.com"
            tone="emerald"
            points={[
              'Use case คือ medical reference — pain มีอยู่ก่อนแล้ว (Plumb\'s USD 300/yr)',
              'ไม่มี token, ไม่มี financial product, ไม่มี speculation',
              'Crypto เป็น MOAT (trust) ไม่ใช่ PRODUCT ที่ขาย',
              'Network effects ไหล IN (entry สะสม, faculty มาเพิ่ม, AI grounding compound)',
              'ตัด hype = ยังมีคู่มือยา ภาษาไทย ฟรี + signed — still useful',
              'Value อยู่ใน CONTENT, ไม่ใช่ใน token',
            ]}
          />
        </div>
      </section>

      <hr className="rule-double" />

      {/* What to test first */}
      <section>
        <p className="eyebrow">Cheap signals · validate before scaling</p>
        <h2 className="display-h2 mt-2">ก่อน build ต่อ — test 3 อย่างนี้</h2>
        <ol className="mt-6 space-y-5">
          <TestCard
            n={1}
            who="5 คนใน Vet 86 cohort"
            test="เปิด /drugs/meloxicam + /search ให้ดู, ถาม: ถ้านี่ภาษาไทยเต็มและ canonical แล้ว จะใช้ก่อนสอบ?"
            signal="Bookmark intent · ถ้าตอบ yes + ตั้งเป็น bookmark = real demand from Tier 1A"
          />
          <TestCard
            n={2}
            who="อาจารย์เภสัชวิทยา 1 คน"
            test="ส่ง /onboarding link + ARCHITECTURE.md, ถาม: จะลองสมัคร review meloxicam หรือ carprofen ดูไหม?"
            signal="Conversion · ถ้าเซ็น entry แรกได้ภายใน 30 วัน = Tier 1C unlocked"
          />
          <TestCard
            n={3}
            who="คนที่ทำ AI startup ในวง vet (ถ้ามีรู้จัก)"
            test="ส่ง /api docs + /verify ตัวอย่าง, ถาม: ถ้า dataset นี้สมบูรณ์แล้ว 1000 entries, จะ integrate ไหม?"
            signal="API demand · ถ้า yes อย่างชัดเจน = Tier 2 wedge confirmed"
          />
        </ol>
        <p className="mt-6 max-w-2xl text-sm text-ink-700">
          ถ้า 1 ใน 3 ตอบ yes อย่างชัดเจน = use case real, build ต่อ. ถ้าทั้ง 3 ลังเล/no = re-think wedge ก่อนใส่
          effort เพิ่ม.
        </p>
      </section>

      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">The honest framing</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          ไม่มี platform ใดที่ <i>guarantee</i> network effect. แต่ source.cuvetsmo.com มี structural advantages
          เหนือกว่า Web3 vapor: pain real ที่ Plumb\'s + Mahidol + AI hallucination data confirm, crypto เป็น moat
          ไม่ใช่ product, value compounds in content not in token. <b>นี่ไม่ใช่ &ldquo;trust me bro&rdquo;</b> — ทุกอย่างใน{' '}
          <Link href="/about" className="text-source-800 underline-offset-2 hover:underline">/about</Link>{' '}
          มี citation real ที่ตรวจสอบได้.
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function PersonaCard({ persona }: { persona: Persona }) {
  const cryptoToneMap = {
    'low':       { label: 'Low', color: 'border-paper-400 bg-paper-100 text-ink-700' },
    'medium':    { label: 'Medium', color: 'border-amber-300 bg-amber-50 text-amber-900' },
    'high':      { label: 'High', color: 'border-source-400 bg-source-50 text-source-900' },
    'very-high': { label: 'Very high', color: 'border-emerald-400 bg-emerald-50 text-emerald-900' },
  } as const
  const tone = cryptoToneMap[persona.cryptoValue]
  return (
    <article className="rounded-md border border-paper-300 bg-paper-50 p-6">
      <header className="border-b border-paper-200 pb-4">
        <h3 className="text-[18px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          {persona.who}
        </h3>
        <p className="mt-1 text-[12px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          {persona.whoEn}
        </p>
      </header>

      <dl className="mt-4 grid gap-x-6 gap-y-4 text-[14px] leading-relaxed sm:grid-cols-[140px_1fr]">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Pain ตอนนี้</dt>
        <dd className="text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{persona.pain}</dd>

        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Workaround ปัจจุบัน</dt>
        <dd className="text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{persona.currentWorkaround}</dd>

        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">ใช้เราอย่างไร</dt>
        <dd className="text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{persona.whatTheyUse}</dd>

        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Crypto value to them</dt>
        <dd>
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tone.color}`}>
            {tone.label}
          </span>
        </dd>

        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Network effect</dt>
        <dd className="text-ink-700" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{persona.networkEffect}</dd>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {persona.surfaces.map(s => (
          s.href.startsWith('http') ? (
            <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-paper-300 bg-paper-50 px-3 py-1 text-[12px] text-ink-700 hover:border-source-500 hover:text-source-800">
              {s.label} ↗
            </a>
          ) : (
            <Link key={s.href} href={s.href} className="inline-flex rounded-full border border-paper-300 bg-paper-50 px-3 py-1 text-[12px] text-ink-700 hover:border-source-500 hover:text-source-800">
              {s.label} →
            </Link>
          )
        ))}
      </div>
    </article>
  )
}

function DiffCol({ label, tone, points }: { label: string; tone: 'red' | 'emerald'; points: string[] }) {
  const colors = {
    red:     { border: 'border-red-400', text: 'text-red-900', dot: 'bg-red-500' },
    emerald: { border: 'border-emerald-400', text: 'text-emerald-900', dot: 'bg-emerald-500' },
  } as const
  const c = colors[tone]
  return (
    <div className={`border-l-4 ${c.border} pl-5`}>
      <p className={`eyebrow ${tone === 'red' ? 'text-red-800' : 'text-emerald-800'}`}>{label}</p>
      <ul className="mt-3 space-y-2.5">
        {points.map((pt, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} aria-hidden />
            <span className={`flex-1 text-[14px] leading-relaxed ${c.text}`} style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
              {pt}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TestCard({ n, who, test, signal }: { n: number; who: string; test: string; signal: string }) {
  return (
    <li className="grid gap-4 md:grid-cols-[60px_1fr]">
      <span
        className="grid h-12 w-12 place-items-center rounded-full border-2 border-source-400 bg-paper-50 text-base font-bold text-source-800 tabular"
        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
      >
        {n}
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Target</p>
        <p className="mt-1 text-[15px] font-medium text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{who}</p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">The test</p>
        <p className="mt-1 text-[14px] text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{test}</p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-source-800">Signal we want to see</p>
        <p className="mt-1 text-[14px] italic text-source-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{signal}</p>
      </div>
    </li>
  )
}
