'use client';

import { Shader } from '@/components/Shader';
import { usePlayback } from '@/hooks/use-playback';
import { cn } from '@/lib/utils';

import type { Visual } from './types';

const EDGE_FADE = [
  'linear-gradient(to right, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
  'linear-gradient(to bottom, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
].join(', ');

const CENTRE_WASH =
  'radial-gradient(105% 62% at 30% 100%, var(--background) 0%, oklch(from var(--background) l c h / 0.92) 42%, oklch(from var(--background) l c h / 0.5) 70%, transparent 95%)';

const COLORS = { uColor: '--primary' } as const;

interface BackdropProps {
  visual: Visual;
  className?: string;
}

export function Backdrop({ visual, className }: BackdropProps) {
  const { playing } = usePlayback();

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <Shader fragment={visual.fragment} colors={COLORS} playing={playing} className="absolute inset-0" />

      {/* No backdrop-filter: over a canvas redrawn every frame it re-blurs every frame. */}
      <div className="absolute inset-0" style={{ background: EDGE_FADE }} />
      <div className="absolute inset-0" style={{ background: CENTRE_WASH }} />
    </div>
  );
}
