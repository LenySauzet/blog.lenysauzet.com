import { cn } from '@/lib/utils';

export interface ScrollFadeProps {
  /** Which edge of the viewport the band clings to. */
  position?: 'top' | 'bottom';
  /** Height of the band. */
  height?: string;
  /** Blur at the edge, ramping to none at the inner side. */
  blur?: string;
}

// Fades to a transparent *--background* rather than `transparent`, which
// resolves to rgba(0,0,0,0) and would interpolate through black, drawing a grey
// band across the gradient. Both ramps stay linear: any hold at the edge reads
// as a wash over whatever the band covers rather than a fade.
const fadeToBackground = (direction: string) =>
  `linear-gradient(${direction}, var(--background) 0%, oklch(from var(--background) l c h / 0) 100%)`;

const blurRamp = (direction: string) =>
  `linear-gradient(${direction}, black 0%, transparent 100%)`;

/**
 * Dissolves an edge of a scrolling article into the page. Two stacked effects
 * rather than one: the mask ramps the blur, the gradient ramps the colour, and
 * keeping them apart lets each carry its own curve.
 *
 * Fixed, because the post layout is the scroll container and the body does not
 * scroll; an absolute band would ride away with the text.
 *
 * Server Component: no state, no hooks. `z-40` keeps it under the Dock (z-50)
 * and the Lightbox (z-100).
 */
export default function ScrollFade({
  position = 'bottom',
  height = '6rem',
  blur = '4px',
}: ScrollFadeProps) {
  // The gradients run from the clinging edge inward, so they flip with it.
  const direction = position === 'top' ? 'to bottom' : 'to top';
  const mask = blurRamp(direction);

  return (
    <div
      data-slot="scroll-fade"
      data-position={position}
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 z-40',
        position === 'top' ? 'top-0' : 'bottom-0'
      )}
      style={{ height }}
    >
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${blur})`,
          WebkitBackdropFilter: `blur(${blur})`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: fadeToBackground(direction) }}
      />
    </div>
  );
}
