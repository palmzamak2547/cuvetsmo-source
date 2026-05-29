'use client'

// Browser-side verification for a single drug entry.
//
// This component is the whole point of Primitive 1: the reader does
// NOT trust our server. The page server-renders the raw inputs (drug
// JSON, signature records, public keys) into the DOM, then this
// component re-canonicalizes + re-hashes + Web-Crypto-verifies inside
// the reader's browser.
//
// If the server lied, the math here would show it.

import { useEffect, useState } from 'react'
import type { Ed25519PublicJWK } from '@/lib/sign'
import { verifySignature, browserCanonicalContentHash, isSupportedHere } from '@/lib/verify-client'

type SignatureRecord = {
  signerId: string
  signerName: string
  signerKeyId: string
  contentHash: string
  signature: string
  signedAt: string
}

type Props = {
  /** The raw drug JSON, exactly as it lives on disk. */
  drugJson: unknown
  /** Each signature paired with the public key needed to verify it. */
  pairs: Array<{
    sig: SignatureRecord
    pubKey: Ed25519PublicJWK | null  // null = key unknown to platform
  }>
}

type PerSigState =
  | { phase: 'pending' }
  | { phase: 'no-key' }
  | { phase: 'unsupported' }
  | { phase: 'hash-mismatch'; computedHash: string }
  | { phase: 'verified'; computedHash: string }
  | { phase: 'invalid'; computedHash: string; reason: string }

export default function VerifyClient({ drugJson, pairs }: Props) {
  const [states, setStates] = useState<PerSigState[]>(() => pairs.map(() => ({ phase: 'pending' as const })))
  const [computedRootHash, setComputedRootHash] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    let aborted = false
    async function run() {
      const sup = isSupportedHere()
      if (aborted) return
      setSupported(sup)

      // Recompute the canonical content hash IN THE BROWSER.
      const localHash = await browserCanonicalContentHash(drugJson)
      if (aborted) return
      setComputedRootHash(localHash)

      const next: PerSigState[] = []
      for (const pair of pairs) {
        if (!pair.pubKey) {
          next.push({ phase: 'no-key' })
          continue
        }
        if (!sup) {
          next.push({ phase: 'unsupported' })
          continue
        }
        const result = await verifySignature({
          publicKey: pair.pubKey,
          contentHash: pair.sig.contentHash,
          signatureB64: pair.sig.signature,
          independentlyComputedHash: localHash,
        })
        if (result.ok) {
          next.push({ phase: 'verified', computedHash: localHash })
        } else if (result.reason === 'content-hash-mismatch') {
          next.push({ phase: 'hash-mismatch', computedHash: localHash })
        } else {
          next.push({ phase: 'invalid', computedHash: localHash, reason: result.reason })
        }
        if (aborted) return
      }
      if (!aborted) setStates(next)
    }
    void run()
    return () => { aborted = true }
  }, [drugJson, pairs])

  return (
    <div className="space-y-4">
      {/* Browser capability summary */}
      <div className={`rounded-xl border p-3 text-xs ${
        supported === false
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : 'border-paper-200 bg-paper-100 text-paper-700'
      }`}>
        {supported === null ? (
          <p>กำลังเรียก Web Crypto API…</p>
        ) : supported ? (
          <p>
            <b>✓ Browser supports Ed25519 + SHA-256 via Web Crypto API.</b> การ verify ด้านล่างนี้ทำงาน
            ในเครื่องคุณทั้งหมด ไม่มีการส่งข้อมูลไป server ไหนเลย
          </p>
        ) : (
          <p>
            <b>⚠ Browser นี้ยังไม่รองรับ Ed25519 ผ่าน Web Crypto API.</b> ต้องการ Chrome ≥ 113,
            Firefox ≥ 122, หรือ Safari ≥ 17 เพื่อ verify ในเครื่อง
          </p>
        )}
      </div>

      {/* Browser-computed canonical hash */}
      <section className="rounded-xl border border-paper-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-paper-900">Browser-computed content hash</h3>
        <p className="mt-1 text-[11px] text-paper-700">
          คุณค่านี้คำนวณในเครื่องของคุณจาก raw JSON ที่ส่งมาด้านล่าง (เอา signatures[] field ออก, sort keys,
          ไม่มี whitespace, SHA-256) — ต้องตรงกับ contentHash ของแต่ละ signature
        </p>
        <p className="mt-2 break-all font-mono text-[11px] text-source-800">
          {computedRootHash ?? <span className="text-paper-700">กำลังคำนวณ…</span>}
        </p>
      </section>

      {/* Per-signature verification */}
      <section>
        <h3 className="text-sm font-semibold text-paper-900">Signature verification</h3>
        <ul className="mt-2 space-y-3">
          {pairs.map((pair, i) => (
            <SigCard key={i} index={i} sig={pair.sig} pubKey={pair.pubKey} state={states[i]} />
          ))}
        </ul>
      </section>
    </div>
  )
}

function SigCard({
  index,
  sig,
  pubKey,
  state,
}: {
  index: number
  sig: SignatureRecord
  pubKey: Ed25519PublicJWK | null
  state: PerSigState
}) {
  const tone =
    state.phase === 'verified' ? 'border-emerald-400 bg-emerald-50/80'
    : state.phase === 'invalid' || state.phase === 'hash-mismatch' ? 'border-red-300 bg-red-50'
    : state.phase === 'no-key' || state.phase === 'unsupported' ? 'border-amber-300 bg-amber-50'
    : 'border-paper-200 bg-white'
  // Trigger the stamp animation only when the verified state lands.
  const animClass = state.phase === 'verified' ? 'stamp-in' : ''
  return (
    <li className={`rounded-xl border-2 p-4 text-xs ${tone} ${animClass}`}>
      {state.phase === 'verified' && (
        <div className="mb-3 flex items-center gap-3">
          <CheckmarkBadge />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
              Verified in your browser
            </p>
            <p className="mt-0.5 text-[13px] text-emerald-900">
              Ed25519 signature ของ <b>{sig.signerName}</b> ตรงกับ canonical hash
            </p>
          </div>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold text-paper-900">
          [{index}] {sig.signerName}
        </p>
        <PhaseBadge state={state} />
      </div>
      <dl className="mt-3 grid gap-1.5 sm:grid-cols-[120px_1fr]">
        <Dt>Signer ID</Dt>
        <Dd mono>{sig.signerId}</Dd>

        <Dt>Key fingerprint</Dt>
        <Dd mono>{sig.signerKeyId}</Dd>

        <Dt>Signed at</Dt>
        <Dd>{sig.signedAt}</Dd>

        <Dt>Claimed hash</Dt>
        <Dd mono className="break-all">{sig.contentHash}</Dd>

        <Dt>Signature</Dt>
        <Dd mono className="break-all">{sig.signature}</Dd>

        <Dt>Public key</Dt>
        <Dd mono className="break-all">{pubKey ? `JWK x = ${pubKey.x}` : '(unknown key — cannot verify)'}</Dd>

        {state.phase === 'invalid' && (
          <>
            <Dt>Failure</Dt>
            <Dd>{state.reason}</Dd>
          </>
        )}
        {state.phase === 'hash-mismatch' && (
          <>
            <Dt>Failure</Dt>
            <Dd>browser-computed hash does NOT match the hash in the signature record</Dd>
          </>
        )}
      </dl>
    </li>
  )
}

function CheckmarkBadge() {
  return (
    <span
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path className="check-path" d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </span>
  )
}

function PhaseBadge({ state }: { state: PerSigState }) {
  const map: Record<PerSigState['phase'], { label: string; cls: string }> = {
    pending:        { label: '…',                       cls: 'border-paper-300 bg-paper-100 text-paper-700' },
    'no-key':       { label: 'unknown key',             cls: 'border-amber-300 bg-amber-100 text-amber-900' },
    unsupported:    { label: 'browser unsupported',     cls: 'border-amber-300 bg-amber-100 text-amber-900' },
    'hash-mismatch':{ label: '✗ hash mismatch',         cls: 'border-red-300 bg-red-100 text-red-900' },
    verified:       { label: '✓ verified',              cls: 'border-emerald-300 bg-emerald-100 text-emerald-900' },
    invalid:        { label: '✗ invalid',               cls: 'border-red-300 bg-red-100 text-red-900' },
  }
  const meta = map[state.phase]
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="font-semibold text-paper-900">{children}</dt>
}

function Dd({ children, mono, className }: { children: React.ReactNode; mono?: boolean; className?: string }) {
  return <dd className={`text-paper-800 ${mono ? 'font-mono' : ''} ${className ?? ''}`}>{children}</dd>
}
