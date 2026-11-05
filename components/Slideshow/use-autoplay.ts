'use client';

import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import type { CarouselApi } from '@/components/ui/carousel';

interface AutoplayOptions {
  /** Whether it can play at all. */
  plays: boolean;
  playing: boolean;
  /** Milliseconds. */
  interval: number;
  reduced: boolean;
}

export function useAutoplay(api: CarouselApi, { plays, playing, interval, reduced }: AutoplayOptions) {
  const [timer, setTimer] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<number | null>(null);

  const plugins = useMemo(
    () => (plays ? [Autoplay({ delay: interval, jump: true, playOnInit: false, stopOnFocusIn: false })] : []),
    [plays, interval]
  );

  const leave = useEffectEvent(() => {
    if (api && !reduced) setLeaving(api.previousScrollSnap());
  });

  useEffect(() => {
    if (!api) return;
    const onTimerSet = () => setTimer((previous) => (previous ?? 0) + 1);
    const onTimerStopped = () => setTimer(null);
    const onAdvance = () => leave();
    api.on('autoplay:timerset', onTimerSet).on('autoplay:timerstopped', onTimerStopped).on('autoplay:select', onAdvance);
    return () => {
      api.off('autoplay:timerset', onTimerSet).off('autoplay:timerstopped', onTimerStopped).off('autoplay:select', onAdvance);
    };
  }, [api]);

  useEffect(() => {
    if (!api?.plugins().autoplay) return;
    const sync = () => {
      const autoplay = api.plugins().autoplay;
      if (playing) autoplay.play();
      else autoplay.stop();
    };
    sync();
    api.on('reInit', sync);
    return () => {
      api.off('reInit', sync);
    };
  }, [api, playing]);

  return { plugins, timer, leaving, clearLeaving: () => setLeaving(null) };
}
