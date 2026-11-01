import { ArrowLeft01Icon, ArrowRight01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

import { isEdge, stepWindow } from './steps';

// The page's own control surface, the Select trigger's: the row sits under the
// images, on the page, so it follows the theme.
const SURFACE = 'border border-muted-foreground/5 bg-wash/30';
const BUTTON = cn(
  SURFACE,
  'grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-foreground [transition:scale_.2s,background-color_.25s] enabled:hover:scale-105 enabled:hover:bg-wash/(--wash-lift) enabled:active:scale-[0.97] disabled:cursor-default disabled:[&_svg]:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:enabled:hover:scale-100 motion-reduce:enabled:active:scale-100'
);

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
    <div className={cn('flex justify-center gap-1', className)}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Previous image"
        disabled={!loop && selected === 0}
        onClick={() => onGo(selected - 1)}
        className={BUTTON}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
      </button>
      {/* Each step is a box padded around its dot, so the pill's inset is the same at
          either end whatever is active. */}
      <div className={cn(SURFACE, 'flex rounded-full p-1')}>
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
                'grid h-6 cursor-pointer place-items-center p-2 [transition:width_.5s_cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none',
                active ? 'w-10' : 'w-6',
                (index < shown.start || index >= shown.end) && 'hidden'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'relative h-2 w-full overflow-hidden rounded-full [transition:background-color_.5s_cubic-bezier(0.215,0.61,0.355,1),scale_.5s_cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none',
                  active && !filling ? 'bg-foreground' : 'bg-foreground/30',
                  isEdge(index, count, shown) && 'scale-65'
                )}
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
        className={BUTTON}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
      </button>
      {playback && (
        <button
          type="button"
          aria-label={playback.playing ? 'Pause slideshow' : 'Play slideshow'}
          onClick={playback.onToggle}
          className={BUTTON}
        >
          <HugeiconsIcon icon={playback.playing ? PauseIcon : PlayIcon} size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
