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
     * A letter that runs this command while the palette is open, held with Alt.
     * Not Cmd: the browser claims most of those before a page can see them.
     */
    shortcut?: string
    /** Listed but inert, for a destination that does not exist yet. */
    disabled?: boolean
    run: (context: CommandContext) => void
}
