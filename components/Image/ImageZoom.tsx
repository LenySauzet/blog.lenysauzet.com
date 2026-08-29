'use client';

import { ImageNotFound01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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

const FRAME = 'rounded-lg border-2 border-border';

export interface ImageZoomProps {
  /** Fully resolved URL. Resolution happens on the server. */
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
}

type Status = 'loading' | 'ready' | 'failed';

/** Holds the reserved box while the bytes are still coming. */
function Skeleton() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 animate-pulse rounded-lg bg-muted/40 motion-reduce:animate-none"
    />
  );
}

/**
 * What a reader gets instead of the browser's broken glyph. The alt text is already
 * the caption below, so this only has to say the picture is missing, not repeat it.
 */
function Unavailable({ ratio, className }: { ratio: string; className?: string }) {
  return (
    <div
      style={{ aspectRatio: ratio }}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 border-dashed bg-muted/20',
        className
      )}
    >
      <HugeiconsIcon
        icon={ImageNotFound01Icon}
        strokeWidth={1.6}
        className="size-7 text-subtle-foreground"
      />
      <span className="font-display text-sm text-subtle-foreground">
        Image unavailable
      </span>
    </div>
  );
}

// Both copies share one `layoutId`: Motion morphs one bounding box into the other
// and crossfades between them, which is why the source has to stay visible for the
// length of each transition.
export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  // One status for both copies: they are the same URL, so they succeed or fail
  // together, and the zoomed view must not start its own load from scratch.
  const [status, setStatus] = useState<Status>('loading');

  const layoutId = `image-zoom-${useId()}`;
  const ratio = `${props.width} / ${props.height}`;
  const gone = status === 'failed';

  const image = (className: string, altText: string) => (
    <NextImage
      {...props}
      alt={altText}
      sizes={IMAGE_SIZES}
      className={className}
      onLoad={() => setStatus('ready')}
      onError={() => setStatus('failed')}
    />
  );

  return (
    <MotionConfig reducedMotion="user" transition={ZOOM_TRANSITION}>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => setOpen(true)}
        whileHover={gone ? undefined : { scale: 1.02 }}
        whileTap={gone ? undefined : { scale: 0.95 }}
        disabled={gone}
        style={{ willChange: 'transform' }}
        // Hidden only between the two transitions, where the copy has left this box
        // behind and Motion has handed its opacity back.
        className={cn(
          'block w-full rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          gone ? 'cursor-default' : 'cursor-zoom-in',
          zoomed && 'invisible'
        )}
      >
        {gone ? (
          <Unavailable ratio={ratio} className={FRAME} />
        ) : (
          <div className="relative w-full">
            {image(cn('h-auto w-full object-cover', FRAME), alt)}
            {status === 'loading' ? <Skeleton /> : null}
          </div>
        )}
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
            style={{ aspectRatio: ratio, willChange: 'transform' }}
            className="min-h-0 max-h-full max-w-full"
            onLayoutAnimationComplete={() => setZoomed(true)}
          >
            {gone ? (
              <Unavailable ratio={ratio} className="rounded-lg" />
            ) : (
              image('h-full w-full rounded-lg object-contain', '')
            )}
          </motion.div>
          <ZoomCaption start={zoomed}>{alt}</ZoomCaption>
        </div>
      </Lightbox>
    </MotionConfig>
  );
}
