<!--
  source.cuvetsmo.com — Pull Request

  Every PR that touches content/ MUST satisfy the Iron Rule 0 checklist
  below before merge. `npm run check` enforces most of it locally; the
  verify-content GitHub Action enforces it on push.
-->

## What changed

<!-- One paragraph. Why this PR exists. -->

## Type of change

- [ ] New drug entry
- [ ] Update to existing drug entry
- [ ] Faculty signoff (`signatures[]` populated, banner flips emerald)
- [ ] Citation mirror (`status: stub` → `mirrored` after bytes captured)
- [ ] Schema, lib, or app code change
- [ ] Docs / ARCHITECTURE / CONTRIBUTING

## Iron Rule 0 checklist (content PRs)

- [ ] All clinical sections have at least one cite reference, and every cite resolves
- [ ] `codes` block populated with ATC and/or RxNorm at minimum
- [ ] `mirroredFrom` + matching `mirrorCIDs` entries present for any mirrored content
- [ ] `drafting.humanReviewer` is set (no anonymous entries)
- [ ] If `drafting.aiAssisted: true` → `aiModel`, `aiPromptHash`, and `humanEditsRatio >= 0.1`
- [ ] No `TEMPLATE` markers left in canonical entries (`reviewedBy !== null`)
- [ ] If `reviewedBy` is set, `signatures.length >= 1` (signed by faculty)
- [ ] `npm run check` passes locally

## How to review (faculty reviewer)

<!-- Required for new entries + content updates. Skip for code-only PRs. -->

- [ ] Thai translation reads naturally to a Thai vet practitioner
- [ ] Doses cross-checked against authoritative source listed in `mirroredFrom`
- [ ] Contraindications and side effects are not missing entries the reviewer would expect
- [ ] Citations point at the document they claim to point at (spot-check 2–3 URLs)
- [ ] No content silently introduced without provenance

## Related issues / sources

<!--
  Link to:
  - upstream mirror source URL(s)
  - GitHub issue or vault decision note
  - faculty email / signoff message ID (if private)
-->

---

<details>
<summary>Iron Rule 0 summary (collapsed)</summary>

No fabrication. Every dose, indication, contraindication that ships canonical must have a verifiable citation chain. AI may draft, never authors. Reviewer is a named human accountable for every line. See ARCHITECTURE.md § Primitive 3 for the full policy.

</details>
