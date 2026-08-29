import { flushSync } from 'react-dom'

/**
 * Runs a theme change inside a View Transition, which `app/globals.css` draws as a
 * soft circle sweeping out of the top left corner.
 *
 * The change is applied through `flushSync` because the API snapshots the page the
 * moment its callback returns: left to React's own scheduling the swap lands after
 * the snapshot and both frames show the same theme.
 *
 * Falls back to switching outright wherever the API is missing or motion is
 * unwelcome. The sweep is decoration over a change that has to happen either way,
 * so it is never allowed to be the reason one does not.
 */
export function withThemeTransition(change: () => void) {
    const unwanted = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (unwanted || !document.startViewTransition) {
        change()
        return
    }

    document.startViewTransition(() => flushSync(change))
}
