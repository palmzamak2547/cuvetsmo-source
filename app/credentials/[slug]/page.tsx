// /credentials/[slug] — view + verify a single VC in the browser.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { findCredential, listCredentials } from '@/lib/credentials'
import type { Ed25519PublicJWK } from '@/lib/sign'
import VerifyCredentialClient from './VerifyCredentialClient'

export async function generateStaticParams() {
  return listCredentials().map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cred = findCredential(slug)
  if (!cred) return { title: 'Credential not found' }
  const types = cred.credential.type.filter(t => t !== 'VerifiableCredential').join(', ')
  return {
    title: `Credential ${slug}`,
    description: `${types} issued by ${cred.credential.issuer} on ${cred.credential.issuanceDate}. Verifiable in your browser.`,
  }
}

async function loadIssuerKey(issuerDID: string, verificationMethodId: string): Promise<Ed25519PublicJWK | null> {
  // For did:web, fetch the issuer's did.json document and pick the
  // verificationMethod matching the proof's verificationMethod ID.
  //
  // Phase 0 supports only did:web:source.cuvetsmo.com (the platform itself),
  // so we read from public/.well-known/did.json on disk.
  if (issuerDID === 'did:web:source.cuvetsmo.com') {
    const didDocPath = path.join(process.cwd(), 'public', '.well-known', 'did.json')
    if (!existsSync(didDocPath)) return null
    try {
      const doc = JSON.parse(await readFile(didDocPath, 'utf8'))
      const methods = doc.verificationMethod ?? []
      const m = methods.find((vm: { id: string }) => vm.id === verificationMethodId)
      if (!m?.publicKeyJwk) return null
      return {
        kty: m.publicKeyJwk.kty,
        crv: m.publicKeyJwk.crv,
        x: m.publicKeyJwk.x,
        kid: m.publicKeyJwk.kid,
      }
    } catch {
      return null
    }
  }
  return null
}

export default async function CredentialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cred = findCredential(slug)
  if (!cred) notFound()

  const issuerPubKey = cred.credential.proof
    ? await loadIssuerKey(cred.credential.issuer, cred.credential.proof.verificationMethod)
    : null

  const otherTypes = cred.credential.type.filter(t => t !== 'VerifiableCredential')

  return (
    <article className="max-w-3xl">
      <nav className="text-xs text-ink-700">
        <Link href="/credentials" className="hover:text-source-800">← back to credentials</Link>
      </nav>

      <header className="mt-6 border-b border-paper-300 pb-7">
        <p className="eyebrow">{otherTypes.join(' · ')}</p>
        <h1 className="display-h1 mt-3 break-all">{slug}</h1>
        <p className="mt-3 break-all font-mono text-[11px] text-ink-500">{cred.credential.id}</p>
      </header>

      {/* Browser-side verify */}
      <div className="mt-6">
        <VerifyCredentialClient
          credential={cred.credential}
          issuerPubKey={issuerPubKey}
        />
      </div>

      {/* Credential summary */}
      <section className="mt-6 rounded-xl border border-paper-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-paper-900">Credential summary</h2>
        <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-[140px_1fr]">
          <Dt>Type</Dt>
          <Dd>{cred.credential.type.join(', ')}</Dd>

          <Dt>Issuer</Dt>
          <Dd mono>{cred.credential.issuer}</Dd>

          <Dt>Subject</Dt>
          <Dd mono>{cred.credential.credentialSubject.id}</Dd>

          <Dt>Issued at</Dt>
          <Dd>{cred.credential.issuanceDate}</Dd>

          {cred.credential.expirationDate && (
            <>
              <Dt>Expires</Dt>
              <Dd>{cred.credential.expirationDate}</Dd>
            </>
          )}

          {cred.credential.proof && (
            <>
              <Dt>Proof type</Dt>
              <Dd mono>{cred.credential.proof.type}</Dd>

              <Dt>Verification method</Dt>
              <Dd mono className="break-all">{cred.credential.proof.verificationMethod}</Dd>
            </>
          )}
        </dl>
      </section>

      {/* Claims */}
      <section className="mt-6 rounded-xl border border-paper-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-paper-900">Claims</h2>
        <p className="mt-1 text-[11px] text-paper-700">
          The statements this credential asserts about the subject. Everything else (issuer, dates, proof) is metadata.
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-paper-100 p-3 text-[11px] font-mono text-paper-800">
{JSON.stringify(
  Object.fromEntries(
    Object.entries(cred.credential.credentialSubject).filter(([k]) => k !== 'id')
  ),
  null,
  2,
)}
        </pre>
      </section>

      {/* Raw */}
      <section className="mt-6">
        <details className="rounded-xl border border-paper-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-paper-900">
            Show the raw credential JSON (paranoid mode)
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto rounded bg-paper-100 p-3 text-[11px] font-mono text-paper-800">
{JSON.stringify(cred.credential, null, 2)}
          </pre>
        </details>
      </section>

      {/* DID resolution hint */}
      <footer className="mt-10 rounded-xl border border-source-300 bg-source-50 p-4 text-xs text-source-900">
        <p className="font-semibold">How the verify works</p>
        <p className="mt-1">
          Browser fetches the issuer DID document, finds the public key referenced by the proof,
          recomputes SHA-256 over the canonical credential (without the proof field), then runs Ed25519
          verify in Web Crypto. The math runs in your tab — no server-side &quot;verified&quot; claim is shown
          as authoritative
        </p>
      </footer>
    </article>
  )
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="font-semibold text-paper-900">{children}</dt>
}
function Dd({ children, mono, className }: { children: React.ReactNode; mono?: boolean; className?: string }) {
  return <dd className={`text-paper-800 ${mono ? 'font-mono' : ''} ${className ?? ''}`}>{children}</dd>
}
