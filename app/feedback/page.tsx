// /feedback — visitor intent capture form.
//
// No backend — the form opens a prefilled GitHub issue OR copies to
// clipboard. We collect zero data on our server. The reader chooses
// whether to share their feedback publicly (via GitHub) or just keep it.

import FeedbackForm from './FeedbackForm'

export const metadata = {
  title: 'Feedback · Tell us what you need',
  description: 'Send feedback, request a drug, suggest a feature, or tell us who you are. No login required, no tracking. Form opens a prefilled GitHub issue.',
}

export default function FeedbackPage() {
  return (
    <article className="max-w-3xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Feedback · ฝากความเห็น</p>
        <h1 className="display-h1 mt-3">Tell us who you are and what you need.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          เราอยากรู้ว่าใครเข้ามา + ต้องการเครื่องมือแบบไหน. ไม่มี login, ไม่มี tracking, ไม่มี backend
          ที่เก็บ form data. ส่ง form → เปิด GitHub issue ที่ <a href="https://github.com/palmzamak2547/cuvetsmo-source/issues" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">cuvetsmo-source/issues</a> ที่ prefill ให้แล้ว — คุณตัดสินใจว่า submit หรือ copy เก็บ.
        </p>
      </header>

      <FeedbackForm />

      {/* What we do with feedback */}
      <section className="mt-16">
        <p className="eyebrow">What we do with it</p>
        <h2 className="display-h2 mt-2">เราใช้ feedback อย่างไร</h2>
        <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-ink-800">
          <Item>
            <b>Public requests</b> เปิดเป็น GitHub issues, ใครก็ comment + upvote ได้.
            ใช้ในการจัดลำดับ Phase 1 priorities.
          </Item>
          <Item>
            <b>Drug requests</b> ที่มี ATC code ระบุ + use case ชัดเจน → add ใน next seed batch ทันที.
          </Item>
          <Item>
            <b>Faculty interest signal</b> (อาจารย์ที่ตอบ &ldquo;ยินดี review&rdquo;) → maintainer ติดต่อกลับเพื่อ onboarding.
          </Item>
          <Item>
            <b>AI startup integration intent</b> → API tier prioritization. ติดต่อกลับเพื่อ technical discussion.
          </Item>
          <Item>
            <b>Bug reports / dead URLs</b> → fix ใน 24 ชม. (เรามี <a href="/health" className="text-source-800 underline-offset-2 hover:underline">/health</a> dashboard อยู่แล้ว, scriptable).
          </Item>
        </ul>
      </section>

      {/* Privacy note */}
      <aside className="mt-12 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Privacy</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          The form below runs entirely in your browser. Submit button does NOT POST to our server — it opens a prefilled
          GitHub issue URL or copies the formatted text to your clipboard. You choose what happens next.
          Read the full stance at <a href="/privacy" className="text-source-800 underline-offset-2 hover:underline">/privacy</a>.
        </p>
      </aside>
    </article>
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
