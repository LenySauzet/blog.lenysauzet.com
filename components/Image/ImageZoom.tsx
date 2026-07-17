'use client';

import { motion, MotionConfig } from 'motion/react';
import NextImage from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { Lightbox } from './Lightbox';

/** Mirrors --duration-fast and --ease-standard from app/globals.css. */
const PRESS_TRANSITION = {
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
 * An image that opens into a lightbox when clicked.
 *
 * Motion is used only for the trigger's hover and press feedback. The zoom
 * itself is CSS, driven by Radix's data-state — see Lightbox for why the page's
 * scrollability rules that out being a shared-layout morph.
 *
 * `reducedMotion="user"` makes Motion drop transform animations for anyone who
 * asked for less motion, so no branch is needed below.
 */
export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const [open, setOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user" transition={PRESS_TRANSITION}>
      <Lightbox open={open} onOpenChange={setOpen} title={alt} trigger={
        <motion.button
          type="button"
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
        <div
          style={{
            // Widen to the viewport, but never past the width at which the
            // image would grow taller than ZOOM_MAX_BLOCK_SIZE. Capping both
            // axes independently would letterbox or distort; solving for width
            // through the known aspect ratio keeps the border on the image.
            width: `min(var(--zoom-max-inline-size), calc(${ZOOM_MAX_BLOCK_SIZE} * ${props.width} / ${props.height}))`,
          }}
          className="[--zoom-max-inline-size:97dvw] md:[--zoom-max-inline-size:80dvw]"
        >
          <CdnImage alt="" {...props} />
        </div>
      </Lightbox>
    </MotionConfig>
  );
}
