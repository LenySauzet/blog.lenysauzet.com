import { flushSync } from 'react-dom'

// The API snapshots the page when its callback returns, so the change must flush inside it.
export function withThemeTransition(change: () => void) {
    const unwanted = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (unwanted || !document.startViewTransition) {
        change()
        return
    }

    document.startViewTransition(() => flushSync(change))
}
