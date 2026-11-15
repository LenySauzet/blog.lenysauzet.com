import { flushSync } from 'react-dom'

import { prefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'

// The API snapshots the page when its callback returns, so the change must flush inside it.
export function withThemeTransition(change: () => void) {
    if (prefersReducedMotion() || !document.startViewTransition) {
        change()
        return
    }

    document.startViewTransition(() => flushSync(change))
}
