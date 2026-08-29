import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { IconSvgElement } from '@hugeicons/react'

/** Rendered in this order, and a command belongs to exactly one. */
export const GROUPS = ['Tools', 'Navigation', 'Links'] as const

export type Group = (typeof GROUPS)[number]

/** What a command is allowed to reach for. Anything else it can take from the page. */
export interface CommandContext {
    router: AppRouterInstance
    pathname: string
    setTheme: (theme: string) => void
    resolvedTheme: string | undefined
}

export interface Command {
    id: string
    label: string
    icon: IconSvgElement
    group: Group
    /** Matched by the search on top of the label, for words a reader might reach for. */
    keywords?: string[]
    /** Offered only where it means something. Absent means everywhere. */
    when?: (context: CommandContext) => boolean
    /** Shown quietly on the right, where a link's destination is worth reading. */
    hint?: string
    /**
     * A `KeyboardEvent.key` that runs this command while the palette is open, held
     * with Cmd. Scoped to the open palette, so it can preventDefault whatever the
     * browser would otherwise do with the same combination.
     */
    shortcut?: string
    /** Left standing, for a command whose own effect is worth watching. */
    keepOpen?: boolean
    /** Listed but inert, for a destination that does not exist yet. */
    disabled?: boolean
    run: (context: CommandContext) => void
}
