'use client';

import { motion } from 'motion/react';
import { type RefObject, useState } from 'react';

import { Lightbox, useZoomStage, ZOOM_SIZES, ZoomCaption } from '@/components/Lightbox';
import { cn } from '@/lib/utils';

import { MAX_BEND } from './bend';
import { Picture } from './Picture';

interface Frame {
  inset: number;
  radius: number;
  bleed: string;
}

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
    // A frame later, once the box stands where Motion will measure it.
    requestAnimationFrame(zoom.open);
  };

  return { ...zoom, frame, open };
}

export interface LiftProps {
  lift: ReturnType<typeof useLift>;
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  preload: boolean;
}

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
      // Off the main thread, Safari paints nothing on the hand-over frame.
      decoding="sync"
    />
  );

  return (
    <>
      <motion.div
        layoutId={id}
        layoutCrossfade={false}
        aria-hidden="true"
        onLayoutAnimationComplete={settle}
        className={cn('pointer-events-none absolute overflow-hidden', stage === 'closing' ? 'z-101' : 'invisible')}
        // The radius in style, which is what Motion corrects for scale.
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
              // Held to the screen's height less the widest padding and the caption.
              width: `min(100%, calc((100dvh - 8rem) * ${width / height}))`,
              borderRadius: frame.radius,
              willChange: 'transform',
            }}
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
