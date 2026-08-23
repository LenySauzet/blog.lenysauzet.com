import {
    ArrowRight01Icon,
    ArrowUp01Icon,
    Coffee01Icon,
    CopyLinkIcon,
    ExternalLinkIcon,
    Github01Icon,
    Home01Icon,
    Mail01Icon,
    Moon02Icon,
    NewTwitterIcon,
    RssIcon,
} from '@hugeicons/core-free-icons'

import siteConfig from '@/config/site'

import type { Command } from './types'

const { social } = siteConfig

const openExternally = (url: string) => () => {
    window.open(url, '_blank', 'noopener,noreferrer')
}

export const commands: Command[] = [
    {
        id: 'toggle-theme',
        label: 'Toggle theme',
        icon: Moon02Icon,
        group: 'Tools',
        keywords: ['dark', 'light', 'appearance'],
        run: ({ setTheme, resolvedTheme }) =>
            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    },
    {
        id: 'copy-link',
        label: 'Copy link to clipboard',
        icon: CopyLinkIcon,
        group: 'Tools',
        keywords: ['url', 'share'],
        run: () => navigator.clipboard.writeText(window.location.href),
    },
    {
        id: 'go-to-top',
        label: 'Go to top',
        icon: ArrowUp01Icon,
        group: 'Tools',
        keywords: ['scroll', 'beginning'],
        // `body` is fixed and each column owns its overflow, so the window never
        // scrolls: whichever column is marked is the thing that has to move.
        run: () => {
            const behavior = window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'auto'
                : 'smooth'
            const root =
                document.querySelector<HTMLElement>('[data-scroll-root]') ??
                document.scrollingElement
            root?.scrollTo({ top: 0, behavior })
        },
    },
    {
        id: 'home',
        label: 'Home',
        icon: Home01Icon,
        group: 'Navigation',
        keywords: ['index', 'posts'],
        run: ({ router }) => router.push('/'),
    },
    {
        id: 'design-system',
        label: 'Design System',
        icon: ArrowRight01Icon,
        group: 'Navigation',
        keywords: ['components', 'reference'],
        run: ({ router }) => router.push('/posts/design-system'),
    },
    {
        id: 'rss',
        label: 'RSS',
        icon: RssIcon,
        group: 'Navigation',
        keywords: ['feed', 'subscribe'],
        run: ({ router }) => router.push('/rss'),
    },
    {
        id: 'work',
        label: 'Work',
        icon: ExternalLinkIcon,
        group: 'Links',
        keywords: ['portfolio', 'site'],
        run: openExternally(social.work),
    },
    {
        id: 'contact',
        label: 'Contact',
        icon: Mail01Icon,
        group: 'Links',
        keywords: ['email', 'mail', 'hire'],
        run: openExternally(social.contact),
    },
    {
        id: 'github',
        label: 'GitHub',
        icon: Github01Icon,
        group: 'Links',
        keywords: ['code', 'source'],
        run: openExternally(social.github),
    },
    {
        id: 'x',
        label: 'X',
        icon: NewTwitterIcon,
        group: 'Links',
        keywords: ['twitter', 'social'],
        run: openExternally(social.x),
    },
    {
        id: 'support',
        label: 'Support me',
        icon: Coffee01Icon,
        group: 'Links',
        keywords: ['donate', 'coffee', 'sponsor'],
        run: openExternally(social.support),
    },
]
