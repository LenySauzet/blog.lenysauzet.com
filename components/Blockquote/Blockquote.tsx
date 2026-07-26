import type { ReactNode } from 'react';

interface BlockquoteProps {
  children?: ReactNode;
}

// Ported from Maxime Heckel's Blockquote: a centred pull-quote, larger and
// brighter than the muted body. Maxime's `var(--font-serif)` is an undefined
// token, so his renders in the default sans (Inter) italic — the display sans
// (Geist) matches that. The inner <p> is the MDX-mapped paragraph, so its type
// (font, size, colour) is overridden here rather than at the global mapping.
// Fluid 24→32px so it never overflows a narrow screen (Maxime uses a JS --vw
// helper for the same intent; a clamp needs no client code).
export default function Blockquote({ children }: BlockquoteProps) {
  return (
    <blockquote className="my-8 w-full text-center">
      <div className="mx-auto w-full max-w-[1020px] px-2 [&>p]:my-0 [&>p]:font-display [&>p]:text-[clamp(1.5rem,4vw,2rem)] [&>p]:leading-[1.68] [&>p]:font-normal [&>p]:text-foreground [&>p]:italic">
        {children}
      </div>
    </blockquote>
  );
}
