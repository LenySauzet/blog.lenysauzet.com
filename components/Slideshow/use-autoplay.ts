'use client';

import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import type { CarouselApi } from '@/components/ui/carousel';

interface AutoplayOptions {
  /** Whether the slideshow plays itself at all. */
  plays: boolean;
  /** Whether it plays now. */
  playing: boolean;
  /** Milliseconds each image holds. */
  interval: number;
  reduced: boolean;
}

/**
 * Autoplay jumps, and the image it leaves, `leaving`, is laid on top to fade out: a
 * cross-fade when the slideshow plays by itself, while a drag, a key or a button
 * still slides the track. `timer` is bumped each time Embla's own timer starts and
 * null while it is stopped, so the step's fill restarts with it and never drifts.
 */
export function useAutoplay(api: CarouselApi, { plays, playing, interval, reduced }: AutoplayOptions) {
  const [timer, setTimer] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<number | null>(null);

  const plugins = useMemo(
    () => (plays ? [Autoplay({ delay: interval, jump: true, playOnInit: false, stopOnFocusIn: false })] : []),
    [plays, interval]
  );

  // Under reduced motion autoplay simply jumps: nothing is left behind to fade.
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
    // Embla re-creates its plugins on every resize, stopped: the state is re-applied.
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
