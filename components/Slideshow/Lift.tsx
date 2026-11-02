'use client';

import { motion } from 'motion/react';
import { type RefObject, useState } from 'react';

import { Lightbox, useZoomStage, ZOOM_SIZES, ZoomCaption } from '@/components/Lightbox';
import { cn } from '@/lib/utils';

import { MAX_BEND } from './bend';
import { Picture } from './Picture';

/** The frame the image lifts from: its border, inner corner and the image's bleed in it. */
interface Frame {
  inset: number;
  radius: number;
  bleed: string;
}

/**
 * The current image lifting out of the slideshow's frame into the lightbox and back.
 * `open` reads the frame, then starts the lift a frame later, once the box it lifts
 * from stands where Motion will measure it. The slide hides while `lifted`.
 */
export function useLift(rootRef: RefObject<HTMLDivElement | null>) {
  const zoom = useZoomStage();
  const [frame, setFrame] = useState<Frame>({ inset: 0, radius: 0, bleed: '0px' });

  const open = () => {
    const root = rootRef.current!;
    setFrame({
      inset: root.clientLeft,
      radius: parseFloat(getComputedStyle(root).borderTopLeftRadius) - root.clientLeft,
      // A share of the width, so the crop holds at any size on the way.
      bleed: `${(MAX_BEND / root.clientWidth) * 100}%`,
    });
    requestAnimationFrame(zoom.open);
  };

  return { ...zoom, frame, open };
}

export interface LiftProps {
  lift: ReturnType<typeof useLift>;
  /** Shared by both ends of the morph. */
  id: string;
  src: string;
  /** Names the lightbox and captions it. */
  alt: string;
  width: number;
  height: number;
  /** Loads the image at the lightbox's size ahead, so it opens on it already there. */
  preload: boolean;
}

/**
 * Both ends of the lift. The still end sits over the frame, which the current slide
 * fills at rest: not the slide itself, which rides Embla's transformed track, inside a
 * transform Motion does not own and so measures one slide-width off per slide index.
 * It is outside the frame, whose clip would cut the image's way back, and over the
 * lightbox's veil on that way, whose blur would soften it. Neither end crossfades, so
 * one image travels; the radius is in style, which is what Motion corrects for scale.
 */
export function Lift({ lift, id, src, alt, width, height, preload }: LiftProps) {
  const { stage, frame, close, settle } = lift;
  const face = (
    <Picture
      src={src}
      width={width}
      height={height}
      sizes={ZOOM_SIZES}
      bleed={frame.bleed}
      loading={preload ? 'eager' : 'lazy'}
    />
  );

  return (
    <>
      <motion.div
        layoutId={id}
        layoutCrossfade={false}
        aria-hidden="true"
        onLayoutAnimationComplete={settle}
        className={cn('pointer-events-none absolute overflow-hidden', stage === 'closing' ? 'z-[101]' : 'invisible')}
        style={{ inset: frame.inset, borderRadius: frame.radius }}
      >
        {face}
      </motion.div>
      <Lightbox open={stage === 'opening' || stage === 'open'} onOpenChange={(open) => !open && close()} title={alt}>
        <div className="flex h-full w-full flex-col items-center justify-center md:w-[80dvw]">
          <motion.div
            layoutId={id}
            layoutCrossfade={false}
            onLayoutAnimationComplete={settle}
            style={{
              aspectRatio: `${width} / ${height}`,
              // The image is laid absolutely to keep its crop, so the box sizes itself:
              // the lightbox's width, held to the screen's height less its padding and caption.
              width: `min(100%, calc((100dvh - 8rem) * ${width / height}))`,
              borderRadius: frame.radius,
              willChange: 'transform',
            }}
            // The way back is the still end's, so this one leaves at once.
            className={cn('relative overflow-hidden', stage === 'closing' && 'invisible')}
          >
            {face}
          </motion.div>
          <ZoomCaption start={stage === 'open'}>{alt}</ZoomCaption>
        </div>
      </Lightbox>
    </>
  );
}
