import {
    ArrowRight02Icon,
    BlueskyIcon,
    ArrowUp01Icon,
    Coffee01Icon,
    ColorsIcon,
    CopyLinkIcon,
    Download01Icon,
    ExternalLinkIcon,
    Github01Icon,
    Linkedin01Icon,
    Mail01Icon,
    Moon02Icon,
    NewTwitterIcon,
    PaintBoardIcon,
    SearchIcon,
    ShuffleIcon,
} from '@hugeicons/core-free-icons'

import { announce } from '@/app/_components/DynamicIsland'
import siteConfig from '@/config/site'
import { pickAnother } from '@/lib/search/random'
import { withThemeTransition } from '@/lib/theme-transition'

import type { Command, CommandContext } from './types'

const { social } = siteConfig

const openExternally = (url: string) => () => {
    window.open(url, '_blank', 'noopener,noreferrer')
}

/** Same origin, so `download` is honoured and the page is never left behind. */
const RESUME_ROUTE = '/resume'

/** Copying a link or returning to the top only mean something inside an article. */
const onAPost = ({ pathname }: CommandContext) => pathname.startsWith('/posts/')

const slugOf = ({ pathname }: CommandContext) =>
    pathname.split('/').filter(Boolean).pop()

const onTheIndex = ({ pathname }: CommandContext) => pathname === '/'

const whileReading = (context: CommandContext) =>
    onAPost(context) && !context.atTop && !context.finished

const atTheEnd = (context: CommandContext) => onAPost(context) && context.finished

/** Past the top of an article, where a reader has made a move to answer. */
const underway = (context: CommandContext) =>
    whileReading(context) || atTheEnd(context)

export const commands: Command[] = [
    {
        id: 'search-posts',
        label: 'Search blog posts',
        icon: SearchIcon,
        group: 'Tools',
        keywords: ['find', 'articles', 'writing'],
        recommend: (context) => whileReading(context) || onTheIndex(context),
        opens: 'search',
    },
    {
        id: 'toggle-theme',
        label: 'Toggle theme',
        icon: Moon02Icon,
        group: 'Tools',
        keywords: ['dark', 'light', 'appearance'],
        shortcut: 'd',
        run: ({ setTheme, resolvedTheme }) =>
            withThemeTransition(() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            ),
    },
    {
        id: 'accent',
        label: 'Change the accent',
        icon: ColorsIcon,
        group: 'Tools',
        keywords: ['hue', 'colour', 'color', 'tint', 'palette', 'theme'],
        opens: 'accent',
    },
    {
        id: 'copy-link',
        label: 'Copy link to clipboard',
        icon: CopyLinkIcon,
        group: 'Tools',
        keywords: ['url', 'share'],
        shortcut: 'l',
        when: onAPost,
        recommend: underway,
        run: async () => {
            await navigator.clipboard.writeText(window.location.href)
            announce('Link copied', CopyLinkIcon)
        },
    },
    {
        id: 'go-to-top',
        label: 'Go to top',
        icon: ArrowUp01Icon,
        group: 'Tools',
        keywords: ['scroll', 'beginning'],
        shortcut: 'ArrowUp',
        when: (context) => onAPost(context) && !context.atTop,
        recommend: underway,
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
        id: 'resume',
        label: 'Download resume',
        icon: Download01Icon,
        group: 'Tools',
        keywords: ['cv', 'hire', 'pdf'],
        shortcut: 's',
        run: () => {
            const link = document.createElement('a')
            link.href = RESUME_ROUTE
            link.download = ''
            link.click()
            announce('Downloading my resume', Download01Icon)
        },
    },
    {
        id: 'home',
        label: 'Home',
        icon: ArrowRight02Icon,
        group: 'Navigation',
        keywords: ['index', 'posts'],
        recommend: underway,
        run: ({ router }) => router.push('/'),
    },
    {
        id: 'random-post',
        label: 'Read a random post',
        icon: ShuffleIcon,
        group: 'Tools',
        keywords: ['random', 'surprise', 'discover', 'something else'],
        recommend: (context) => onTheIndex(context) || atTheEnd(context),
        run: (context) => {
            const next = pickAnother(context.slugs, slugOf(context))
            if (next) context.router.push(`/posts/${next}`)
        },
    },
    {
        id: 'design-system',
        label: 'Design System',
        icon: ArrowRight02Icon,
        group: 'Navigation',
        keywords: ['components', 'reference'],
        run: ({ router }) => router.push('/posts/design-system'),
    },
    {
        id: 'glossary',
        label: 'Glossary',
        icon: ArrowRight02Icon,
        group: 'Navigation',
        keywords: ['terms', 'definitions'],
        // Listed so the shape of the site is visible before the page exists.
        disabled: true,
        run: ({ router }) => router.push('/glossary'),
    },
    {
        id: 'rss',
        label: 'RSS',
        icon: ArrowRight02Icon,
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
        hint: 'lenysauzet.com',
        run: openExternally(social.work),
    },
    {
        id: 'contact',
        label: 'Contact',
        icon: Mail01Icon,
        group: 'Links',
        keywords: ['email', 'mail', 'hire'],
        hint: 'contact@lenysauzet.com',
        run: openExternally(social.contact),
    },
    {
        id: 'github',
        label: 'GitHub',
        icon: Github01Icon,
        group: 'Links',
        keywords: ['code', 'source'],
        hint: 'github.com/LenySauzet',
        run: openExternally(social.github),
    },
    {
        id: 'x',
        label: 'X',
        icon: NewTwitterIcon,
        group: 'Links',
        keywords: ['twitter', 'social'],
        hint: 'x.com/LenySauzet',
        run: openExternally(social.x),
    },
    {
        id: 'bluesky',
        label: 'Bluesky',
        icon: BlueskyIcon,
        group: 'Links',
        keywords: ['social', 'bsky'],
        hint: 'lenysauzet.bsky.social',
        run: openExternally(social.bluesky),
    },
    {
        id: 'linkedin',
        label: 'LinkedIn',
        icon: Linkedin01Icon,
        group: 'Links',
        keywords: ['social', 'work'],
        hint: 'linkedin.com/in/lenysauzet',
        run: openExternally(social.linkedin),
    },
    {
        id: 'roadmap',
        label: 'Roadmap',
        icon: PaintBoardIcon,
        group: 'Links',
        keywords: ['figma', 'plans', 'next'],
        hint: 'figma.com',
        run: openExternally(social.roadmap),
    },
    {
        id: 'support',
        label: 'Support me',
        icon: Coffee01Icon,
        group: 'Links',
        keywords: ['donate', 'coffee', 'sponsor'],
        hint: 'buymeacoffee.com/lenysauzet',
        recommend: underway,
        run: openExternally(social.support),
    },
]
