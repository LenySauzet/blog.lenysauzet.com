import { cn } from '@/lib/utils';

import { blurRamp } from './gradients';

export interface ScrollFadeProps {
  position?: 'top' | 'bottom';
  height?: string;
  blur?: string;
}

// Fixed, as the body does not scroll; `z-40` keeps it under the Dock and the Lightbox.
export default function ScrollFade({
  position = 'bottom',
  height = '6rem',
  blur = '4px',
}: ScrollFadeProps) {
  const direction = position === 'top' ? 'to bottom' : 'to top';
  const mask = blurRamp(direction);

  return (
    <div
      data-slot="scroll-fade"
      data-position={position}
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 z-40',
        position === 'top' ? 'top-0' : 'bottom-0'
      )}
      style={{ height }}
    >
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${blur})`,
          WebkitBackdropFilter: `blur(${blur})`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <div
        className="absolute inset-0 bg-background"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
    </div>
  );
}
