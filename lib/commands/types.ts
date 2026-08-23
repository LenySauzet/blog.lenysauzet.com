import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { IconSvgElement } from '@hugeicons/react'

/** Rendered in this order, and a command belongs to exactly one. */
export const GROUPS = ['Tools', 'Navigation', 'Links'] as const

export type Group = (typeof GROUPS)[number]

/** What a command is allowed to reach for. Anything else it can take from the page. */
export interface CommandContext {
    router: AppRouterInstance
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
    run: (context: CommandContext) => void
}
