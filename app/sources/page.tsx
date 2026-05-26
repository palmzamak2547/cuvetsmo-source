export const metadata = {
  title: 'Sources & curation methodology',
  description: 'แหล่งข้อมูลและกระบวนการ curation ของ source.cuvetsmo.com — ทุก entry mirrored จาก authoritative source แล้วผ่านการตรวจสอบของอาจารย์',
}

const SOURCES = [
  {
    id: 'dailymed',
    name: 'NLM DailyMed',
    body: 'FDA-approved Structured Product Labeling สำหรับยาที่จำหน่ายใน U.S. ทุกตัว — รวมถึงยาสัตวแพทย์',
    license: 'U.S. Government work — public domain. ใส่ attribution.',
    url: 'https://dailymed.nlm.nih.gov/',
    apiUrl: 'https://dailymed.nlm.nih.gov/dailymed/services/v2/',
    coverage: 'Indications, contraindications, side effects, dose ranges, drug interactions, pregnancy categories',
  },
  {
    id: 'who-eml',
    name: 'WHO Model List of Essential Medicines',
    body: 'รายการยาจำเป็นสำหรับระบบสาธารณสุขโลกที่ WHO ทบทวนทุก 2 ปี',
    license: 'CC BY-NC-SA 3.0 IGO',
    url: 'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2021.02',
    coverage: 'รายชื่อยาจำเป็น 460+ ตัว · therapeutic class · WHO recommendations',
  },
  {
    id: 'thai-fda',
    name: 'Thai FDA (สำนักงานคณะกรรมการอาหารและยา / อย.)',
    body: 'ฐานข้อมูลทะเบียนยาที่ขึ้นทะเบียนกับ อย. ของประเทศไทย — บอกว่ายาตัวไหนมีจำหน่ายใน TH + รูปแบบ + ผู้ผลิต',
    license: 'Open Thai government data ตาม พรบ.ข้อมูลข่าวสารของราชการ พ.ศ. 2540',
    url: 'https://www.fda.moph.go.th/',
    coverage: 'การจำหน่ายในไทย, manufacturer, รูปแบบ, dosage form',
  },
  {
    id: 'pubchem',
    name: 'PubChem (NIH/NLM)',
    body: 'Chemistry database ของ NIH — molecular structure, identifiers, pharmacology summary',
    license: 'NIH open data — public domain',
    url: 'https://pubchem.ncbi.nlm.nih.gov/',
    coverage: 'Molecular structure, CID, InChI, SMILES, pharmacology summaries',
  },
  {
    id: 'atc',
    name: 'ATC Classification (WHO)',
    body: 'Anatomical Therapeutic Chemical classification system — WHO standard taxonomy ของ active substances',
    license: 'WHO publication, free for use with attribution',
    url: 'https://www.whocc.no/atc_ddd_index/',
    coverage: 'Classification hierarchy, defined daily dose (DDD)',
  },
  {
    id: 'wsava',
    name: 'WSAVA Guidelines',
    body: 'World Small Animal Veterinary Association — guidelines สำหรับ vaccination, nutrition, pain management',
    license: 'Free for educational use with attribution',
    url: 'https://wsava.org/global-guidelines/',
    coverage: 'Vaccination, pain management, dental, nutrition guidelines',
  },
]

export default function Sources() {
  return (
    <article className="prose-academic max-w-3xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-source-700">
          Curation methodology
        </p>
        <h1 className="mt-2 text-3xl font-bold text-paper-900">Sources & how we curate</h1>
        <p className="mt-2 text-paper-700">
          เราไม่สร้างข้อมูลทางการแพทย์ขึ้นเอง — เรา <b>mirror</b> จากแหล่งอ้างอิงที่เปิดสาธารณะตามใบอนุญาตของแต่ละแหล่ง
          แล้ว <b>adapt เป็นภาษาไทย</b> และ <b>อาจารย์เซ็นต์รับ</b> ทุก entry
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-2xl font-bold text-paper-900">Authoritative sources</h2>
        <ul className="mt-4 space-y-5">
          {SOURCES.map(s => (
            <li key={s.id} className="rounded-xl border border-paper-200 bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-paper-900">{s.name}</h3>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-source-700 hover:underline">
                  {s.url.replace('https://', '')} →
                </a>
              </div>
              <p className="mt-2 text-sm text-paper-800">{s.body}</p>
              <dl className="mt-3 grid gap-2 text-xs text-paper-700 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-paper-900">Coverage</dt>
                  <dd>{s.coverage}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-paper-900">License</dt>
                  <dd>{s.license}</dd>
                </div>
              </dl>
              {s.apiUrl && (
                <p className="mt-2 text-[11px] text-paper-700">
                  API: <a href={s.apiUrl} target="_blank" rel="noreferrer" className="text-source-700 hover:underline">{s.apiUrl}</a>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-paper-900">Faculty review queue</h2>
        <p className="mt-2 text-paper-800">
          ทุก mirror entry รอการตรวจสอบของอาจารย์ผู้เชี่ยวชาญก่อน publish เป็น canonical · reviewer
          จะ verify Thai translation + ปรับเนื้อหาให้สอดคล้องกับ context ของประเทศไทย · ลงชื่อ + ตำแหน่ง + วันที่
        </p>
        <p className="mt-3 text-paper-800">
          ภาควิชาที่ตรวจ entry กลุ่มยา:
        </p>
        <ul className="mt-2 list-disc pl-5 text-paper-800">
          <li><b>3104 ภาควิชาเภสัชวิทยา</b> — pharmacology, toxicology, drug-drug interactions</li>
          <li><b>3107 ภาควิชาอายุรศาสตร์</b> — clinical use, dosing in companion animals</li>
          <li><b>3109 ภาควิชาสัตวแพทยสาธารณสุข</b> — food safety, withdrawal period, public health</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-paper-900">Iron Rule 0 — no fabrication</h2>
        <p className="mt-2 text-paper-800">
          กฎหลักของระบบ: ห้าม publish ข้อมูลที่ไม่มี citation chain หรือ faculty signoff
        </p>
        <ul className="mt-2 list-disc pl-5 text-paper-800">
          <li>Entry ที่ไม่มี <code>reviewedBy</code> = <b>amber pending banner</b>, ห้ามใช้ทางคลินิก</li>
          <li>ทุก dose, indication, contraindication ต้องโยงกลับไป citation จริง</li>
          <li>ทุก citation ต้องมี URL + license + retrieval date ตรวจสอบได้</li>
          <li>AI ใช้เป็น <b>tool</b> ภายในระบบ (translation drafting, summarization) แต่ไม่ใช่ <b>authority</b> ของเนื้อหา</li>
        </ul>
      </section>
    </article>
  )
}
