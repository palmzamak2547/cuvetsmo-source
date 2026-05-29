// /verify/[slug] — public verification page for a drug entry.
//
// Architecture:
//   - Server (this file): load the drug JSON, look up public keys for
//     each signature, pass everything to the client component.
//   - Client (VerifyClient.tsx): re-canonicalize + re-hash + Web Crypto
//     verify, all in the reader's browser. No server-side verification
//     is shown as authoritative — the math runs locally or it doesn't
//     count.
//
// The intent is that a reader can save this page, disconnect from the
// internet, open the saved HTML, and still verify. (The page is fully
// rendered server-side, and the client JS bundle only needs Web Crypto
// which is built into the browser.)

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { findDrug, DRUGS } from '@/lib/drugs'
import type { Ed25519PublicJWK } from '@/lib/sign'
import VerifyClient from './VerifyClient'

export async function generateStaticParams() {
  return DRUGS.map(d => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) return { title: 'Not found' }
  return {
    title: `Verify ${drug.nameEn}`,
    description: `Browser-side cryptographic verification of all signatures on ${drug.nameEn}. No server trust required.`,
  }
}

async function loadPubKey(kid: string, fingerprint: string): Promise<Ed25519PublicJWK | null> {
  // We accept either an exact kid match or a fingerprint match. The
  // kid is the filename hint; the fingerprint is the authoritative ID
  // that the signature points at.
  const filename = `${kid}.pub.json`
  const filePath = path.join(process.cwd(), 'content', 'keys', filename)
  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed.fingerprint !== fingerprint) return null
    return {
      kty: parsed.kty,
      crv: parsed.crv,
      x: parsed.x,
      kid: parsed.kid,
    }
  } catch {
    return null
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drug = findDrug(slug)
  if (!drug) notFound()

  // Pair each signature with the public key needed to verify it.
  // Pub keys are looked up by signerId (= filename stem) AND fingerprint
  // double-check, so a malicious signature can't claim someone else's
  // pub key.
  const pairs = await Promise.all(
    drug.signatures.map(async sig => ({
      sig,
      pubKey: await loadPubKey(sig.signerId, sig.signerKeyId),
    }))
  )

  return (
    <article className="max-w-3xl">
      <nav className="text-xs text-ink-700">
        <Link href={`/drugs/${drug.slug}`} className="hover:text-source-800">← back to {drug.nameEn}</Link>
      </nav>

      <header className="mt-6 border-b border-paper-300 pb-7">
        <p className="eyebrow">Browser-side verification</p>
        <h1 className="display-h1 mt-3">Verify {drug.nameEn}</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          คุณไม่ต้องเชื่อ source.cuvetsmo.com — โค้ดด้านล่างทำงานในเครื่องของคุณ คำนวณ SHA-256
          และ verify Ed25519 signature เทียบกับ public key ที่อาจารย์เซ็นต์รับเก็บไว้.
        </p>
      </header>

      {/* Quick summary */}
      <section className="mt-7 grid gap-px overflow-hidden rounded-md border border-paper-300 bg-paper-300 sm:grid-cols-3">
        <Tile label="Signatures" value={drug.signatures.length} tone="source" />
        <Tile label="Version" value={drug.version} tone="paper" />
        <Tile
          label="Status"
          value={drug.reviewedBy ? 'canonical' : 'pending'}
          tone={drug.reviewedBy ? 'emerald' : 'amber'}
        />
      </section>

      {/* Empty-state guard */}
      {drug.signatures.length === 0 ? (
        <section className="mt-8 rounded-md border-l-4 border-amber-400 bg-amber-50/60 px-5 py-4 text-sm">
          <p className="eyebrow text-amber-800">⏳ ยังไม่มี signature</p>
          <p className="mt-2 text-amber-900">
            Entry นี้ยังไม่ได้ลงนามโดย key ใดเลย — Phase 0 mirror snapshot ที่รอ Thai translation +
            faculty signoff. ดูสถานะการ review ที่{' '}
            <Link href={`/drugs/${drug.slug}`} className="underline underline-offset-2">หน้า detail</Link>
          </p>
        </section>
      ) : (
        <section className="mt-10">
          <VerifyClient drugJson={drug} pairs={pairs} />
        </section>
      )}

      {/* Raw inputs (collapsed) — for the truly paranoid reader */}
      <section className="mt-12">
        <details className="rounded-md border border-paper-300 bg-paper-50 p-5">
          <summary className="cursor-pointer text-sm font-medium text-ink-900">
            Show the raw inputs <span className="text-ink-500">(paranoid mode)</span>
          </summary>
          <div className="mt-4 space-y-4 text-[11px]">
            <div>
              <p className="eyebrow">Drug JSON</p>
              <p className="mt-1 mb-2 text-[11px] text-ink-500">This is exactly what your browser canonicalizes + SHA-256-hashes</p>
              <pre className="max-h-72 overflow-auto rounded bg-paper-100 p-3 font-mono">
                {JSON.stringify(drug, null, 2)}
              </pre>
            </div>
            <div>
              <p className="eyebrow">Public keys used</p>
              <pre className="mt-2 max-h-48 overflow-auto rounded bg-paper-100 p-3 font-mono">
                {JSON.stringify(pairs.map(p => p.pubKey).filter(Boolean), null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </section>

      {/* Anti-trust framing */}
      <aside className="mt-12 rounded-md border-l-4 border-source-300 bg-source-50/40 px-6 py-5 text-sm">
        <p className="eyebrow">ทำไม browser-side verify?</p>
        <p className="mt-2 leading-relaxed text-ink-900" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
          ถ้า server บอกว่า &ldquo;verified&rdquo; คุณก็ต้องเชื่อ server — แต่ถ้า code ใน browser ของคุณคำนวณ hash
          และ verify signature เอง คุณเชื่อแค่ math กับ public key ที่ commit ใน git history
          ใครก็ตรวจสอบได้ทุกเวลา. Save หน้านี้ไว้, ตัดเน็ต, เปิดอีกที — ผลควรเหมือนเดิม.
        </p>
      </aside>
    </article>
  )
}

function Tile({ label, value, tone }: { label: string; value: string | number; tone: 'emerald' | 'amber' | 'source' | 'paper' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-900',
    amber:   'bg-amber-50 text-amber-900',
    source:  'bg-paper-50 text-source-900',
    paper:   'bg-paper-50 text-ink-900',
  } as const
  return (
    <div className={`p-5 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>{value}</p>
    </div>
  )
}
