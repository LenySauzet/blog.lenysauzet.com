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

interface PostImageProps extends ImageZoomProps {
  className: string;
}

function PostImage({ className, ...props }: PostImageProps) {
  return <NextImage {...props} sizes={IMAGE_SIZES} className={className} />;
}

// Both copies share one `layoutId`: Motion morphs one bounding box into the other
// and crossfades between them, which is why the source has to stay visible for the
// length of each transition.
export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

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
        // Hidden only between the two transitions, where the copy has left this box
        // behind and Motion has handed its opacity back.
        className={cn(
          'block w-full cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          zoomed && 'invisible'
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
        title={alt}
      >
        <div className="flex h-full w-full flex-col items-center justify-center md:w-[80dvw]">
          {/* Decorative copy: the surface is already named by `alt`. `aspect-ratio`
              with a shrinkable box lets flex give the caption its room. */}
          <motion.div
            layoutId={layoutId}
            whileTap={{ scale: 0.98 }}
            style={{
              aspectRatio: `${props.width} / ${props.height}`,
              willChange: 'transform',
            }}
            className="min-h-0 max-h-full max-w-full"
            onLayoutAnimationComplete={() => setZoomed(true)}
          >
            <PostImage
              alt=""
              {...props}
              className="h-full w-full rounded-lg object-contain"
            />
          </motion.div>
          <ZoomCaption start={zoomed}>{alt}</ZoomCaption>
        </div>
      </Lightbox>
    </MotionConfig>
  );
}
