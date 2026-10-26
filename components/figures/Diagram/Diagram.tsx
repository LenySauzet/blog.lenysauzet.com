import type { ReactNode } from 'react';

import { EASED, blurRamp } from '@/components/ScrollFade/gradients';

export interface DiagramProps {
  width: number;
  height: number;
  title: string;
  children: ReactNode;
}

const FADE = ['to right', 'to left', 'to bottom', 'to top']
  .map((direction) => blurRamp(direction, 94, EASED))
  .join(', ');

export default function Diagram({
  width,
  height,
  title,
  children,
}: DiagramProps) {
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        style={{ maskImage: FADE, maskComposite: 'intersect', minWidth: width }}
        className="h-auto w-full font-mono text-[13px] [&_*]:[vector-effect:non-scaling-stroke]"
      >
        {children}
      </svg>
    </div>
  );
}
