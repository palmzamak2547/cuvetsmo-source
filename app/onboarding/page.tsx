// /onboarding — interactive faculty signing walkthrough.
//
// Shows the actual CLI flow + expected output for each step, so a
// prospective faculty reviewer can see exactly what they're committing
// to before generating a keypair.

import Link from 'next/link'

export const metadata = {
  title: 'Faculty onboarding · How to sign your first entry',
  description: 'Step-by-step walkthrough: from "yes I will review" to your first cryptographically-signed canonical drug entry. ~30 minutes the first time, ~5 minutes per entry after.',
}

export default function OnboardingPage() {
  return (
    <article className="max-w-3xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Faculty onboarding · walkthrough</p>
        <h1 className="display-h1 mt-3">From &ldquo;yes I&apos;ll review&rdquo; to your first signed entry — in 30 minutes.</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          ทุก canonical entry บน source.cuvetsmo.com ต้องมีอาจารย์ผู้เชี่ยวชาญลงนาม Ed25519. หน้านี้คือ flow จริง
          — มี <code>$</code> prompt + sample output + อธิบายว่าแต่ละขั้นตอนทำอะไร.
        </p>
      </header>

      {/* Time table */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="First-time setup" value="~30 min" sub="generate key, register PR, install Node" />
        <Stat label="Per entry after" value="~5 min" sub="read, edit, sign, PR" />
        <Stat label="Hardware needed" value="None" sub="laptop with Node 20+ and Git" />
      </section>

      {/* What you're committing to */}
      <section className="mt-12">
        <p className="eyebrow">Before you start</p>
        <h2 className="display-h2 mt-2">What signing means</h2>
        <p className="mt-3 max-w-2xl text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          When you sign an entry, you publicly attest that <b>you personally read every clinical sentence</b>,
          cross-checked at least one dose against an independent authoritative source, and stand behind the content.
          Your signature is verifiable by any reader in the world, forever, with no central authority needed.
          It is structurally stronger than any reviewing relationship in print — Plumb&apos;s citations point at
          a Plumb&apos;s edition; here, your name is on the byte-level hash of the exact entry you reviewed.
        </p>
      </section>

      <hr className="rule-double" />

      {/* Steps */}
      <section>
        <p className="eyebrow">The flow</p>
        <h2 className="display-h2 mt-2">5 steps to your first signed entry</h2>
        <div className="mt-8 space-y-10">
          <Step
            n={1}
            title="Clone the repo + install"
            time="2 min"
            body={
              <>
                <p>คุณต้องมี Node.js 20+ และ Git. ไม่ต้องมี server, ไม่ต้องสมัครบัญชี.</p>
                <Terminal>
{`$ git clone https://github.com/palmzamak2547/cuvetsmo-source.git
$ cd cuvetsmo-source
$ npm install
added 247 packages in 12s`}
                </Terminal>
              </>
            }
          />

          <Step
            n={2}
            title="Generate your signing key"
            time="3 min"
            body={
              <>
                <p>
                  เลือก kid (key id) ที่สั้น เสถียร และเป็น kebab-case. Convention: <code>firstname.lastname</code>.
                </p>
                <Terminal>
{`$ node scripts/keygen.mjs ekkapol.akb --display "ผศ.น.สพ.ดร. เอกพล อัครพุทธิพร"

✓ Ed25519 keypair generated
  kid:         ekkapol.akb
  display:     ผศ.น.สพ.ดร. เอกพล อัครพุทธิพร
  fingerprint: ed25519:7c2b9e4f1a3d0c87
  public:      content/keys/ekkapol.akb.pub.json  (COMMIT this)
  private:     ~/.cuvetsmo-keys/ekkapol.akb.priv.json  (NEVER commit — outside repo)`}
                </Terminal>
                <Note tone="warn">
                  <b>Private key safety.</b> The private key lands in your home directory <i>outside the repo</i>.
                  Never email, paste, or screenshot it. If it leaks, file a <code>key-rotation</code> issue and
                  we&apos;ll revoke + reissue.
                </Note>
              </>
            }
          />

          <Step
            n={3}
            title="Register your public key (one-time PR)"
            time="5 min"
            body={
              <>
                <p>
                  Create a PR titled <code>keys: register ekkapol.akb</code>. The maintainer merges after
                  verifying your name + affiliation against the faculty directory.
                </p>
                <Terminal>
{`$ git checkout -b keys/ekkapol-akb
$ git add content/keys/ekkapol.akb.pub.json
$ git commit -m "keys: register ekkapol.akb"
$ git push origin keys/ekkapol-akb
$ gh pr create --title "keys: register ekkapol.akb"

✓ PR opened: github.com/palmzamak2547/cuvetsmo-source/pull/N`}
                </Terminal>
              </>
            }
          />

          <Step
            n={4}
            title="Pick an entry, review, sign"
            time="5–10 min per entry"
            body={
              <>
                <p>
                  เปิด <code>content/drugs/&lt;slug&gt;.json</code> — read every clinical section, strip TEMPLATE markers,
                  add Thai translations, cross-check at least one dose against an independent source. Then add your reviewer block:
                </p>
                <Terminal lang="json">
{`"reviewedBy": {
  "name": "ผศ.น.สพ.ดร. เอกพล อัครพุทธิพร",
  "title": "ผู้ช่วยศาสตราจารย์",
  "department": "ภาควิชาเภสัชวิทยา",
  "affiliation": "คณะสัตวแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย",
  "date": "2026-06-15",
  "did": "did:web:source.cuvetsmo.com:faculty:ekkapol-akb",
  "signerKeyId": "ed25519:7c2b9e4f1a3d0c87"
}`}
                </Terminal>
                <p>Then sign:</p>
                <Terminal>
{`$ npm run check
✓ All 175 content units pass Iron Rule 0

$ node scripts/sign.mjs meloxicam --signer ekkapol.akb

✓ Signed meloxicam
  signer:      ผศ.น.สพ.ดร. เอกพล อัครพุทธิพร  (kid: ekkapol.akb)
  fingerprint: ed25519:7c2b9e4f1a3d0c87
  contentHash: 10d5c44cc278d863f9d4b8ee1ed669bcc40baceaa6f74bad78ff10c3d859b033
  signature:   bm5Hb55PtAwQd/Udiue+IyPTjhJ3...  (base64, 88 chars)
  version:     2
  log seq:     2

Verify it:
  npm run verify                           (CLI lint, crypto-verifies all signatures)
  http://localhost:3000/verify/meloxicam   (browser-side verify, no server trust)`}
                </Terminal>
              </>
            }
          />

          <Step
            n={5}
            title="Open the PR, the entry goes canonical"
            time="3 min"
            body={
              <>
                <p>Final PR for the signed entry:</p>
                <Terminal>
{`$ git checkout -b sign/meloxicam
$ git add content/drugs/meloxicam.json content/log/transparency-log.jsonl
$ git commit -m "Sign meloxicam after editorial review"
$ git push origin sign/meloxicam
$ gh pr create --title "Sign meloxicam — first faculty review" --fill`}
                </Terminal>
                <p>
                  Once a maintainer merges, the entry flips from amber pending to <b>emerald canonical</b>
                  on the live site, and your name + title + date show up in the trust stamp + the transparency log + the chain of trust visualization. Anyone who fetches the entry — now or 10 years from now — can verify in their browser that you specifically vouched for it on this date.
                </p>
              </>
            }
          />
        </div>
      </section>

      <hr className="rule-double" />

      {/* Pre-commit checklist */}
      <section>
        <p className="eyebrow">Quick reference</p>
        <h2 className="display-h2 mt-2">Pre-signing checklist</h2>
        <ul className="mt-6 space-y-2.5 text-[15px] leading-relaxed text-ink-800">
          <Check>I read every clinical section in full (not skimmed)</Check>
          <Check>I cross-checked at least one dosage against an independent authoritative source</Check>
          <Check>I stripped every <code>TEMPLATE</code> placeholder</Check>
          <Check>I corrected any Thai phrasing that read awkwardly to a Thai vet practitioner</Check>
          <Check>If AI assisted the draft, <code>drafting.humanEditsRatio</code> reflects my edits honestly (&gt; 0.1)</Check>
          <Check><code>npm run check</code> passes locally with no errors</Check>
          <Check>I added myself to <code>reviewedBy</code> with full title + affiliation</Check>
          <Check>I am signing for content <b>I</b> reviewed — not delegating to a student or RA</Check>
        </ul>
      </section>

      {/* Boundaries */}
      <section className="mt-14">
        <p className="eyebrow">Boundaries</p>
        <h2 className="display-h2 mt-2">When NOT to sign</h2>
        <ul className="mt-6 space-y-2.5 text-[15px] leading-relaxed text-ink-800">
          <X>You skimmed instead of reading every line</X>
          <X>AI drafted and you rubber-stamped — <code>humanEditsRatio &lt; 0.1</code></X>
          <X>A student helped translate but you didn&apos;t re-read after their edits</X>
          <X>You&apos;re uncertain about a specific dose — flag the cell as needing further review instead</X>
          <X>You feel pressure from the maintainer team — let them know rather than sign reluctantly</X>
        </ul>
      </section>

      <aside className="mt-16 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">Full policy</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          See <a href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/FACULTY-ONBOARDING.md" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">FACULTY-ONBOARDING.md</a>{' '}
          for the full 30-minute walkthrough, <a href="https://github.com/palmzamak2547/cuvetsmo-source/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="text-source-800 underline-offset-2 hover:underline">CONTRIBUTING.md</a> for editorial policy + Iron Rule 0,
          and <Link href="/about" className="text-source-800 underline-offset-2 hover:underline">/about</Link> for the technology explainer.
          Questions: <a href="mailto:palm@cuvetsmo.com" className="text-source-800 underline-offset-2 hover:underline">palm@cuvetsmo.com</a>.
        </p>
      </aside>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────

function Step({ n, title, time, body }: { n: number; title: string; time: string; body: React.ReactNode }) {
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
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-[20px] font-semibold tracking-tight text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            {title}
          </h3>
          <span className="text-[11px] uppercase tracking-wider text-ink-500 tabular">{time}</span>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-800" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          {body}
        </div>
      </div>
    </article>
  )
}

function Terminal({ children, lang }: { children: React.ReactNode; lang?: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-paper-300 bg-ink-900 px-4 py-3 text-[12px] leading-relaxed text-paper-100" style={{ fontFamily: 'var(--font-mono)' }}>
      {lang && (
        <span className="mb-2 block text-[10px] uppercase tracking-wider text-paper-400">{lang}</span>
      )}
      {children}
    </pre>
  )
}

function Note({ tone, children }: { tone: 'warn' | 'info'; children: React.ReactNode }) {
  const colors = {
    warn: 'border-amber-400 bg-amber-50/60 text-amber-900',
    info: 'border-source-400 bg-source-50/60 text-source-900',
  } as const
  return (
    <div className={`rounded-md border-l-4 px-4 py-3 text-[13px] ${colors[tone]}`} style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
      {children}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border border-paper-300 bg-paper-50 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{value}</p>
      <p className="mt-1 text-[11px] text-ink-700">{sub}</p>
    </div>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-emerald-500 text-[10px] font-bold text-emerald-700">✓</span>
      <span className="flex-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</span>
    </li>
  )
}

function X({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-red-500 text-[10px] font-bold text-red-700">✗</span>
      <span className="flex-1" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{children}</span>
    </li>
  )
}
