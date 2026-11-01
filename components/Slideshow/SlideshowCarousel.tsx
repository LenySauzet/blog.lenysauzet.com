'use client';

import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import { useInView } from 'motion/react';
import NextImage from 'next/image';
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';

import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { usePlayback } from '@/hooks/use-playback';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

import { Controls } from './Controls';
import { registerSlideshow, type SlideshowKey } from './keyboard';

const SIZES = '(max-width: 768px) calc(100vw - 2rem), 700px';

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
  // A slideshow that plays itself goes round; one the reader drives stops at its ends.
  const loop = autoPlay;
  const playing = autoPlay && playback.playing && inView;

  const [plugins] = useState(() =>
    autoPlay
      ? [Fade(), Autoplay({ delay: interval, playOnInit: false, stopOnFocusIn: false })]
      : []
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
      if (!autoPlay) return false;
      playback.toggle();
      return true;
    }
    playback.pause();
    const index = { previous: selected - 1, next: selected + 1, first: 0, last: count - 1 }[key];
    return go(index);
  });

  useEffect(() => {
    if (count > 1) return registerSlideshow({ root: rootRef.current!, handle: (key) => handle(key) });
  }, [count]);

  return (
    <Carousel
      ref={rootRef}
      setApi={setApi}
      plugins={plugins}
      opts={{ loop }}
      tabIndex={count > 1 ? 0 : undefined}
      aria-label={alt}
      aria-describedby={count > 1 ? `${id}-keys ${id}-status` : undefined}
      data-slideshow=""
      className={cn(
        'overflow-hidden rounded-frame-lg border-2 border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        className
      )}
    >
      {count > 1 && (
        <>
          <p id={`${id}-keys`} className="sr-only">
            Use the Left and Right arrow keys to change images{autoPlay ? ', and Space to pause or play' : ''}.
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
        {images.map((src, index) => (
          <CarouselItem
            key={`${index}-${src}`}
            aria-label={`${index + 1} of ${count}`}
            inert={index !== selected}
            className="pl-0"
            style={{ aspectRatio: `${width} / ${height}` }}
          >
            <NextImage
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes={SIZES}
              draggable={false}
              // Once on screen the neighbours load ahead, so a drag never reveals a blank slide.
              loading={inView && (Math.abs(index - selected) <= 1 || (loop && index === count - 1)) ? 'eager' : 'lazy'}
              className="pointer-events-none size-full object-cover select-none"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {count > 1 && (
        <Controls
          count={count}
          selected={selected}
          loop={loop}
          onGo={go}
          playback={autoPlay ? { playing: playback.playing, onToggle: playback.toggle } : undefined}
          timer={timer}
          interval={interval}
        />
      )}
    </Carousel>
  );
}
