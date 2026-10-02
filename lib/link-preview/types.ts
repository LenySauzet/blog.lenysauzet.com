import type { IconSvgElement } from '@hugeicons/react';

/** What the island draws. A preview carrying an image opens into a card. */
export interface LinkPreview {
  icon: IconSvgElement;
  label: string;
  detail?: string;
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

export type KnownPosts = Record<string, KnownPost>;
