import siteConfig from "@/config/site";
import { BlueskyIcon, Coffee01Icon, DiscordIcon, Github01Icon, InstagramIcon, Linkedin01Icon, Mail01Icon, NewTwitterRectangleIcon, PinterestIcon, RedditIcon, TwitchIcon, UserSquareIcon, YoutubeIcon } from '@hugeicons/core-free-icons';
import { IconSvgElement } from '@hugeicons/react';

const { url, authorUrl } = siteConfig;

export const isInternalLink = (href: string): boolean => {
  return href.startsWith('/') || href.startsWith(url);
};

const getDomain = (href: string): string =>
  new URL(href).hostname.replace(/^www\./, '');

type LinkTypeIcon = {
    icon?: IconSvgElement;
    label: string;
};

export const getLinkTypeIcon = (href?: string): LinkTypeIcon => {
    if (!href || isInternalLink(href)) {
        return { label: 'Internal' };
    }

    if (href.startsWith('mailto:')) {
        return { icon: Mail01Icon, label: 'Email' };
    }

    if (href.startsWith(authorUrl)) {
        return { icon: UserSquareIcon, label: 'Website' };
    }

    const linkDomain = getDomain(href);

    switch (linkDomain) {
        case 'bsky.app':
            return { icon: BlueskyIcon, label: 'Bluesky' };
        case 'x.com':
            return { icon: NewTwitterRectangleIcon, label: 'X' };
        case 'buymeacoffee.com':
            return { icon: Coffee01Icon, label: 'Buy Me a Coffee' };
        case 'github.com':
            return { icon: Github01Icon, label: 'GitHub' };
        case 'linkedin.com':
            return { icon: Linkedin01Icon, label: 'LinkedIn' };
        case 'youtube.com':
            return { icon: YoutubeIcon, label: 'YouTube' };
        case 'instagram.com':
            return { icon: InstagramIcon, label: 'Instagram' };
        case 'twitch.tv':
            return { icon: TwitchIcon, label: 'Twitch' };
        case 'discord.com':
            return { icon: DiscordIcon, label: 'Discord' };
        case 'reddit.com':
            return { icon: RedditIcon, label: 'Reddit' };
        case 'pinterest.com':
            return { icon: PinterestIcon, label: 'Pinterest' };
        default:
            return { label: 'unknown' };
    }
}