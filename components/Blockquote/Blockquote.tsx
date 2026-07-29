import type { ReactNode } from 'react';

interface BlockquoteProps {
  children?: ReactNode;
}

// A centred pull-quote, not a left-border aside. `font-display`, not our serif:
// the ported design's own `var(--font-serif)` is undefined and falls through to
// its default sans, so the sans is the faithful match. The `[&>p]:` overrides
// exist because the inner <p> is the globally MDX-mapped paragraph.
export default function Blockquote({ children }: BlockquoteProps) {
  return (
    <blockquote className="my-8 w-full text-center">
      <div className="mx-auto w-full max-w-[1020px] px-2 [&>p]:my-0 [&>p]:font-display [&>p]:text-[clamp(1.5rem,4vw,2rem)] [&>p]:leading-[1.68] [&>p]:font-normal [&>p]:text-foreground [&>p]:italic">
        {children}
      </div>
    </blockquote>
  );
}
