'use client'

// Client component that registers /sw.js on mount. Idempotent — re-
// registering is cheap and the browser handles versioning. The unmount
// path is empty by design — we don't unregister the SW when the user
// navigates away.

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Skip registration in non-secure contexts (some embedded environments)
    if (!window.isSecureContext) return

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(err => {
          // SW registration is best-effort; failure should never break the page.
          console.warn('[sw] register failed', err)
        })
    }

    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad, { once: true })
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  return null
}
