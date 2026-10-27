'use client';

import { Shader } from '@/components/Shader';
import { usePlayback } from '@/hooks/use-playback';

import type { Visual } from './types';

// Per edge, not radial: the frame is a rectangle and the visual has to leave by its
// sides. Two gradients, one per axis, each fading its own pair.
const EDGE_FADE = [
  'linear-gradient(to right, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
  'linear-gradient(to bottom, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
].join(', ');

// Darkens the corner the type sits in, so the visual never has to be quiet everywhere.
const CENTRE_WASH =
  'radial-gradient(105% 62% at 30% 100%, var(--background) 0%, oklch(from var(--background) l c h / 0.92) 42%, oklch(from var(--background) l c h / 0.5) 70%, transparent 95%)';

interface BackdropProps {
  visual: Visual;
}

const COLORS = { uColor: '--primary' } as const;

export function Backdrop({ visual }: BackdropProps) {
  const { playing } = usePlayback();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Shader fragment={visual.fragment} colors={COLORS} playing={playing} className="absolute inset-0" />

      {/* Framing, held here so a visual never draws its own, and in CSS so it follows
          the theme with nothing to read. No backdrop-filter: over a canvas redrawing
          every frame the compositor re-blurs it every frame too, which costs whole
          frames. Softness belongs in the shader. */}
      <div className="absolute inset-0" style={{ background: EDGE_FADE }} />
      <div className="absolute inset-0" style={{ background: CENTRE_WASH }} />
    </div>
  );
}
