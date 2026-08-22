'use client';

import { motion, MotionConfig } from 'motion/react';
import NextImage from 'next/image';
import { useId, useState } from 'react';

import { cn } from '@/lib/utils';

import { Lightbox } from './Lightbox';
import { ZoomCaption } from './ZoomCaption';

// A tween, not a spring: layout projection ignores `restDelta`, so a spring exit
// lingers past its last visible frame.
const ZOOM_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] } as const;

const IMAGE_SIZES = '(max-width: 768px) calc(100vw - 4rem), 80vw';

export interface ImageZoomProps {
  /** Fully resolved URL. Resolution happens on the server. */
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
}

function PostImage({
  className,
  ...props
}: ImageZoomProps & { className: string }) {
  return <NextImage {...props} sizes={IMAGE_SIZES} className={className} />;
}

// Both copies share one `layoutId`, so Motion tweens one bounding box into the
// other instead of cross-fading.
export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [sourceHidden, setSourceHidden] = useState(false);

  const layoutId = `image-zoom-${useId()}`;

  return (
    <MotionConfig reducedMotion="user" transition={ZOOM_TRANSITION}>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => {
          setOpen(true);
          setSourceHidden(true);
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        style={{ willChange: 'transform' }}
        // Hidden through a class, not `style`: Motion owns the style object here.
        // The source stays hidden until its copy has travelled back onto it, or the
        // two read as the image duplicating rather than moving.
        className={cn(
          'block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          sourceHidden && 'invisible'
        )}
      >
        <PostImage
          alt={alt}
          {...props}
          className="h-auto w-full rounded-lg border-2 border-border object-cover"
        />
      </motion.button>

      <Lightbox
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setZoomed(false);
        }}
        onExitComplete={() => setSourceHidden(false)}
        title={alt}
      >
        <div className="flex h-full w-full flex-col items-center md:w-[80dvw]">
          {/* The image takes what the caption leaves, and `aspect-ratio` fits it to
              whichever axis runs out first. */}
          <div className="flex min-h-0 w-full flex-1 items-end justify-center">
            {/* Decorative copy: the surface is already named by `alt`. */}
            <motion.div
              layoutId={layoutId}
              whileTap={{ scale: 0.98 }}
              style={{
                aspectRatio: `${props.width} / ${props.height}`,
                willChange: 'transform',
              }}
              className="max-h-full max-w-full"
              onLayoutAnimationComplete={() => setZoomed(true)}
            >
              <PostImage
                alt=""
                {...props}
                className="h-full w-full rounded-lg border-2 border-border object-contain"
              />
            </motion.div>
          </div>
          <ZoomCaption start={zoomed}>{alt}</ZoomCaption>
        </div>
      </Lightbox>
    </MotionConfig>
  );
}
