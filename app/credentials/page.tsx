// /credentials — list of issued Verifiable Credentials.

import Link from 'next/link'
import { listCredentials } from '@/lib/credentials'

export const metadata = {
  title: 'Credentials',
  description: 'W3C Verifiable Credentials issued by the platform — root of trust, faculty attestations, editorial authorizations. Verifiable in your browser.',
}

export default function CredentialsLanding() {
  const all = listCredentials()

  return (
    <article className="max-w-3xl">
      <header className="border-b border-paper-300 pb-7">
        <p className="eyebrow">Verifiable Credentials</p>
        <h1 className="display-h1 mt-3">Credentials</h1>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-700">
          W3C Verifiable Credentials (VC Data Model 2.0) — signed attestations about identities on the platform.
          Editorial authority lives in these credentials; faculty license attestations live here once issued.
          Every credential verifies in your browser.
        </p>
      </header>

      {/* Trust chain */}
      <section className="mt-8 rounded-2xl border-2 border-source-300 bg-source-50 p-5">
        <h2 className="text-lg font-bold text-source-900">Chain of trust</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-source-800">
          <li>
            The <b>cuvetsmo-board key</b> signs the platform DID document at
            {' '}<code className="text-[11px]">did:web:source.cuvetsmo.com</code>
          </li>
          <li>
            The board self-issues the <b>EditorialAuthorityCredential</b> declaring itself root of trust
          </li>
          <li>
            (Future) The board issues <b>VeterinaryLicenseAttestation</b> credentials to onboarded faculty
          </li>
          <li>
            Faculty use their own keys to sign canonical entries — those signatures verify against the
            faculty&apos;s public key, which is itself attested by the board credential above
          </li>
        </ol>
        <p className="mt-3 text-xs text-source-700">
          Phase 0 today: step 1 + step 2 only. Faculty onboarding (step 3+) starts in Week 6.
        </p>
      </section>

      {/* List */}
      {all.length === 0 ? (
        <section className="mt-10 rounded-xl border border-paper-200 bg-paper-100 p-6 text-center text-sm text-paper-700">
          ยังไม่มี credential ที่ issued — รอ Phase 1 faculty onboarding
        </section>
      ) : (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-paper-900">Issued credentials</h2>
          <ul className="mt-3 space-y-3">
            {all.map(c => (
              <li key={c.slug}>
                <Link
                  href={`/credentials/${c.slug}`}
                  className="block rounded-xl border-2 border-source-300 bg-white p-5 transition hover:-translate-y-0.5 hover:border-source-400 hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-source-700">
                    {c.credential.type.filter(t => t !== 'VerifiableCredential').join(' · ')}
                  </p>
                  <h3 className="mt-1 break-all text-base font-bold text-paper-900">{c.slug}</h3>
                  <dl className="mt-3 grid gap-1 text-[11px] sm:grid-cols-[80px_1fr]">
                    <dt className="font-semibold text-paper-900">Issuer</dt>
                    <dd className="break-all text-paper-700">{c.credential.issuer}</dd>
                    <dt className="font-semibold text-paper-900">Subject</dt>
                    <dd className="break-all text-paper-700">{c.credential.credentialSubject.id}</dd>
                    <dt className="font-semibold text-paper-900">Issued</dt>
                    <dd className="text-paper-700">{c.credential.issuanceDate}</dd>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DID resolution hint */}
      <section className="mt-12 rounded-xl border border-paper-200 bg-paper-100 p-4 text-xs text-paper-700">
        <p className="font-semibold text-paper-900">DID resolution</p>
        <p className="mt-1">
          The platform DID is <code className="rounded bg-white px-1 py-0.5">did:web:source.cuvetsmo.com</code>.
          The corresponding DID document lives at{' '}
          <a href="/.well-known/did.json" target="_blank" className="text-source-700 hover:underline">
            /.well-known/did.json
          </a> — committed to the public repo, served as a static asset.
        </p>
      </section>
    </article>
  )
}
