// JSON-LD serializer for <script type="application/ld+json">.
//
// JSON.stringify does not escape "<", so a "</script>" inside any value
// would close the tag and execute what follows. Escape it to < — still
// valid JSON, and browsers parse the result identically. Content here is
// repo-authored, but the helper keeps the guarantee even if a citation
// title ever carries angle brackets.
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
