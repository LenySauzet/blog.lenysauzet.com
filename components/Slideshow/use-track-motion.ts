'use client';

import { useMotionValue, useTransform } from 'motion/react';
import { type RefObject, useEffect, useRef } from 'react';

import type { CarouselApi } from '@/components/ui/carousel';

import { bendFor, parallaxShift, slidePath } from './bend';

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
    // The size arrives on `reInit`, which Embla's own observer raises on a resize.
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
    // Read off the internal engine, as Embla's own tween examples do.
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
