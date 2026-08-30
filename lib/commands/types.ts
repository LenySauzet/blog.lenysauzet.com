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

/** A palette that has become something else: a page of its own, with its own input. */
export const PAGES = ['search'] as const

export type Page = (typeof PAGES)[number]

interface CommandBase {
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
     * A `KeyboardEvent.key` that runs this command from anywhere, held with Cmd.
     * Only pick one the browser hands over: it is claimed with `preventDefault`,
     * which the window's own bindings ignore.
     */
    shortcut?: string
    /** Listed but inert, for a destination that does not exist yet. */
    disabled?: boolean
}

/**
 * A command either does something to the site or turns the palette into a page of
 * its own, never both: `opens` has no context to run in, and `run` has nowhere to
 * come back from. The union is what keeps the pair from being written together.
 */
export type Command =
    | (CommandBase & { run: (context: CommandContext) => void; opens?: never })
    | (CommandBase & { opens: Page; run?: never })
