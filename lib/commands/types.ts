import type { IconSvgElement } from '@hugeicons/react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import type { Page } from './pages'

/** Rendered in this order. */
export const GROUPS = ['Navigation', 'Tools', 'Links'] as const

export type Group = (typeof GROUPS)[number]

export interface CommandContext {
    router: AppRouterInstance
    pathname: string
    setTheme: (theme: string) => void
    resolvedTheme: string | undefined
    /** The accent preset's id. */
    hue: string
    setHue: (hue: string) => void
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
    keywords?: string[]
    /** Absent means everywhere. */
    when?: (context: CommandContext) => boolean
    recommend?: (context: CommandContext) => boolean
    hint?: string
    /** A `KeyboardEvent.key` held with Cmd; the browser's own bindings ignore `preventDefault`. */
    shortcut?: string
    disabled?: boolean
}

export type Command =
    | (CommandBase & { run: (context: CommandContext) => void; opens?: never })
    | (CommandBase & { opens: Page; run?: never })
