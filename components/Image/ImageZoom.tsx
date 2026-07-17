'use client';

import { motion, MotionConfig } from 'motion/react';
import NextImage from 'next/image';
import { useId, useState } from 'react';

import { cn } from '@/lib/utils';

import { Lightbox } from './Lightbox';

/**
 * One transition for every motion here: hover, press, and the morph both ways.
 * Mirrors --duration-fast and --ease-standard from app/globals.css.
 *
 * A plain tween rather than a spring, and a short one, because the duration is
 * a correctness constraint rather than a matter of taste. Radix holds pointer
 * events off <body> for as long as its layer is mounted, and the layer lives
 * until the morph ends — so the animation's length *is* how long the page stays
 * unscrollable. Springs have no bounded end: they converge sub-pixel long after
 * they stop being visible, and `restDelta` is not honoured by the layout
 * projection, so the lock outlives the animation.
 *
 * 150ms lands the lightbox where the stock shadcn dialog already sits (measured
 * at 146ms), which is why that one never feels like it blocks anything.
 */
const ZOOM_TRANSITION = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
} as const;

/**
 * Both copies share one file, so the hint targets the larger, zoomed rendering
 * to avoid upscaling a candidate picked for the inline size.
 */
const IMAGE_SIZES = '(max-width: 768px) 97vw, 80vw';

/**
 * Mirrors the surface's own p-8 on both edges. An absolute reserve rather than
 * a percentage: the padding is a fixed height, so a ratio would under-reserve
 * on short viewports.
 */
const ZOOM_MAX_BLOCK_SIZE = 'calc(100dvh - 4rem)';

export interface ImageZoomProps {
  /** Fully resolved URL. Resolution happens on the server. */
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
  className?: string;
}

function CdnImage({
  className,
  ...props
}: Omit<ImageZoomProps, 'src'> & { src: string }) {
  return (
    <NextImage
      {...props}
      sizes={IMAGE_SIZES}
      className={cn(
        'h-auto w-full rounded-lg border border-border object-cover',
        className
      )}
    />
  );
}

/**
 * An image that morphs into a lightbox when clicked, and back out on dismiss.
 *
 * Both copies carry the same `layoutId`, which is what lets Motion tween the
 * bounding box of one into the other instead of cross-fading two elements.
 *
 * `reducedMotion="user"` makes Motion drop transform and layout animations for
 * anyone who asked for less motion, while opacity still fades. That covers the
 * hover, press and morph in one place, so no branch is needed below.
 */
export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const layoutId = `image-zoom-${useId()}`;

  return (
    <MotionConfig reducedMotion="user" transition={ZOOM_TRANSITION}>
      <Lightbox open={open} onOpenChange={setOpen} title={alt} trigger={
        <motion.button
          type="button"
          layoutId={layoutId}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          style={{ willChange: 'transform' }}
          className="block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <CdnImage alt={alt} {...props} />
        </motion.button>
      }>
        {/* The dialog title already announces the image, and the surface owns
            dismissal, so this copy is decorative and non-interactive. */}
        <motion.div
          layoutId={layoutId}
          whileTap={{ scale: 0.98 }}
          style={{
            willChange: 'transform',
            // Widen to the viewport, but never past the width at which the
            // image would grow taller than ZOOM_MAX_BLOCK_SIZE. Capping both
            // axes independently would letterbox or distort; solving for width
            // through the known aspect ratio keeps the border on the image.
            width: `min(var(--zoom-max-inline-size), calc(${ZOOM_MAX_BLOCK_SIZE} * ${props.width} / ${props.height}))`,
          }}
          className="[--zoom-max-inline-size:97dvw] md:[--zoom-max-inline-size:80dvw]"
        >
          <CdnImage alt="" {...props} />
        </motion.div>
      </Lightbox>
    </MotionConfig>
  );
}
