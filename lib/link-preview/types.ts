import type { IconSvgElement } from '@hugeicons/react';

/** What the island draws. A preview carrying an image opens into a card. */
export interface LinkPreview {
  icon: IconSvgElement;
  /** The headline: a title, a handle, a repository, a domain. */
  label: string;
  /** Under it: a description, a channel, whatever the headline leaves out. */
  detail?: string;
  /** Over it: where this lives. */
  site?: string;
  image?: string;
}

/** What a page said about itself, once asked. */
export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}

export interface KnownPost {
  title: string;
  description: string;
}

/** Slug to post, for the articles a link can point at. */
export type KnownPosts = Record<string, KnownPost>;
