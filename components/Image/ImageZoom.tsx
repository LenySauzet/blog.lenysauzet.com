'use client';

import { motion, MotionConfig } from 'motion/react';
import NextImage from 'next/image';
import { useId, useState } from 'react';

import { Lightbox } from './Lightbox';

// Shared with the Lightbox scrim via MotionConfig, so the scrim can't fade
// faster than the image (which reads as a flash). A plain tween, not a spring:
// springs have no bounded end and `restDelta` is ignored by layout projection,
// so a spring exit lingers past its last visible frame.
const ZOOM_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] } as const;

// Targets the larger, zoomed rendering so the shared file is never upscaled.
// Mobile matches the zoom's rendered width (the surface's content box).
const IMAGE_SIZES = '(max-width: 768px) calc(100vw - 4rem), 80vw';

// Mirrors the surface's p-8. Absolute, not a percentage: the padding is a fixed
// height, so a ratio would under-reserve on short viewports.
const ZOOM_MAX_BLOCK_SIZE = 'calc(100dvh - 4rem)';

export interface ImageZoomProps {
  /** Fully resolved URL. Resolution happens on the server. */
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
}

function PostImage(props: ImageZoomProps) {
  return (
    <NextImage
      {...props}
      sizes={IMAGE_SIZES}
      className="h-auto w-full rounded-lg border border-border object-cover"
    />
  );
}

// Both copies share one `layoutId`, so Motion tweens the bounding box of one
// into the other instead of cross-fading. `reducedMotion="user"` drops the
// transform/layout animations in one place, so no branch is needed below.
export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const layoutId = `image-zoom-${useId()}`;

  return (
    <MotionConfig reducedMotion="user" transition={ZOOM_TRANSITION}>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        style={{ willChange: 'transform' }}
        className="block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <PostImage alt={alt} {...props} />
      </motion.button>

      <Lightbox open={open} onOpenChange={setOpen} title={alt}>
        {/* Decorative copy: the surface is already named by `alt`. */}
        <motion.div
          layoutId={layoutId}
          whileTap={{ scale: 0.98 }}
          style={{
            willChange: 'transform',
            // Solve for width through the aspect ratio rather than capping both
            // axes: capping both would letterbox or distort the image.
            width: `min(var(--zoom-max-inline-size), calc(${ZOOM_MAX_BLOCK_SIZE} * ${props.width} / ${props.height}))`,
          }}
          className="[--zoom-max-inline-size:calc(100dvw_-_4rem)] md:[--zoom-max-inline-size:80dvw]"
        >
          <PostImage alt="" {...props} />
        </motion.div>
      </Lightbox>
    </MotionConfig>
  );
}
