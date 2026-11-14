import { cn } from '@/lib/utils';

// A mask over a flat fill, never a colour gradient, which bands into visible steps.
const FADE = '[mask-image:linear-gradient(to_top,black,transparent)]';

// Fixed, as the body does not scroll; `z-40` keeps it under the island and the Lightbox.
export default function ScrollFade() {
  return (
    <div
      data-slot="scroll-fade"
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24"
    >
      <div className={cn('absolute inset-0 backdrop-blur-[4px]', FADE)} />
      <div className={cn('absolute inset-0 bg-background', FADE)} />
    </div>
  );
}
