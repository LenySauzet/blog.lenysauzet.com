import type { ReactNode } from 'react';

interface BlockquoteProps {
  children?: ReactNode;
}

export default function Blockquote({ children }: BlockquoteProps) {
  return (
    <blockquote className="my-8 w-full text-center">
      <div className="mx-auto w-full max-w-[1020px] px-2 [&>p]:my-0 [&>p]:font-serif [&>p]:text-[clamp(1.5rem,4vw,2rem)] [&>p]:leading-[1.68] [&>p]:font-normal [&>p]:text-foreground [&>p]:italic">
        {children}
      </div>
    </blockquote>
  );
}
