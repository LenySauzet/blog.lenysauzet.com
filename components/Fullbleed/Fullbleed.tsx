import type { CSSProperties, ReactNode } from 'react';

export interface FullbleedProps {
  children: ReactNode;
  /** Inner width as a percentage of the viewport on desktop. */
  widthPercent?: number;
  /** Cap on the inner width, in px. */
  maxWidth?: number;
}

// The outer box spans 100vw through viewport-centred negative margins, which
// re-centre it regardless of the narrower parent; the inner box then caps the
// content. The post's own overflow-x:hidden clips the span, so no scrollbar.
export default function Fullbleed({
  children,
  widthPercent = 80,
  maxWidth = 1000,
}: FullbleedProps) {
  return (
    <div className="relative left-1/2 w-screen -mx-[50vw] max-md:left-0 max-md:mx-0 max-md:w-full">
      <div
        className="mx-auto w-[var(--fb-width)] max-w-[var(--fb-max-width)] min-w-[700px] max-md:!w-full max-md:!min-w-0 max-md:!max-w-full"
        style={
          {
            '--fb-width': `${widthPercent}%`,
            '--fb-max-width': `${maxWidth}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
