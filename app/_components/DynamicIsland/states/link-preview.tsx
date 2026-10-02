'use client';

import { useState } from 'react';

import type { LinkPreview } from '@/lib/link-preview';
import { cn } from '@/lib/utils';

import { Mark } from '../Mark';
import type { IslandState } from '../types';

export const LINK_PREVIEW = 'link-preview';

const OPEN_WIDTH = '21rem';
const OPEN_RADIUS = 22;

function Still({ src }: { src: string }) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[0.875rem] bg-muted/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onLoad={() => setShown(true)}
        className={cn(
          'size-full object-cover transition-opacity duration-300 motion-reduce:transition-none',
          shown ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

function Preview({ preview, open }: { preview: LinkPreview; open: boolean }) {
  const site = preview.site === preview.label ? undefined : preview.site;

  return (
    <div className="w-full min-w-0">
      {preview.image && <Still src={preview.image} />}

      <div
        className={cn(
          'flex w-full min-w-0 gap-3 pl-1 pr-4',
          open ? 'items-start pt-3 pb-1' : 'h-[1.875rem] items-center'
        )}
      >
        <Mark icon={preview.icon} />

        <div className="min-w-0 flex-1">
          {open && site && (
            <p className="truncate font-mono text-[0.625rem] tracking-wider text-subtle-foreground uppercase">
              {site}
            </p>
          )}
          <p className="truncate text-[0.95rem] leading-snug">{preview.label}</p>
          {preview.detail && (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
              {preview.detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Keeps the corner it is collapsing from, which a pill's radius would round
    into a pebble while the box is still card-sized. */
export const collapsing = (radius?: number): IslandState => ({
  id: LINK_PREVIEW,
  inert: true,
  radius,
  render: () => <div className="w-20" />,
});

export const linkPreview = (preview: LinkPreview): IslandState => {
  const open = Boolean(preview.image || preview.detail);

  return {
    id: LINK_PREVIEW,
    inert: true,
    width: open ? OPEN_WIDTH : undefined,
    maxWidth: open ? OPEN_WIDTH : undefined,
    radius: open ? OPEN_RADIUS : undefined,
    render: () => <Preview preview={preview} open={open} />,
  };
};
