'use client'

// Mounts on each /drugs/[slug] page and writes the slug to the
// recently-viewed list in localStorage. Reads back into the homepage
// "Recently viewed" chips for return-visitor convenience.

import { useEffect } from 'react'
import { pushRecentDrug } from '../../CommandPalette'

export default function RecordVisit({ slug }: { slug: string }) {
  useEffect(() => {
    pushRecentDrug(slug)
  }, [slug])
  return null
}
