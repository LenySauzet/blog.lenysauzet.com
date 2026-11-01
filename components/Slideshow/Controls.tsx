import { ArrowLeft01Icon, ArrowRight01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'motion/react';

import { glassSurface } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

import { isEdge, stepWindow } from './steps';

const BUTTON = cn(
  glassSurface,
  'grid size-8 cursor-pointer place-items-center rounded-full text-foreground [transition:scale_.2s] enabled:hover:scale-105 enabled:active:scale-[0.97] disabled:cursor-default disabled:[&_svg]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:enabled:hover:scale-100 motion-reduce:enabled:active:scale-100'
);
const EASE = 'cubic-bezier(0.215,0.61,0.355,1)';

export interface ControlsProps {
  count: number;
  selected: number;
  loop: boolean;
  onGo: (index: number) => void;
  /** Present only for a slideshow that plays itself. */
  playback?: { playing: boolean; onToggle: () => void };
  /** Bumped each time the autoplay timer starts; null while it is stopped. */
  timer: number | null;
  interval: number;
  className?: string;
}

export function Controls({ count, selected, loop, onGo, playback, timer, interval, className }: ControlsProps) {
  const shown = stepWindow(count, selected);

  // The buttons stay out of the tab order: the slideshow takes the arrows itself,
  // and only the pause button, which a reader must be able to reach, is a stop.
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2', className)}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Previous image"
        disabled={!loop && selected === 0}
        onClick={() => onGo(selected - 1)}
        className={cn(BUTTON, 'pointer-events-auto')}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
      </button>
      <div className={cn(glassSurface, 'pointer-events-auto flex h-8 items-center rounded-full px-1.5')}>
        {Array.from({ length: count }, (_, index) => {
          const active = index === selected;
          const filling = active && timer !== null;
          return (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              aria-label={`Image ${index + 1}`}
              aria-current={active || undefined}
              onClick={() => onGo(index)}
              className={cn(
                'flex h-full cursor-pointer items-center justify-center motion-reduce:transition-none',
                active ? 'w-8' : 'w-5',
                (index < shown.start || index >= shown.end) && 'hidden'
              )}
              style={{ transition: `width .5s ${EASE}` }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'relative h-2 w-full overflow-hidden rounded-full motion-reduce:transition-none',
                  active ? (filling ? 'bg-foreground/30' : 'bg-foreground') : 'mx-1.5 bg-foreground/30',
                  isEdge(index, count, shown) && 'scale-65'
                )}
                style={{ transition: `background-color .5s ${EASE}, scale .5s ${EASE}` }}
              >
                {filling && (
                  <motion.span
                    key={timer}
                    className="absolute inset-0 bg-foreground"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: interval / 1000, ease: 'linear' }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Next image"
        disabled={!loop && selected === count - 1}
        onClick={() => onGo(selected + 1)}
        className={cn(BUTTON, 'pointer-events-auto')}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
      </button>
      {playback && (
        <button
          type="button"
          aria-label={playback.playing ? 'Pause slideshow' : 'Play slideshow'}
          onClick={playback.onToggle}
          className={cn(BUTTON, 'pointer-events-auto')}
        >
          <HugeiconsIcon icon={playback.playing ? PauseIcon : PlayIcon} size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
