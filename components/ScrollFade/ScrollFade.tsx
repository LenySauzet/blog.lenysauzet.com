export interface ScrollFadeProps {
  /** Height of the band. */
  height?: string;
  /** Blur at the very bottom, ramping to none at the top. */
  blur?: string;
}

// Two stacked effects rather than one: the mask ramps the blur, the gradient
// ramps the colour, and keeping them apart lets each carry its own curve. The
// colour stop fades to a transparent *--background* rather than `transparent`,
// which resolves to rgba(0,0,0,0) and would draw a grey band on the way out.
const FADE_TO_BACKGROUND =
  'linear-gradient(to top, var(--background) 0%, oklch(from var(--background) l c h / 0.85) 35%, oklch(from var(--background) l c h / 0) 100%)';

const BLUR_RAMP =
  'linear-gradient(to top, black 0%, black 25%, transparent 100%)';

/**
 * Dissolves the foot of a scrolling article into the page. Fixed, because the
 * post layout is the scroll container and the body does not scroll; an absolute
 * band would ride away with the text.
 *
 * Server Component: no state, no hooks. `z-40` keeps it under the Dock (z-50)
 * and the Lightbox (z-100).
 */
export default function ScrollFade({
  height = '8rem',
  blur = '8px',
}: ScrollFadeProps) {
  return (
    <div
      data-slot="scroll-fade"
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      style={{ height }}
    >
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${blur})`,
          WebkitBackdropFilter: `blur(${blur})`,
          maskImage: BLUR_RAMP,
          WebkitMaskImage: BLUR_RAMP,
        }}
      />
      <div className="absolute inset-0" style={{ background: FADE_TO_BACKGROUND }} />
    </div>
  );
}
