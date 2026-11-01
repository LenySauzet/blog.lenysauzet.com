'use client';

import Autoplay from 'embla-carousel-autoplay';
import { useInView } from 'motion/react';
import NextImage from 'next/image';
import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';

import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { usePlayback } from '@/hooks/use-playback';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

import { Controls } from './Controls';
import { registerSlideshow, type SlideshowKey } from './keyboard';

// A slide is the article's width, or the screen's less a peek of each neighbour.
const SLIDE = 'basis-[min(42rem,calc(100%-3rem))]';
const SIZES = '(max-width: 768px) calc(100vw - 3rem), 672px';

export interface SlideshowCarouselProps {
  /** Fully resolved URLs; resolution happens on the server. */
  images: string[];
  /** The first image's, which sets the frame every slide shares. */
  width: number;
  height: number;
  /** Names the slideshow and every image in it. */
  alt: string;
  autoPlay: boolean;
  /** Milliseconds each image holds while playing. */
  interval: number;
  className?: string;
}

export function SlideshowCarousel({
  images,
  width,
  height,
  alt,
  autoPlay,
  interval,
  className,
}: SlideshowCarouselProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const playback = usePlayback();
  const inView = useInView(rootRef);
  const count = images.length;
  // One image has nowhere to go, and Autoplay throws when asked to play it.
  const plays = autoPlay && count > 1;
  // A slideshow that plays itself goes round; one the reader drives stops at its ends.
  const loop = plays;
  const playing = plays && playback.playing && inView;

  const plugins = useMemo(
    () => (plays ? [Autoplay({ delay: interval, playOnInit: false, stopOnFocusIn: false })] : []),
    [plays, interval]
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    // The fill restarts with Embla's own timer, so the two never drift after a pause.
    const onTimerSet = () => setTimer((previous) => (previous ?? 0) + 1);
    const onTimerStopped = () => setTimer(null);
    onSelect();
    api.on('select', onSelect).on('autoplay:timerset', onTimerSet).on('autoplay:timerstopped', onTimerStopped);
    return () => {
      api.off('select', onSelect).off('autoplay:timerset', onTimerSet).off('autoplay:timerstopped', onTimerStopped);
    };
  }, [api]);

  useEffect(() => {
    if (!api?.plugins().autoplay) return;
    // Embla re-creates its plugins on every resize, stopped: the state is re-applied.
    const sync = () => {
      const autoplay = api.plugins().autoplay;
      if (playing) autoplay.play(reduced);
      else autoplay.stop();
    };
    sync();
    api.on('reInit', sync);
    return () => {
      api.off('reInit', sync);
    };
  }, [api, playing, reduced]);

  const go = (index: number) => {
    if (!api) return false;
    const target = loop ? (index + count) % count : Math.min(Math.max(index, 0), count - 1);
    if (target === api.selectedScrollSnap()) return false;
    api.scrollTo(target, reduced);
    api.plugins().autoplay?.reset();
    return true;
  };

  const handle = useEffectEvent((key: SlideshowKey) => {
    if (key === 'toggle') {
      if (!plays) return false;
      playback.toggle();
      return true;
    }
    const moved = go({ previous: selected - 1, next: selected + 1, first: 0, last: count - 1 }[key]);
    if (moved) playback.pause();
    return moved;
  });

  useEffect(() => {
    if (count > 1) return registerSlideshow({ root: rootRef.current!, handle: (key) => handle(key) });
  }, [count]);

  // The track runs the width of the screen, each slide framed at the article's
  // width with its neighbours in view; the controls sit under it, on the page.
  return (
    <Carousel
      ref={rootRef}
      setApi={setApi}
      plugins={plugins}
      // Not contained: the first and last slides centre like the rest.
      opts={{ loop, align: 'center', containScroll: false }}
      tabIndex={count > 1 ? 0 : undefined}
      aria-label={alt}
      aria-describedby={count > 1 ? `${id}-keys ${id}-status` : undefined}
      data-slideshow=""
      className={cn('group/slideshow relative left-1/2 -mx-[50vw] w-screen focus-visible:outline-none', className)}
    >
      {count > 1 && (
        <>
          <p id={`${id}-keys`} className="sr-only">
            Use the Left and Right arrow keys to change images{plays ? ', and Space to pause or play' : ''}.
          </p>
          <p id={`${id}-status`} className="sr-only" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
            Image {selected + 1} of {count}.
          </p>
        </>
      )}
      <CarouselContent
        className={cn('ml-0', count > 1 && 'cursor-grab active:cursor-grabbing')}
        onPointerDown={playback.pause}
      >
        {images.map((src, index) => {
          const current = index === selected;
          return (
            <CarouselItem
              key={`${index}-${src}`}
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={!current}
              onClick={current ? undefined : () => go(index)}
              className={cn('px-2', SLIDE)}
            >
              <div
                className={cn(
                  'overflow-hidden rounded-frame-lg border-2 border-border bg-card',
                  current &&
                    'group-focus-visible/slideshow:ring-2 group-focus-visible/slideshow:ring-ring group-focus-visible/slideshow:ring-offset-2 group-focus-visible/slideshow:ring-offset-background'
                )}
                style={{ aspectRatio: `${width} / ${height}` }}
              >
                <NextImage
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  sizes={SIZES}
                  draggable={false}
                  // Once on screen the neighbours load ahead: they are in view either side.
                  loading={inView && (Math.abs(index - selected) <= 1 || (loop && index === count - 1)) ? 'eager' : 'lazy'}
                  className="pointer-events-none size-full object-cover select-none"
                />
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {count > 1 && (
        <Controls
          count={count}
          selected={selected}
          loop={loop}
          onGo={go}
          playback={plays ? { playing: playback.playing, onToggle: playback.toggle } : undefined}
          timer={timer}
          interval={interval}
          className="mt-4"
        />
      )}
    </Carousel>
  );
}
