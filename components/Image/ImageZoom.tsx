'use client';

import { ImageNotFound01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion, MotionConfig } from 'motion/react';
import NextImage from 'next/image';
import { useId, useState } from 'react';

import { Lightbox, useZoomStage, ZOOM_SIZES, ZOOM_TRANSITION, ZoomCaption } from '@/components/Lightbox';
import { cn } from '@/lib/utils';

const FRAME = 'rounded-frame-xl border-2 border-border';

export interface ImageZoomProps {
  /** Fully resolved URL. */
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
}

type Status = 'loading' | 'ready' | 'failed';

function Skeleton() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 animate-pulse rounded-frame-xl bg-muted/40 motion-reduce:animate-none"
    />
  );
}

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

export default function ImageZoom({ alt, ...props }: ImageZoomProps) {
  const zoom = useZoomStage();
  // One status for both copies, so the zoomed view never starts its own load.
  const [status, setStatus] = useState<Status>('loading');

  const layoutId = `image-zoom-${useId()}`;
  const ratio = `${props.width} / ${props.height}`;
  const gone = status === 'failed';

  // Invisible until loaded, or a failing source paints the broken glyph first.
  const image = (className: string, altText: string, travels = false) => (
    <NextImage
      {...props}
      {...(travels && { loading: 'eager', decoding: 'sync' })}
      alt={altText}
      sizes={ZOOM_SIZES}
      className={cn(
        className,
        'transition-opacity duration-200',
        status === 'ready' ? 'opacity-100' : 'opacity-0'
      )}
      onLoad={() => setStatus('ready')}
      onError={() => setStatus('failed')}
    />
  );

  return (
    <MotionConfig reducedMotion="user" transition={ZOOM_TRANSITION}>
      <motion.button
        type="button"
        onClick={zoom.open}
        whileHover={gone ? undefined : { scale: 1.02 }}
        whileTap={gone ? undefined : { scale: 0.95 }}
        disabled={gone}
        style={{ willChange: 'transform' }}
        className={cn(
          'block w-full rounded-frame-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          gone ? 'cursor-default' : 'cursor-zoom-in',
          zoom.stage === 'closing' && 'relative z-101'
        )}
      >
        <motion.div
          layoutId={layoutId}
          layoutCrossfade={false}
          onLayoutAnimationComplete={zoom.settle}
          className={cn(
            'rounded-frame-xl',
            (zoom.stage === 'opening' || zoom.stage === 'open') && 'invisible'
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
        </motion.div>
      </motion.button>

      <Lightbox
        open={zoom.stage === 'opening' || zoom.stage === 'open'}
        onOpenChange={(next) => !next && zoom.close()}
        title={alt}
      >
        <div className="flex h-full w-full flex-col items-center justify-center md:w-[80dvw]">
          {/* `aspect-ratio` on a shrinkable box lets flex give the caption its room. */}
          <motion.div
            layoutId={layoutId}
            layoutCrossfade={false}
            whileTap={{ scale: 0.98 }}
            style={{ aspectRatio: ratio, willChange: 'transform' }}
            className={cn('min-h-0 max-h-full max-w-full', zoom.stage === 'closing' && 'invisible')}
            onLayoutAnimationComplete={zoom.settle}
          >
            {gone ? (
              <Unavailable ratio={ratio} className="rounded-frame-xl" />
            ) : (
              // Decoded off the main thread, Safari leaves the first frame blank.
              image('h-full w-full rounded-frame-xl object-contain', '', true)
            )}
          </motion.div>
          <ZoomCaption start={zoom.stage === 'open'}>{alt}</ZoomCaption>
        </div>
      </Lightbox>
    </MotionConfig>
  );
}
