import type { CSSProperties, ReactNode } from 'react';

import { EASED, blurRamp } from '@/components/ScrollFade/gradients';
import { cn } from '@/lib/utils';

export const MEASURE = 672;
export const FADE_HOLD = 94;
export const LARGEST_TYPE = 20;

export interface DiagramProps {
  height: number;
  title: string;
  className?: string;
  children: ReactNode;
}

const FADE = ['to right', 'to left', 'to bottom', 'to top']
  .map((direction) => blurRamp(direction, FADE_HOLD, EASED))
  .join(', ');

export default function Diagram({
  height,
  title,
  className,
  children,
}: DiagramProps) {
  return (
    <div className="@container">
      <svg
        viewBox={`0 0 ${MEASURE} ${height}`}
        role="img"
        aria-label={title}
        style={
          {
            maskImage: FADE,
            maskComposite: 'intersect',
            '--largest-type': `${LARGEST_TYPE}px`,
          } as CSSProperties
        }
        className={cn(
          'h-auto w-full font-mono text-[13px] @max-lg:text-[16px] @max-md:text-(length:--largest-type) [&_*]:[vector-effect:non-scaling-stroke]',
          className,
        )}
      >
        {children}
      </svg>
    </div>
  );
}
