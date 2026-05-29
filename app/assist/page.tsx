// /assist — faculty translation editor.
//
// Server entry point. Renders the client editor + an architecture-level
// explainer for what this surface will become (Phase 5: WebGPU Phi-3
// translation suggestions, runs entirely in-browser, no server roundtrip).

import Link from 'next/link'
import AssistClient from './AssistClient'

export const metadata = {
  title: 'Faculty assistant · EN→TH translation editor',
  description: 'Side-by-side English-Thai translation editor for faculty reviewers. Manual today; WebGPU LLM (Phi-3 mini, runs in browser) opt-in coming Phase 5.',
}

export default function AssistPage() {
  return (
    <article>
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Faculty assistant · translation editor</p>
        <h1 className="display-h1 mt-3">English → Thai, side-by-side.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          เครื่องมือสำหรับอาจารย์ที่กำลัง review entry — paste English source ด้านซ้าย, แปลภาษาไทยด้านขวา,
          export เป็น JSON ที่ paste ใส่ PR ได้ทันที. ใช้ได้ออฟไลน์ (PWA cached). <b>ทุกอย่างทำในเครื่องของคุณ —
          ไม่มี server roundtrip, ไม่มี translation API นอก browser</b>.
        </p>
      </header>

      <AssistClient />

      {/* What this is + roadmap */}
      <section className="mt-16">
        <p className="eyebrow">How this fits the pipeline</p>
        <h2 className="display-h2 mt-2">Manual today, WebGPU LLM-assisted in Phase 5</h2>
        <div className="prose-academic mt-5 space-y-4 text-ink-800">
          <p>
            <b>Phase 0 (today)</b> — manual side-by-side editor. คุณ paste DailyMed text หรือ WHO EML text
            ด้านซ้าย, พิมพ์ Thai translation ด้านขวา. คลิก Export → ได้ JSON ก้อนที่พร้อม paste เข้า{' '}
            <code>content/drugs/&lt;slug&gt;.json</code> sections. ไม่มี AI, ไม่มี server, ทุกอย่างทำในเครื่องคุณ.
          </p>
          <p>
            <b>Phase 5 (planned)</b> — opt-in WebGPU LLM. ปุ่ม &ldquo;Install AI assistant&rdquo; จะ download Phi-3-mini
            (~2.4 GB) หรือ Llama 3.2 1B (~1.2 GB) ไปยัง browser IndexedDB ครั้งเดียว, แล้ว run inference
            ในเครื่องของคุณ — <i>query ของคุณไม่ไป server ของเราหรือใครเลย</i>. AI ช่วย <i>เสนอ</i> Thai draft —
            คุณยังต้องตรวจทุกบรรทัด + แก้ + ลงนาม (Iron Rule 0).
          </p>
          <p>
            Why in-browser instead of API? Three reasons: (1) <b>privacy</b> — clinical translation prompts
            never leave your machine; (2) <b>offline</b> — clinic without internet ก็ใช้ได้;
            (3) <b>cost</b> — inference เป็น 0 บาท เพราะใช้ GPU ของผู้ใช้, scales free forever.
          </p>
          <p>
            Why not Phase 0 right now? Three reasons: (1) faculty onboarding ยังไม่มี — สร้างเครื่องมือก่อนผู้ใช้
            ผิดทาง; (2) model download 1-2 GB ต้องการ careful UX (progress bar, cache invalidation, fallback);
            (3) Iron Rule 0 ต้องการ <i>human edits ratio ≥ 0.1</i> สำหรับ AI-drafted content — ต้องวัดให้ถูก
            ก่อน wire LLM เข้า scoring pipeline.
          </p>
        </div>
      </section>

      <hr className="rule-double" />

      {/* Iron Rule 0 reminder */}
      <aside className="rounded-md border-2 border-amber-400 bg-amber-50/60 p-6">
        <p className="eyebrow text-amber-800">Iron Rule 0 — สำหรับเครื่องมือนี้</p>
        <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-amber-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          <li>
            <b>AI ช่วย draft, มนุษย์ authors.</b> ถ้าใช้ LLM suggestion (Phase 5+), ต้องตรวจทุกบรรทัด,
            แก้ตามที่ตัดสินใจเอง, จึงเซ็น.
          </li>
          <li>
            <b>Export → PR ไม่ใช่ auto-submit.</b> เครื่องมือนี้ help คุณเตรียม diff, แต่ commit + sign + push
            ยังคงเป็นการกระทำที่คุณรับผิดชอบ.
          </li>
          <li>
            <b>Translation อิงตาม authoritative source ที่ cite ใน entry นั้น.</b> Source list อยู่ใน{' '}
            <code>citations[]</code> + <code>mirroredFrom[]</code>. ถ้า Thai phrasing ตีความเลย source intent →
            edit กลับให้ตรง.
          </li>
        </ul>
      </aside>

      {/* Pipeline links */}
      <aside className="mt-8 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Related</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          <Link href="/onboarding" className="text-source-800 underline-offset-2 hover:underline">/onboarding</Link> — full faculty walkthrough (~30 min first time)
          {' · '}
          <Link href="/about" className="text-source-800 underline-offset-2 hover:underline">/about</Link> — the 8 primitives explained
          {' · '}
          <Link href="/privacy" className="text-source-800 underline-offset-2 hover:underline">/privacy</Link> — why nothing leaves your browser
          {' · '}
          <a href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">CONTRIBUTING.md</a> — editorial policy
        </p>
      </aside>
    </article>
  )
}
