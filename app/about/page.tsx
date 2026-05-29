// /about — plain-language technology explainer + "are we first?" research argument.
//
// Designed to be readable by non-technical users (vet students, faculty,
// curious clinicians). Uses analogies (wax seal, fingerprint, guest book)
// instead of jargon. Every novelty claim cites a real source.

import Link from 'next/link'

export const metadata = {
  title: 'How it works · Why we are the first',
  description: 'Plain-language explanation of the 8 cryptographic + editorial primitives that power source.cuvetsmo.com — and research-backed evidence that this composition has not been built before.',
}

export default function AboutPage() {
  return (
    <article className="max-w-3xl">
      {/* ───── Hero ───── */}
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">How it works · Why this is unprecedented</p>
        <h1 className="display-h1 mt-3">
          The technology behind <span className="italic">source.cuvetsmo.com</span> — explained for everyone.
        </h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          เว็บไซต์นี้ผนวกเทคโนโลยี 8 อย่างเข้าด้วยกันในแบบที่ — ตามการ research ของเรา — ยังไม่มีใครทำมาก่อน
          สำหรับวงการความรู้ทางการแพทย์. ด้านล่างคือคำอธิบายแบบไม่มี jargon + งานวิจัยที่ยืนยันช่องว่าง.
        </p>
      </header>

      {/* ───── Section 1: The problem ───── */}
      <section className="mt-12">
        <p className="eyebrow">The crisis we built this for</p>
        <h2 className="display-h2 mt-2">AI สร้างข้อความได้เป็นล้าน · แต่ไม่มีใครรู้ว่าอันไหนถูก</h2>
        <div className="prose-academic mt-6 space-y-4 text-ink-800">
          <p>
            ในปี 2025–2026 งานวิจัยพบว่า <b>ChatGPT-3.5</b> hallucinate citation 39.6–55%,
            <b> GPT-4</b> ยังอยู่ที่ 18–28.6%, และแม้แต่ model ใหม่ล่าสุดอย่าง <b>GPT-4o</b> + <b>Claude 3.7</b> ก็ยังมี hallucination rate
            15–20% สำหรับหัวข้อทั่วไป — และพุ่งขึ้นเป็น <b>35–55%</b> ในหัวข้อเฉพาะทาง
            <sup><Link href="#ref-1" className="cite-token">[1]</Link></sup>.
          </p>
          <p>
            ในการสำรวจ <b>90% ของคลินิเชียน</b> เคยเจอ medical hallucination จาก AI, และ <b>85%</b> เชื่อว่า hallucination
            สามารถ <i>ทำให้ผู้ป่วยเสียหาย</i> ได้
            <sup><Link href="#ref-2" className="cite-token">[2]</Link></sup>. ในเดือนมกราคม 2026 มีรายงานว่า paper ที่ NeurIPS 2025
            มี <b>100+ citation ที่ AI กุขึ้นมา</b> ผ่าน peer review ของวงการ ML ระดับ elite
            <sup><Link href="#ref-3" className="cite-token">[3]</Link></sup>.
          </p>
          <p>
            <b>นี่คือ trust crisis.</b> AI ทำให้การ <i>generate</i> ข้อมูลถูกในวินาทีเดียว — แต่ทำให้การ <i>verify</i>{' '}
            ยากขึ้นมาก. คำตอบไม่ใช่ "หยุดใช้ AI" (ไม่ทันแล้ว). คำตอบคือสร้าง <b>ชั้นข้อมูลที่ verify ได้</b>{' '}
            ที่ AI <i>อ้างอิงเรา</i> ได้ และคนอ่าน <i>ตรวจในเครื่องตัวเองได้</i>.
          </p>
        </div>
      </section>

      <hr className="rule-double" />

      {/* ───── Section 2: The 8 primitives, explained simply ───── */}
      <section>
        <p className="eyebrow">The 8 primitives, in plain language</p>
        <h2 className="display-h2 mt-2">8 เทคโนโลยีที่ผนวกกันเป็นครั้งแรก</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          แต่ละอันมีอยู่แล้วในวงการอื่น. ความใหม่คือการรวมทั้ง 8 เข้าด้วยกัน{' '}
          <b>ในระบบเดียว สำหรับความรู้ทางการแพทย์</b>.
        </p>

        <div className="mt-8 space-y-10">
          <Primitive
            n={1}
            title="Cryptographic provenance · ตราประทับดิจิทัล"
            analogy="เหมือนตราประทับขี้ผึ้งของพระมหากษัตริย์โบราณ"
            body={
              <>
                <p>
                  ทุก entry ที่อาจารย์ตรวจรับแล้ว จะถูกอาจารย์เซ็นด้วยกุญแจดิจิทัลของตัวเอง (<b>Ed25519</b>). ผลลัพธ์เป็นลายเซ็น
                  64-byte ที่จะ <b>ใช้ verify ได้ตลอดไป</b> — ใครก็เปิด browser แล้วใช้คณิตศาสตร์ตรวจสอบได้ในเครื่องตัวเอง.
                </p>
                <p>
                  ถ้าใครพยายามแก้ entry แม้แต่ตัวอักษรเดียวหลังจากเซ็น ลายเซ็น <b>break ทันที</b>. มันทำงานเหมือนตราขี้ผึ้ง
                  ของพระมหากษัตริย์โบราณ — แต่ใช้คณิตศาสตร์แทนขี้ผึ้ง.
                </p>
              </>
            }
            seenBefore="Ed25519 ถูกใช้ใน blockchain เพื่อตรวจสอบ pharmaceutical supply chain (กล่องยา, ไม่ใช่ความรู้)"
            seenBeforeCite={4}
          />

          <Primitive
            n={2}
            title="Content-addressed citations · ลายนิ้วมือของเนื้อหา"
            analogy="เหมือนเลข ISBN ของหนังสือ — แต่คำนวณจากตัวเนื้อหาเอง"
            body={
              <>
                <p>
                  ทุก citation มี <b>CID</b> (Content Identifier) — รหัส 64 ตัวอักษรที่คำนวณจาก SHA-256 ของเนื้อหา.
                  เนื้อหาเปลี่ยน 1 byte → CID เปลี่ยนทั้งก้อน.
                </p>
                <p>
                  ผลคือ URL เปลี่ยน, เว็บแหล่งอ้างอิงล่ม, เนื้อหาถูกแก้หลัง publish — <b>hash ของเนื้อหาไม่เคยโกหก</b>.{' '}
                  คุณ verify ในเครื่องตัวเองได้ว่าเนื้อหาที่คุณอ่านอยู่ตรงกับสิ่งที่ผู้เซ็นเซ็นจริงๆ.
                </p>
              </>
            }
            seenBefore="IPFS, Bitcoin, และ Git ใช้ content addressing สำหรับ files. ไม่มี platform medical reference ที่ทำ"
          />

          <Primitive
            n={3}
            title="AI in loop, never authority · AI ช่วยร่าง แต่มนุษย์รับผิดชอบ"
            analogy="AI เป็นเด็กฝึกงาน อาจารย์ยังคงเซ็นชื่อกำกับเอง"
            body={
              <>
                <p>
                  AI <i>อาจ</i> ช่วยร่าง Thai translation จาก DailyMed, สรุปเนื้อหายาว, แนะนำ ATC code.
                  แต่ AI <b>ห้าม</b> เป็นแหล่งอ้างอิงสุดท้าย. ทุก canonical claim ต้องมีมนุษย์ผู้รับผิดชอบลงชื่อ + เซ็นด้วยกุญแจตัวเอง.
                </p>
                <p>
                  ระบบบังคับด้วยโค้ด: ถ้า <code>drafting.aiAssisted: true</code> แต่ <code>humanEditsRatio &lt; 0.1</code>{' '}
                  (= มนุษย์ไม่ได้แก้ AI draft เลย) → CI lint <b>refuse merge</b>. กฎเขียนใน CONTRIBUTING.md, บังคับใน scripts/verify.mjs.
                </p>
              </>
            }
            seenBefore="งานวิจัย AI-citation-verification เช่น INRA.AI มี multi-layer validation แต่เน้น 'ตรวจ AI ที่ generated' — ของเราเน้น 'AI ห้ามเป็น authority ตั้งแต่ต้น'"
            seenBeforeCite={5}
          />

          <Primitive
            n={4}
            title="ZK-ready Verifiable Credentials · ใบรับรองที่ตรวจสอบได้ทุกที่"
            analogy="เหมือนใบ ส.พ. ของอาจารย์ แต่มีลายเซ็นดิจิทัล ตรวจสอบเองได้"
            body={
              <>
                <p>
                  เราใช้ <b>W3C Verifiable Credentials</b> (มาตรฐาน W3C VC Data Model 2.0, published พฤษภาคม 2025{' '}
                  <sup><Link href="#ref-6" className="cite-token">[6]</Link></sup>) สำหรับสายโซ่อำนาจของ editorial:
                  คณะกรรมการ → อาจารย์ → entries.
                </p>
                <p>
                  Phase 0 ใช้ plain signed credential (เปิดเผยข้อมูล). Phase 5+ จะอัปเกรดเป็น <b>BBS+ signatures</b>
                  (Zero-Knowledge selective disclosure) — อาจารย์สามารถพิสูจน์ "ผมมี ส.พ. ที่ valid" โดย{' '}
                  <i>ไม่ต้องเปิดเผยเลขทะเบียน</i>.
                </p>
              </>
            }
            seenBefore="W3C VC ถูกใช้ในวงการ medical สำหรับ practitioner licensing + CME completion — เราใช้สำหรับ editorial content authority chain (ต่างกัน)"
            seenBeforeCite={6}
          />

          <Primitive
            n={5}
            title="Medical ontology backbone · เชื่อมกับ vocabulary มาตรฐานของโลก"
            analogy="เหมือนทุก entry มี barcode สากลที่ระบบใดก็อ่านได้"
            body={
              <>
                <p>
                  ทุก drug ในเรามี cross-reference กับ <b>WHO ATC</b> (drug classification), <b>RxNorm</b> (US NLM
                  drug identifier), <b>ICD-11</b> (conditions), <b>LOINC</b> (lab tests). ในอนาคต: SNOMED CT.
                </p>
                <p>
                  ผลคือ hospital EHR, research dataset, AI agent <b>join</b> ข้อมูลกับเราได้ผ่าน ID มาตรฐาน — ไม่ต้องตรงตามชื่อ
                  string ที่อาจสะกดต่างกัน. การ "Meloxicam" ของเราตรงกับ "Meloxicam" ใน Mayo Clinic, ใน DailyMed, ใน Plumb's,
                  ใน WHO EML ทั้งหมด — เพราะทุกฝั่งใช้ ATC M01AC06 + RxNorm CUI 6915 เหมือนกัน.
                </p>
              </>
            }
            seenBefore="ATC + RxNorm ถูกใช้แพร่หลายใน EHR + clinical research — ของเราเป็นที่แรกที่ผูกกับ Ed25519-signed Thai veterinary content"
            seenBeforeCite={7}
          />

          <Primitive
            n={6}
            title="Inverted API economics · อ่านฟรีตลอดไป, เขียน paid"
            analogy="เหมือน Wikipedia แต่ปล่อยให้ hospital ใช้ get API ฟรี"
            body={
              <>
                <p>
                  Public read endpoint (<code>/api/drugs</code>, <code>/api/by-code</code>, <code>/api/keys/&lt;kid&gt;</code>,{' '}
                  <code>/api/log</code>) <b>ฟรีตลอดไป</b>, CORS-enabled, cached at edge. AI agent, hospital EHR,
                  นักศึกษาวิจัยทั่วโลกใช้ได้โดยไม่ต้องสมัคร.
                </p>
                <p>
                  Phase 1+: <b>institutional write</b> (POST contribute back, bulk dataset export, DOI minting) จะ paid —
                  รายได้กระจายกลับสู่ภาควิชาที่ contribute reviewed entries มากที่สุด. เป้าหมายคือ <i>aligned incentives</i>:
                  อาจารย์ตรวจมากขึ้น = ภาควิชาได้ revenue share มากขึ้น = trust signal เพิ่มขึ้น = compound.
                </p>
              </>
            }
            seenBefore="Plumb's คิด USD 300/ปี + กลายเป็นสมบัติเอกชน. UpToDate, MIMS เหมือนกัน. ไม่มี public-read-free + faculty-revenue-share สำหรับ medical reference"
            seenBeforeCite={8}
          />

          <Primitive
            n={7}
            title="Git-native content + PR review · ความรู้ที่มี audit trail"
            analogy="เหมือน Wikipedia history แต่ทุก edit cryptographic-signed"
            body={
              <>
                <p>
                  ทุก drug entry คือไฟล์ JSON ใน <code>content/drugs/&lt;slug&gt;.json</code>. ทุกการเปลี่ยนแปลงผ่าน Pull Request.
                  Git history คือ audit trail ที่ลบไม่ได้.
                </p>
                <p>
                  GitHub Action <code>.github/workflows/verify-content.yml</code> รัน lint บนทุก PR — ตรวจ schema,
                  citation chain, ontology codes, drafting policy. PR ที่ละเมิด Iron Rule 0 <b>ไม่ผ่าน CI</b>.
                </p>
              </>
            }
            seenBefore="GitHub-based content workflows มีในวงการ OSS, documentation. ไม่มี clinical drug reference ที่ใช้ pattern นี้ + cryptographic signing บน entries"
          />

          <Primitive
            n={8}
            title="Offline PWA + browser-side verify · ทำงานในคลินิกที่อินเทอร์เน็ตล่ม"
            analogy="เหมือนหนังสือคู่มือยาที่เซ็นรับรองแล้ว — เปิดเมื่อไหร่ที่ไหนก็อ่านได้"
            body={
              <>
                <p>
                  Service worker cache ทุก canonical content. หลังเปิดครั้งแรก — <b>ตัดเน็ต, เปิดอีกครั้ง, ค้นได้, verify ได้</b>.
                  คลินิกที่อินเทอร์เน็ตล่มหรือมีคำถามคา 03:00 น. — ยา + ลายเซ็น + verify ทำงานหมด.
                </p>
                <p>
                  Phase 5 stretch: <b>WebGPU LLM</b> (Phi-3 mini / Llama 3.2 1B) ใน browser — opt-in 1-2 GB model download
                  สำหรับ Thai translation suggestion. <i>ไม่ส่ง query ไป server ใดเลย</i>.
                </p>
              </>
            }
            seenBefore="Service workers, PWA, WebGPU LLM ทั้งหมดมีในวงการ web. ไม่มี medical reference ที่ผนวกกับ cryptographic verification ในเครื่อง"
          />
        </div>
      </section>

      <hr className="rule-double" />

      {/* ───── Section 3: Are we really first? ───── */}
      <section>
        <p className="eyebrow">The honest novelty argument</p>
        <h2 className="display-h2 mt-2">เราเป็นที่แรกจริงไหม?</h2>
        <p className="mt-3 max-w-2xl text-ink-700">
          คำตอบสั้น: <b>แต่ละ primitive ไม่ใช่ของใหม่</b>. ส่วนที่ใหม่คือการรวม <b>ทั้ง 8</b> ไว้ใน editorial pipeline เดียว
          สำหรับ <b>medical knowledge content</b> ในภาษาไทย. ด้านล่างคือสิ่งที่เรา research แล้วยืนยันได้.
        </p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-800">
          <Finding label="Ed25519 signing in pharma">
            <p>
              งานวิจัย 2025 ใช้ EdDSA (Ed25519) ใน blockchain pharmaceutical <b>supply chain anti-counterfeiting</b>
              <sup><Link href="#ref-4" className="cite-token">[4]</Link></sup>. กล่องยา, sequence number, QR codes — ไม่ใช่{' '}
              <i>เนื้อหา drug knowledge</i>. ของเรา = ลายเซ็นบน knowledge content (dose, indication, contraindication).
            </p>
          </Finding>

          <Finding label="Blockchain biomedical notarization">
            <p>
              มี research demo บน Ethereum ที่ notarize <b>CARRE risk factor repository + PubMed MEDLINE</b> hashes
              <sup><Link href="#ref-9" className="cite-token">[9]</Link></sup>. แต่เป็น <i>research prototype</i> ไม่ใช่{' '}
              production drug reference, ไม่มี faculty review workflow, ไม่มี Thai language, ไม่มี Web Crypto verify.
            </p>
          </Finding>

          <Finding label="W3C Verifiable Credentials in medicine">
            <p>
              W3C VC 2.0 (พฤษภาคม 2025) <sup><Link href="#ref-6" className="cite-token">[6]</Link></sup> ถูกใช้สำหรับ
              <b> CME completion + medical practitioner licensing</b> (ใครคือ ผู้เชี่ยวชาญตาม council). ไม่ใช่สำหรับ{' '}
              <i>editorial authority chain</i> บน knowledge content. ของเราใช้ VC เพื่อพิสูจน์ &quot;ใครมีสิทธิ์ลงนามรับรอง entry&quot;.
            </p>
          </Finding>

          <Finding label="Sigstore expansion">
            <p>
              Sigstore (signed transparency log) ได้ขยายไปสู่ Homebrew (พฤษภาคม 2024), PyPI (พฤศจิกายน 2024),
              Maven Central (มกราคม 2025), NVIDIA NGC AI/ML models (กรกฎาคม 2025)
              <sup><Link href="#ref-10" className="cite-token">[10]</Link></sup>. ทุกอย่างเป็น{' '}
              <i>software / model packages</i>. ไม่มี <i>medical editorial content</i>. ของเราใช้ pattern เดียวกันแต่
              apply กับวงการใหม่.
            </p>
          </Finding>

          <Finding label="AI citation hallucination tools">
            <p>
              INRA.AI <sup><Link href="#ref-5" className="cite-token">[5]</Link></sup> + งานวิจัยอื่นๆ ปี 2025–2026{' '}
              <sup><Link href="#ref-1" className="cite-token">[1]</Link></sup>: ทั้งหมดเป็น{' '}
              <i>detection + validation tooling</i> ที่ตรวจว่า AI generated text หรือไม่. ของเราเป็น{' '}
              <i>การสร้างเนื้อหา authoritative ที่ AI ต้องอ้างอิงเรา</i> ไม่ใช่กลับกัน.
            </p>
          </Finding>

          <Finding label="Veterinary drug reference market">
            <p>
              Plumb&apos;s <sup><Link href="#ref-8" className="cite-token">[8]</Link></sup>: ตรวจโดยทีม 200+ vets + pharmacists,
              เป็นมาตรฐานทอง — แต่ <b>ภาษาอังกฤษ, paid USD 300/ปี, ไม่มี cryptographic signature, ไม่มี content-addressing,
              ไม่มี VC, ไม่ open source</b>. VetGeni AI ใช้ Wiley references + Graph RAG แต่เป็น AI search interface, ไม่ใช่
              cryptographically-signed knowledge base.
            </p>
          </Finding>

          <Finding label="Thai veterinary digital infrastructure">
            <p>
              ในประเทศไทยมี Thai FDA (อย.) drug registration database + การวิจัย antimicrobial surveillance ที่
              จุฬาฯ + Mahidol + Thai FDA <sup><Link href="#ref-11" className="cite-token">[11]</Link></sup>{' '}
              — แต่เป็น <i>regulatory / surveillance</i> infrastructure, ไม่ใช่ <i>open-access cryptographically-signed
              veterinary drug knowledge ในภาษาไทย</i>. ของเราเป็นช่องว่างที่ยังไม่มีใครเติม.
            </p>
          </Finding>
        </div>

        {/* The unbroken claim */}
        <aside className="mt-10 rounded-md border-2 border-source-400 bg-source-50/70 p-7">
          <p className="eyebrow text-source-800">The claim we make</p>
          <p className="mt-3 text-[17px] leading-relaxed text-source-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            ในการ research ที่เรา cover ปี 2023–2026, เราไม่พบ platform หรือ research paper อื่นที่ผสมผสาน{' '}
            <b>ทั้ง 8 primitives นี้</b> เข้าใน editorial pipeline เดียว สำหรับ <b>medical / veterinary
            knowledge content</b>. ที่ใกล้ที่สุด — Sigstore สำหรับ software, blockchain สำหรับ drug supply chain,
            W3C VC สำหรับ practitioner licensing — ล้วนอยู่ใน adjacent domain. การ <i>composition</i> ที่
            source.cuvetsmo.com ทำ, จากที่หลักฐานบ่งชี้, <b>ยังไม่มีใครเผยแพร่</b>.
          </p>
          <p className="mt-4 text-sm text-source-800">
            ถ้าพบ prior art ที่ทำเหมือนเรา — แจ้งใน{' '}
            <a href="https://github.com/palmzamak2547/cuvetsmo-source/issues" target="_blank" rel="noreferrer" className="underline">GitHub issue</a>{' '}
            label <code>prior-art</code>. เราจะ update หน้านี้ทันที. การอ้างที่ผิดเป็นการละเมิด Iron Rule 0 ของเราเอง.
          </p>
        </aside>
      </section>

      <hr className="rule-double" />

      {/* ───── Section 4: What we are NOT ───── */}
      <section>
        <p className="eyebrow">Boundaries</p>
        <h2 className="display-h2 mt-2">เราไม่ใช่อะไรบ้าง</h2>
        <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink-800">
          <Boundary>
            <b>เราไม่ใช่ AI chatbot.</b> เราคือ <i>static knowledge layer</i> ที่ AI products
            สามารถ <i>อ้างอิงเรา</i> ได้ในอนาคต.
          </Boundary>
          <Boundary>
            <b>เราไม่ใช่ blockchain project.</b> ไม่มี token, ไม่มี mining, ไม่มี smart contract. Ed25519 signatures + Git history + content addressing — เครื่องมือธรรมดาที่ standardized + boring + works.
          </Boundary>
          <Boundary>
            <b>เราไม่ใช่การแทนที่อาจารย์.</b> ทุก canonical content ต้องมีอาจารย์ผู้เชี่ยวชาญลงชื่อรับรอง. โดยจะดูจาก <code>reviewedBy !== null</code> + <code>signatures.length &gt; 0</code>.
          </Boundary>
          <Boundary>
            <b>เราไม่ใช่ clinical advice.</b> Entry ที่ <i>pending</i> ห้ามใช้อ้างอิงทางคลินิก. แม้แต่ canonical entries — ยังเป็น
            <i>knowledge reference</i>, decision อยู่ที่สัตวแพทย์ผู้ตรวจรักษา.
          </Boundary>
          <Boundary>
            <b>เราไม่ใช่ paid product สำหรับ readers.</b> Public read ฟรีตลอดไป.
            Institutional API tier (Phase 1+) จะ paid — แต่ free public read จะไม่ถูกตัด.
          </Boundary>
          <Boundary>
            <b>เราไม่ใช่ Plumb&apos;s replacement.</b> Plumb&apos;s ครอบคลุมยาเป็นพันตัว, มีทีม editors 200+ คน, รับรองโดย AAVPT.
            เรา start ที่ 39 entries + Thai language + cryptographic verification — เราเป็น <i>complement</i> ในตลาด Thai vet,
            ไม่ใช่ replacement สำหรับตลาด US.
          </Boundary>
        </ul>
      </section>

      <hr className="rule-double" />

      {/* ───── Section 5: References ───── */}
      <section>
        <p className="eyebrow">References · งานวิจัยที่อ้างอิง</p>
        <h2 className="display-h2 mt-2">Read more</h2>
        <ol className="mt-6 space-y-4 text-[13px] leading-relaxed">
          <Ref n={1} id="ref-1">
            INRA.AI Blog (2025). <i>How to Prevent AI Citation Hallucinations in 2025: 6 Steps</i>.
            Hallucination rates: GPT-4o + Claude 3.7 15–20% (35–55% niche).{' '}
            <a href="https://www.inra.ai/blog/citation-accuracy" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">inra.ai/blog/citation-accuracy ↗</a>
          </Ref>
          <Ref n={2} id="ref-2">
            <i>AI Hallucination in Medicine: Real Examples, Real Risks</i>. Survey: 90% of clinicians have encountered medical hallucinations; 85% believe they can harm patients.{' '}
            <a href="https://www.iatrox.com/blog/ai-hallucination-medicine-real-examples-risks-how-to-protect-yourself-2026" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">iatrox.com/blog ↗</a>
          </Ref>
          <Ref n={3} id="ref-3">
            Fortune (Jan 2026). <i>NeurIPS research papers contained 100+ AI-hallucinated citations</i>.{' '}
            <a href="https://fortune.com/2026/01/21/neurips-ai-conferences-research-papers-hallucinations/" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">fortune.com ↗</a>
          </Ref>
          <Ref n={4} id="ref-4">
            ScienceDirect (2025). <i>A blockchain-based framework for drug security: Leveraging EdDSA to prevent counterfeiting</i>.
            Pharmaceutical supply chain — not knowledge content.{' '}
            <a href="https://www.sciencedirect.com/science/article/pii/S2590005625002310" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">sciencedirect.com ↗</a>
          </Ref>
          <Ref n={5} id="ref-5">
            INRA.AI 6-layer validation system: AI hallucination detection — not authoritative content production.{' '}
            <a href="https://www.inra.ai/blog/citation-accuracy" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">inra.ai ↗</a>
          </Ref>
          <Ref n={6} id="ref-6">
            W3C (May 2025). <i>Verifiable Credentials 2.0 Recommendation</i>. Used in CME / professional licensing, not editorial content authority.{' '}
            <a href="https://www.w3.org/press-releases/2025/verifiable-credentials-2-0/" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">w3.org/press-releases/2025 ↗</a>
          </Ref>
          <Ref n={7} id="ref-7">
            NLM RxNorm ATC Source Information. ATC + RxNorm integration in clinical research.{' '}
            <a href="https://www.nlm.nih.gov/research/umls/rxnorm/sourcereleasedocs/atc.html" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">nlm.nih.gov ↗</a>
          </Ref>
          <Ref n={8} id="ref-8">
            Plumb&apos;s Veterinary Drug Reference. Editorial board of 200+ vets + pharmacists, USD ~300/year, English only, no public crypto verification.{' '}
            <a href="https://plumbs.com/" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">plumbs.com ↗</a>
          </Ref>
          <Ref n={9} id="ref-9">
            PMC (2018). <i>A Blockchain-Based Notarization Service for Biomedical Knowledge Retrieval</i>.
            Research prototype on Ethereum for CARRE + PubMed hashes.{' '}
            <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6120721/" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">ncbi.nlm.nih.gov/pmc ↗</a>
          </Ref>
          <Ref n={10} id="ref-10">
            Sigstore Documentation + blog (2024–2025). Adoption: Homebrew, PyPI, Maven Central, NVIDIA NGC.{' '}
            <a href="https://docs.sigstore.dev/about/overview/" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">sigstore.dev ↗</a>
          </Ref>
          <Ref n={11} id="ref-11">
            PLOS One (2025). <i>Antibiotic use in companion animals in veterinary teaching hospitals in Thailand</i>.{' '}
            <a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0330750" target="_blank" rel="noreferrer" className="text-source-800 hover:underline">plos.org ↗</a>
          </Ref>
        </ol>
      </section>

      {/* ───── Footer call ───── */}
      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Where to dig deeper</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          อ่าน <Link href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/ARCHITECTURE.md" className="text-source-800 underline-offset-2 hover:underline">ARCHITECTURE.md</Link>{' '}
          สำหรับสเปคเต็มของ 8 primitives. ดู <Link href="/trust" className="text-source-800 underline-offset-2 hover:underline">/trust</Link> สำหรับ chain of trust visualization.
          ดู <Link href="/verify" className="text-source-800 underline-offset-2 hover:underline">/verify</Link> เพื่อทดลอง verify ในเครื่อง.
          พบ prior art ที่ขัดกับ claim ของเรา? เปิด <a href="https://github.com/palmzamak2547/cuvetsmo-source/issues" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">GitHub issue</a>.
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function Primitive({
  n, title, analogy, body, seenBefore, seenBeforeCite,
}: {
  n: number
  title: string
  analogy: string
  body: React.ReactNode
  seenBefore: string
  seenBeforeCite?: number
}) {
  return (
    <article className="grid gap-5 md:grid-cols-[80px_1fr]">
      <div>
        <span
          className="grid h-14 w-14 place-items-center rounded-full border-2 border-source-400 bg-paper-50 text-xl font-bold text-source-800 tabular"
          style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
        >
          {n}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-[20px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          {title}
        </h3>
        <p className="mt-1 text-[14px] italic text-ink-500" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          อุปมา: {analogy}
        </p>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-800">
          {body}
        </div>
        <p className="mt-4 rounded-md border-l-2 border-paper-300 bg-paper-100/40 px-4 py-2.5 text-[12px] text-ink-700">
          <span className="font-semibold text-ink-900">เห็นที่ไหนมาก่อน · </span>
          {seenBefore}
          {seenBeforeCite && (
            <sup>
              <Link href={`#ref-${seenBeforeCite}`} className="cite-token">[{seenBeforeCite}]</Link>
            </sup>
          )}
        </p>
      </div>
    </article>
  )
}

function Finding({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-l-3 border-paper-300 pl-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-source-800">{label}</p>
      <div className="mt-2 text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
        {children}
      </div>
    </div>
  )
}

function Boundary({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-source-400" aria-hidden />
      <span className="flex-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</span>
    </li>
  )
}

function Ref({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <li id={id} className="flex gap-3 scroll-mt-24">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-paper-300 bg-paper-50 font-mono text-[10px] font-semibold text-ink-700 tabular">
        {n}
      </span>
      <span className="flex-1 text-ink-800">{children}</span>
    </li>
  )
}
