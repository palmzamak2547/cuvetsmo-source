'use client'

// Client-side feedback form — composes a GitHub issue URL with prefilled
// title + body, then either redirects to GitHub (where the user clicks
// "Submit") or copies the formatted text to clipboard.
//
// Zero data is sent to source.cuvetsmo.com. Everything happens in your
// browser. The form values never leave this tab unless YOU choose to
// open the GitHub URL.

import { useState } from 'react'

type Role =
  | 'vet-student'
  | 'practicing-vet'
  | 'faculty'
  | 'researcher'
  | 'ai-dev'
  | 'hospital-pharmacist'
  | 'pet-owner'
  | 'regulator'
  | 'other'

type IntentTag =
  | 'attest-entry'
  | 'report-error'
  | 'request-drug'
  | 'request-feature'
  | 'report-bug'
  | 'offer-faculty-review'
  | 'integrate-api'
  | 'general-feedback'

const ROLE_LABEL: Record<Role, string> = {
  'vet-student':         'Vet student',
  'practicing-vet':      'Practicing veterinarian',
  'faculty':             'Faculty / Lecturer',
  'researcher':          'Researcher',
  'ai-dev':              'AI / startup developer',
  'hospital-pharmacist': 'Hospital pharmacist',
  'pet-owner':           'Pet owner',
  'regulator':           'Regulator / government',
  'other':               'Other',
}

const INTENT_LABEL: Record<IntentTag, string> = {
  'attest-entry':         '✓ ยืนยันว่า entry ถูกต้อง (attest)',
  'report-error':         '⚠ พบข้อมูลไม่ตรงกับตำรา',
  'request-drug':         'Request a drug entry',
  'request-feature':      'Suggest a feature',
  'report-bug':           'Report a bug / dead link',
  'offer-faculty-review': 'I would like to review entries',
  'integrate-api':        'I want to integrate the API',
  'general-feedback':     'General feedback / question',
}

export default function FeedbackForm() {
  const [role, setRole] = useState<Role>('vet-student')
  const [intent, setIntent] = useState<IntentTag>('general-feedback')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [copied, setCopied] = useState(false)

  const issueTitle = `[${INTENT_LABEL[intent]}] from ${ROLE_LABEL[role]}`
  const issueBody = [
    `**Who:** ${ROLE_LABEL[role]}`,
    `**Intent:** ${INTENT_LABEL[intent]}`,
    contact ? `**Contact (optional):** ${contact}` : null,
    '',
    '---',
    '',
    message || '(no message provided)',
  ].filter(Boolean).join('\n')

  const issueUrl = `https://github.com/palmzamak2547/cuvetsmo-source/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}&labels=${encodeURIComponent('feedback,' + intent)}`

  const onOpenIssue = () => {
    window.open(issueUrl, '_blank', 'noopener,noreferrer')
  }

  const onCopy = async () => {
    await navigator.clipboard.writeText(`${issueTitle}\n\n${issueBody}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const valid = message.trim().length > 0

  return (
    <div className="mt-10 rounded-md border border-paper-300 bg-paper-50 p-6 md:p-8">
      <div className="space-y-6">
        {/* Role */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            I am a…
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(ROLE_LABEL) as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`inline-flex cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition ${
                  role === r
                    ? 'border-source-700 bg-source-800 text-paper-50'
                    : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Intent */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            I want to…
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(INTENT_LABEL) as IntentTag[]).map(it => (
              <button
                key={it}
                type="button"
                onClick={() => setIntent(it)}
                aria-pressed={intent === it}
                className={`inline-flex cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition ${
                  intent === it
                    ? 'border-source-700 bg-source-800 text-paper-50'
                    : 'border-paper-300 bg-paper-50 text-ink-700 hover:border-source-500 hover:text-source-800'
                }`}
              >
                {INTENT_LABEL[it]}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="msg" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Message (free text)
          </label>
          <textarea
            id="msg"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={getPlaceholder(intent)}
            rows={6}
            className="mt-1 w-full rounded-md border-2 border-paper-300 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink-900 transition focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600"
            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
          />
        </div>

        {/* Optional contact */}
        <div>
          <label htmlFor="contact" className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Contact (optional — only if you want a reply)
          </label>
          <input
            id="contact"
            type="text"
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="email, LINE, Twitter handle, GitHub username, or leave blank"
            className="mt-1 w-full rounded-md border-2 border-paper-300 bg-white px-4 py-2.5 text-[14px] text-ink-900 transition focus:border-source-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-source-600"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t border-paper-200 pt-5">
          <button
            type="button"
            onClick={onOpenIssue}
            disabled={!valid}
            className="inline-flex cursor-pointer rounded-md bg-source-800 px-4 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-source-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open GitHub issue (prefilled) ↗
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!valid}
            aria-live="polite"
            className="inline-flex cursor-pointer rounded-md border border-paper-300 bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-900 transition hover:border-source-600 hover:text-source-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? '✓ Copied to clipboard' : 'Copy to clipboard'}
          </button>
          {/* Screen-reader-only live region — announces "Copied" without
              relying on visible button text change being polled by AT. */}
          <span role="status" aria-live="polite" className="sr-only">
            {copied ? 'Issue text copied to clipboard.' : ''}
          </span>
          <span className="ml-auto text-[11px] text-ink-500">
            Nothing is sent to our server — your form values never leave this tab unless you open GitHub.
          </span>
        </div>
      </div>
    </div>
  )
}

function getPlaceholder(intent: IntentTag): string {
  switch (intent) {
    case 'attest-entry':
      return 'ยืนยันว่า entry ไหน + ตรวจกับแหล่งอะไร (เช่น "carprofen — ตรวจ dog dose 4.4 mg/kg กับ Plumb\'s 9th ed p.180 แล้ว ตรงกัน"). ใส่ชื่อ/handle + บทบาท (นิสิต/สัตวแพทย์) เพื่อบันทึกในทะเบียน. 2 การยืนยันอิสระเลื่อน entry เป็น Community-checked.'
    case 'report-error':
      return 'entry ไหน + จุดที่ไม่ตรง + ตำราที่คุณอ้าง (เช่น "meloxicam cat dose ควรเป็น X ตาม Plumb\'s p.YYY"). เราจะตรวจและแก้ พร้อมบันทึกใน transparency log.'
    case 'request-drug':
      return 'Drug name + ATC code if you know it. Why it matters for your work (e.g. "Cyclosporine — used commonly in canine atopic dermatitis, would be useful for derm rotation").'
    case 'request-feature':
      return 'What you want, who would use it, how often you would use it (e.g. "Search by indication — find all drugs for canine epilepsy").'
    case 'report-bug':
      return 'What you expected, what happened. Include the URL if specific to a page.'
    case 'offer-faculty-review':
      return 'Your name, title, department, affiliation. Which categories you can review (NSAIDs / antibiotics / anesthetics / etc).'
    case 'integrate-api':
      return 'Your product, your use case, expected request volume. We can prioritize endpoints if useful.'
    case 'general-feedback':
      return 'Tell us anything. Even a sentence is useful signal.'
  }
}
