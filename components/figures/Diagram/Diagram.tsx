import type { ReactNode } from 'react';

import { EASED, blurRamp } from '@/components/ScrollFade/gradients';

export const MEASURE = 672;
export const FADE_HOLD = 94;

export interface DiagramProps {
  height: number;
  title: string;
  children: ReactNode;
}

const FADE = ['to right', 'to left', 'to bottom', 'to top']
  .map((direction) => blurRamp(direction, FADE_HOLD, EASED))
  .join(', ');

export default function Diagram({
  height,
  title,
  children,
}: DiagramProps) {
  return (
    <div className="@container">
      <svg
        viewBox={`0 0 ${MEASURE} ${height}`}
        role="img"
        aria-label={title}
        style={{ maskImage: FADE, maskComposite: 'intersect' }}
        className="h-auto w-full font-mono text-[13px] @max-lg:text-[16px] @max-md:text-[20px] [&_*]:[vector-effect:non-scaling-stroke]"
      >
        {children}
      </svg>
    </div>
  );
}
