// W3C Decentralized Identifier (DID) primitives · Primitive 4 foundation.
//
// Phase 0 supports the `did:web` method only — DID = canonical URL to a
// JSON document. This is the simplest DID method and requires no
// blockchain, ledger, or off-chain registry. Other methods (did:key,
// did:peer, did:ion) can be added by extending resolveDID.
//
// did:web pattern:
//
//   did:web:source.cuvetsmo.com:faculty:nam-jing-cuvet
//   resolves to
//   https://source.cuvetsmo.com/.well-known/did/faculty/nam-jing-cuvet/did.json
//
// That JSON document declares the public keys + service endpoints
// associated with the DID, in W3C DID Core format.

export type DIDDocument = {
  '@context': string | string[]
  id: string  // the DID itself
  verificationMethod?: VerificationMethod[]
  assertionMethod?: (string | VerificationMethod)[]
  authentication?: (string | VerificationMethod)[]
  service?: ServiceEndpoint[]
}

export type VerificationMethod = {
  id: string  // e.g. "did:web:source.cuvetsmo.com:faculty:nam-jing#key-1"
  type: 'JsonWebKey2020' | 'Ed25519VerificationKey2020' | 'Ed25519VerificationKey2018'
  controller: string  // the DID
  publicKeyJwk?: {
    kty: string
    crv: string
    x: string
    kid?: string
  }
}

export type ServiceEndpoint = {
  id: string
  type: string
  serviceEndpoint: string
}

/**
 * Parse a `did:web:<host>:<path>` into a resolution URL.
 * Returns null for unsupported DID methods.
 */
export function didWebToURL(did: string): string | null {
  if (!did.startsWith('did:web:')) return null
  const rest = did.slice('did:web:'.length)
  // did:web colons become slashes (except the host)
  const parts = rest.split(':')
  if (parts.length === 0) return null
  const host = parts[0].replace('%3A', ':') // port encoding
  const pathParts = parts.slice(1)
  if (pathParts.length === 0) {
    return `https://${host}/.well-known/did.json`
  }
  return `https://${host}/${pathParts.join('/')}/did.json`
}

/**
 * Parse a DID into its method + identifier components.
 */
export function parseDID(did: string): { method: string; specific: string } | null {
  const m = did.match(/^did:([a-z0-9]+):(.+)$/)
  if (!m) return null
  return { method: m[1], specific: m[2] }
}

/**
 * Returns the local path where a `did:web:source.cuvetsmo.com:...` DID's
 * did.json document should live in our repo's public/.well-known/ tree.
 */
export function didWebRepoPath(did: string): string | null {
  if (!did.startsWith('did:web:source.cuvetsmo.com')) return null
  const rest = did.slice('did:web:source.cuvetsmo.com'.length)
  if (rest === '' || rest === ':') {
    return 'public/.well-known/did.json'
  }
  if (!rest.startsWith(':')) return null
  const pathParts = rest.slice(1).split(':')
  return `public/.well-known/${pathParts.join('/')}/did.json`
}
