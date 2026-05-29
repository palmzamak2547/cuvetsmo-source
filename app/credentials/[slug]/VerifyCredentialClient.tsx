'use client'

// Browser-side verification for a Verifiable Credential.
//
// Recomputes SHA-256 of canonical credential (sans proof), then runs
// Web Crypto Ed25519 verify against the issuer's public key (resolved
// from the issuer DID's verificationMethod with id matching the proof's
// verificationMethod).

import { useEffect, useState } from 'react'
import type { Ed25519PublicJWK } from '@/lib/sign'
import type { VerifiableCredential } from '@/lib/vc'
import { verifySignature, browserCanonicalContentHash, isSupportedHere } from '@/lib/verify-client'

// Slight variant: VC canonical hash excludes the proof field, not signatures[].
async function vcCanonicalHash(vc: VerifiableCredential): Promise<string> {
  const { proof: _drop, ...rest } = vc
  return browserCanonicalContentHash(rest)
}

type State =
  | { phase: 'pending' }
  | { phase: 'unsupported' }
  | { phase: 'no-key' }
  | { phase: 'no-proof' }
  | { phase: 'verified'; computedHash: string }
  | { phase: 'invalid'; reason: string; computedHash?: string }

export default function VerifyCredentialClient({
  credential,
  issuerPubKey,
}: {
  credential: VerifiableCredential
  issuerPubKey: Ed25519PublicJWK | null
}) {
  const [state, setState] = useState<State>({ phase: 'pending' })

  useEffect(() => {
    let aborted = false
    async function run() {
      if (!isSupportedHere()) {
        if (!aborted) setState({ phase: 'unsupported' })
        return
      }
      if (!credential.proof) {
        if (!aborted) setState({ phase: 'no-proof' })
        return
      }
      if (!issuerPubKey) {
        if (!aborted) setState({ phase: 'no-key' })
        return
      }

      const computedHash = await vcCanonicalHash(credential)
      const result = await verifySignature({
        publicKey: issuerPubKey,
        contentHash: computedHash,
        signatureB64: credential.proof.proofValue,
      })
      if (aborted) return
      if (result.ok) {
        setState({ phase: 'verified', computedHash })
      } else {
        setState({ phase: 'invalid', reason: result.reason, computedHash })
      }
    }
    void run()
    return () => { aborted = true }
  }, [credential, issuerPubKey])

  return (
    <section
      className={`rounded-xl border-2 p-5 ${
        state.phase === 'verified'
          ? 'border-emerald-400 bg-emerald-50'
          : state.phase === 'invalid'
          ? 'border-red-400 bg-red-50'
          : state.phase === 'pending'
          ? 'border-paper-200 bg-white'
          : 'border-amber-400 bg-amber-50'
      }`}
    >
      <h2 className="text-sm font-semibold">
        {state.phase === 'pending' && 'กำลัง verify…'}
        {state.phase === 'verified' && '✓ Credential verifies'}
        {state.phase === 'invalid' && '✗ Verification failed'}
        {state.phase === 'no-key' && '⚠ Issuer public key not found'}
        {state.phase === 'no-proof' && '⚠ Credential has no proof block'}
        {state.phase === 'unsupported' && '⚠ Browser does not support Web Crypto Ed25519'}
      </h2>
      {state.phase === 'verified' && (
        <p className="mt-2 text-xs text-emerald-900">
          Ed25519 signature ของ issuer ตรงกับ canonical hash ที่ browser ของคุณเพิ่งคำนวณ —
          credential นี้ไม่ถูกแก้หลัง issue และ subject เป็นตามที่ระบุจริง
        </p>
      )}
      {state.phase === 'invalid' && (
        <p className="mt-2 text-xs text-red-900">
          Reason: <span className="font-mono">{state.reason}</span>
        </p>
      )}
      {(state.phase === 'verified' || state.phase === 'invalid') && state.computedHash && (
        <p className="mt-2 break-all font-mono text-[10px] text-paper-700">
          Browser hash: {state.computedHash}
        </p>
      )}
    </section>
  )
}
