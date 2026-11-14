'use client';

import { motion, MotionConfig, useInView } from 'motion/react';
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';

import { ZOOM_TRANSITION } from '@/components/Lightbox';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useLightboxStore } from '@/hooks/use-lightbox-store';
import { usePlayback } from '@/hooks/use-playback';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

import { MAX_BEND } from './bend';
import { Controls } from './Controls';
import { registerSlideshow, type SlideshowKey } from './keyboard';
import { Lift, useLift } from './Lift';
import { Picture } from './Picture';
import { isNear, stepTarget } from './steps';
import { useAutoplay } from './use-autoplay';
import { useTrackMotion } from './use-track-motion';

const SLIDE_SIZES = '(max-width: 768px) calc(100vw - 2rem), 672px';
const BLEED = `${MAX_BEND}px`;

export interface SlideshowImage {
  src: string;
  /** Empty leaves it to the caption. */
  alt: string;
}

export interface SlideshowCarouselProps {
  /** Fully resolved URLs. */
  images: SlideshowImage[];
  width: number;
  height: number;
  alt: string;
  autoPlay: boolean;
  /** Milliseconds. */
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
  const [announced, setAnnounced] = useState<number | null>(null);
  const byReader = useRef(false);
  const reduced = usePrefersReducedMotion();
  const playback = usePlayback();
  const inView = useInView(rootRef);
  const covered = useLightboxStore((state) => state.open > 0);
  const lift = useLift(rootRef);

  const count = images.length;
  const navigable = count > 1;
  // Autoplay throws when asked to play a single image.
  const plays = autoPlay && navigable;
  const loop = plays;
  const playing = plays && playback.playing && inView && !covered;

  const autoplay = useAutoplay(api, { plays, playing, interval, reduced });
  const track = useTrackMotion(api, rootRef, reduced);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setSelected(index);
      setAnnounced(byReader.current ? index : null);
      byReader.current = false;
    };
    // Embla raises this after any select the press made, and a tap selects nothing.
    const onRelease = () => {
      byReader.current = false;
    };
    onSelect();
    api.on('select', onSelect).on('pointerUp', onRelease);
    return () => {
      api.off('select', onSelect).off('pointerUp', onRelease);
    };
  }, [api]);

  const go = (index: number) => {
    if (!api || lift.lifted) return false;
    const target = stepTarget(index, count, loop);
    if (target === api.selectedScrollSnap()) return false;
    byReader.current = true;
    autoplay.clearLeaving();
    api.scrollTo(target, reduced);
    api.plugins().autoplay?.reset();
    return true;
  };

  const enlarge = () => {
    playback.pause();
    lift.open();
  };

  const handle = useEffectEvent((key: SlideshowKey) => {
    if (lift.lifted) return false;
    if (key === 'toggle') {
      if (!plays) return false;
      playback.toggle();
      return true;
    }
    if (key === 'open') {
      enlarge();
      return true;
    }
    const moved = go({ previous: selected - 1, next: selected + 1, first: 0, last: count - 1 }[key]);
    if (moved) playback.pause();
    return moved;
  });

  useEffect(() => registerSlideshow(rootRef.current!, (key) => handle(key), navigable), [navigable]);

  return (
    <MotionConfig reducedMotion="user" transition={ZOOM_TRANSITION}>
      <div className={cn('relative', className)}>
        <Carousel
          ref={rootRef}
          setApi={setApi}
          plugins={autoplay.plugins}
          opts={{ loop }}
          tabIndex={0}
          aria-label={alt}
          aria-describedby={`${id}-keys`}
          data-slideshow=""
          onFocus={(event) => {
            if (event.target.matches(':focus-visible')) playback.pause();
          }}
          className="overflow-hidden rounded-frame-xl border-2 border-border bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <p id={`${id}-keys`} className="sr-only">
            {navigable
              ? `Use the Left and Right arrow keys to change images, and Enter to enlarge one${plays ? ', and Space to pause or play' : ''}.`
              : 'Press Enter to enlarge the image.'}
          </p>
          {navigable && (
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {announced !== null && `Image ${announced + 1} of ${count}.`}
            </p>
          )}
          <CarouselContent
            className={cn('ml-0', navigable && 'cursor-grab active:cursor-grabbing')}
            onPointerDown={() => {
              byReader.current = true;
              playback.pause();
              autoplay.clearLeaving();
            }}
          >
            {images.map(({ src, alt: shows }, index) => (
              <CarouselItem
                key={`${index}-${src}`}
                aria-label={`${index + 1} of ${count}`}
                inert={index !== selected}
                className="pl-0"
                style={{ aspectRatio: `${width} / ${height}` }}
              >
                <motion.div
                  className={cn(
                    'relative size-full',
                    index === selected && 'cursor-zoom-in active:cursor-grabbing',
                    index === selected && lift.lifted && 'invisible'
                  )}
                  style={{ clipPath: track.outline }}
                  // Embla swallows the click that ends a drag, so this is a click alone.
                  onClick={index === selected ? enlarge : undefined}
                >
                  <Picture
                    ref={track.layer(index)}
                    src={src}
                    alt={shows}
                    width={width}
                    height={height}
                    sizes={SLIDE_SIZES}
                    bleed={BLEED}
                    // Neighbours load ahead, or a drag reveals a blank slide.
                    loading={inView && isNear(index, selected, count, loop) ? 'eager' : 'lazy'}
                  />
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {autoplay.leaving !== null && (
            <motion.div
              key={autoplay.leaving}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
              onAnimationComplete={autoplay.clearLeaving}
            >
              <Picture
                src={images[autoplay.leaving].src}
                width={width}
                height={height}
                sizes={SLIDE_SIZES}
                bleed={BLEED}
                loading="eager"
              />
            </motion.div>
          )}
          {navigable && (
            <Controls
              count={count}
              selected={selected}
              loop={loop}
              onGo={go}
              playback={plays ? { playing: playback.playing, onToggle: playback.toggle } : undefined}
              timer={autoplay.timer}
              interval={interval}
            />
          )}
        </Carousel>
        <Lift
          lift={lift}
          id={`slideshow-lift-${id}`}
          src={images[selected].src}
          alt={images[selected].alt || alt}
          width={width}
          height={height}
          preload={inView}
        />
      </div>
    </MotionConfig>
  );
}
