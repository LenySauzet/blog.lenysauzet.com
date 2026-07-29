'use client';

import { motion, MotionConfig } from 'motion/react';
import NextImage from 'next/image';
import { useId, useState } from 'react';

import { Lightbox } from './Lightbox';

// A tween, not a spring: layout projection ignores `restDelta`, so a spring exit
// lingers past its last visible frame.
const ZOOM_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] } as const;

// Sized for the zoomed rendering, so the shared file is never upscaled.
const IMAGE_SIZES = '(max-width: 768px) calc(100vw - 4rem), 80vw';

// Mirrors the surface's p-8. Absolute, since a ratio would under-reserve on
// short viewports.
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
      className="h-auto w-full rounded-lg border-2 border-border object-cover"
    />
  );
}

// Both copies share one `layoutId`, so Motion tweens one bounding box into the
// other instead of cross-fading.
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
            // Solved through the aspect ratio; capping both axes would letterbox.
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
