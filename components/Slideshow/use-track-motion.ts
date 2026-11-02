'use client';

import { useMotionValue, useTransform } from 'motion/react';
import { type RefObject, useEffect, useRef } from 'react';

import type { CarouselApi } from '@/components/ui/carousel';

import { bendFor, parallaxShift, slidePath } from './bend';

/**
 * The track's motion read into each slide. The seam between two moving slides bows
 * with the track's speed, as the Before/After's divider does with the hand's, so every
 * slide is clipped to `outline`; and each image lags its frame by how far that frame
 * sits from the middle of the view, written to the layer `layer(index)` attaches to.
 */
export function useTrackMotion(api: CarouselApi, rootRef: RefObject<HTMLDivElement | null>, reduced: boolean) {
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const bend = useMotionValue(0);
  const layers = useRef<(HTMLDivElement | null)[]>([]);

  const outline = useTransform(() => {
    const path = slidePath(width.get(), height.get(), bend.get());
    return width.get() ? `path("${path}")` : 'none';
  });

  useEffect(() => {
    if (!api) return;
    // Measured from the slides themselves, which the loop moves about on its own, every
    // rect read before any layer moves: one style pass a frame, not one per slide. Its
    // size comes in on `reInit`, which Embla's own observer raises on a resize.
    const place = () => {
      const root = rootRef.current!;
      const span = root.clientWidth;
      width.set(span);
      height.set(root.clientHeight);
      const left = root.getBoundingClientRect().left + root.clientLeft;
      const distances = api.slideNodes().map((slide) => (slide.getBoundingClientRect().left - left) / span);
      distances.forEach((distance, index) => {
        layers.current[index]?.style.setProperty('translate', `${reduced ? 0 : parallaxShift(distance, span)}px 0`);
      });
    };
    // Embla's own speed, which an instant jump leaves at zero, so autoplay's cross-fade
    // never bends; read off its engine, as its tween examples do.
    const onScroll = () => {
      bend.set(reduced ? 0 : bendFor(api.internalEngine().scrollBody.velocity()));
      place();
    };
    const onSettle = () => {
      bend.set(0);
      place();
    };
    place();
    api.on('scroll', onScroll).on('settle', onSettle).on('reInit', place);
    return () => {
      api.off('scroll', onScroll).off('settle', onSettle).off('reInit', place);
    };
  }, [api, rootRef, reduced, width, height, bend]);

  const layer = (index: number) => (node: HTMLDivElement | null) => {
    layers.current[index] = node;
  };

  return { outline, layer };
}
