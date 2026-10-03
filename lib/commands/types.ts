import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { IconSvgElement } from '@hugeicons/react'

import type { Page } from './pages'

/** Rendered in this order, and a command belongs to exactly one. */
export const GROUPS = ['Navigation', 'Tools', 'Links'] as const

export type Group = (typeof GROUPS)[number]

export interface CommandContext {
    router: AppRouterInstance
    pathname: string
    setTheme: (theme: string) => void
    resolvedTheme: string | undefined
    /** The accent preset in force, by id, and the way to change it. */
    hue: string
    setHue: (hue: string) => void
    /** Every post that exists, which is what the random one is drawn from. */
  slugs: string[]
  atTop: boolean
    finished: boolean
}

export type { Page } from './pages'

interface CommandBase {
    id: string
    label: string
    icon: IconSvgElement
    group: Group
    /** Matched on as well as the label, for words a reader might reach for. */
    keywords?: string[]
    /** Absent means everywhere. */
    when?: (context: CommandContext) => boolean
    /** Lifts the command out of its group and to the top, where the moment asks. */
    recommend?: (context: CommandContext) => boolean
    /** Shown quietly on the right, where a link's destination is worth reading. */
    hint?: string
    /**
     * A `KeyboardEvent.key` held with Cmd. Only pick one the browser hands over: it
     * is claimed with `preventDefault`, which the window's own bindings ignore.
     */
    shortcut?: string
    /** Listed but inert, for a destination that does not exist yet. */
    disabled?: boolean
}

/**
 * A command either acts on the site or turns the palette into a page of its own,
 * never both: `opens` has no context to run in, and `run` has nowhere to come back
 * from.
 */
export type Command =
    | (CommandBase & { run: (context: CommandContext) => void; opens?: never })
    | (CommandBase & { opens: Page; run?: never })
