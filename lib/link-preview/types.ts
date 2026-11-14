import type { IconSvgElement } from '@hugeicons/react';

import type { PostSummary } from '@/lib/post-utils';

export interface LinkPreview {
  icon: IconSvgElement;
  label: string;
  detail?: string;
  site?: string;
  image?: string;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}

export type KnownPost = Pick<PostSummary, 'title' | 'description'>;

export type KnownPosts = Record<string, KnownPost>;
