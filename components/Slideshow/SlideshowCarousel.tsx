'use client';

import Autoplay from 'embla-carousel-autoplay';
import { motion, useInView, useMotionValue, useTransform } from 'motion/react';
import NextImage from 'next/image';
import { useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';

import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { usePlayback } from '@/hooks/use-playback';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

import { bendFor, MAX_BEND, slidePath } from './bend';
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
  const [leaving, setLeaving] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const playback = usePlayback();
  const inView = useInView(rootRef);
  // The seam between two moving slides bows with the track's speed, as the
  // Before/After's divider does with the hand's; at rest the outline is the slide.
  const slideWidth = useMotionValue(0);
  const slideHeight = useMotionValue(0);
  const bend = useMotionValue(0);
  const outline = useTransform(() => {
    const width = slideWidth.get();
    const height = slideHeight.get();
    const path = slidePath(width, height, bend.get());
    return width ? `path("${path}")` : 'none';
  });
  const count = images.length;
  // One image has nowhere to go, and Autoplay throws when asked to play it.
  const plays = autoPlay && count > 1;
  // A slideshow that plays itself goes round; one the reader drives stops at its ends.
  const loop = plays;
  const playing = plays && playback.playing && inView;

  // Autoplay jumps, and the image it leaves fades out on top: a cross-fade when it
  // plays by itself, while a drag, a key or a button still slides the track.
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
    const onSelect = () => setSelected(api.selectedScrollSnap());
    // The fill restarts with Embla's own timer, so the two never drift after a pause.
    const onTimerSet = () => setTimer((previous) => (previous ?? 0) + 1);
    const onTimerStopped = () => setTimer(null);
    onSelect();
    api
      .on('select', onSelect)
      .on('autoplay:timerset', onTimerSet)
      .on('autoplay:timerstopped', onTimerStopped)
      .on('autoplay:select', leave);
    return () => {
      api
        .off('select', onSelect)
        .off('autoplay:timerset', onTimerSet)
        .off('autoplay:timerstopped', onTimerStopped)
        .off('autoplay:select', leave);
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

  const go = (index: number) => {
    if (!api) return false;
    const target = loop ? (index + count) % count : Math.min(Math.max(index, 0), count - 1);
    if (target === api.selectedScrollSnap()) return false;
    setLeaving(null);
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
    if (!api) return;
    // Embla's own speed, which an instant jump leaves at zero, so autoplay's
    // cross-fade never bends; read off its engine, as its tween examples do.
    const onScroll = () => bend.set(reduced ? 0 : bendFor(api.internalEngine().scrollBody.velocity()));
    const onSettle = () => bend.set(0);
    api.on('scroll', onScroll).on('settle', onSettle);
    return () => {
      api.off('scroll', onScroll).off('settle', onSettle);
    };
  }, [api, bend, reduced]);

  useEffect(() => {
    const root = rootRef.current!;
    const measure = () => {
      slideWidth.set(root.clientWidth);
      slideHeight.set(root.clientHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [slideWidth, slideHeight]);

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
        'overflow-hidden rounded-frame-xl border-2 border-border bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        className
      )}
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
        onPointerDown={() => {
          playback.pause();
          setLeaving(null);
        }}
      >
        {images.map((src, index) => (
          <CarouselItem
            key={`${index}-${src}`}
            aria-label={`${index + 1} of ${count}`}
            inert={index !== selected}
            className="pl-0"
            style={{ aspectRatio: `${width} / ${height}` }}
          >
            <motion.div className="relative size-full" style={{ clipPath: outline }}>
              <NextImage
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes={SIZES}
                draggable={false}
                // Once on screen the neighbours load ahead, so a drag never reveals a blank slide.
                loading={inView && (Math.abs(index - selected) <= 1 || (loop && index === count - 1)) ? 'eager' : 'lazy'}
                className="pointer-events-none absolute inset-y-0 h-full max-w-none object-cover select-none"
                // It bleeds past the slide to fill the seam's bulge.
                style={{ left: -MAX_BEND, width: `calc(100% + ${2 * MAX_BEND}px)` }}
              />
            </motion.div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {leaving !== null && (
        <motion.div
          key={leaving}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          onAnimationComplete={() => setLeaving(null)}
        >
          <NextImage
            src={images[leaving]}
            alt=""
            width={width}
            height={height}
            sizes={SIZES}
            draggable={false}
            className="size-full object-cover select-none"
          />
        </motion.div>
      )}
      {count > 1 && (
        <Controls
          count={count}
          selected={selected}
          loop={loop}
          onGo={go}
          playback={plays ? { playing: playback.playing, onToggle: playback.toggle } : undefined}
          timer={timer}
          interval={interval}
        />
      )}
    </Carousel>
  );
}
