import { flushSync } from 'react-dom'

/**
 * `flushSync` because the API snapshots the page the moment its callback returns:
 * left to React's scheduling, the swap lands after the snapshot and both frames
 * show the same theme. The sweep is decoration over a change that has to happen
 * either way, so it never gets to be the reason one does not.
 */
export function withThemeTransition(change: () => void) {
    const unwanted = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (unwanted || !document.startViewTransition) {
        change()
        return
    }

    document.startViewTransition(() => flushSync(change))
}
