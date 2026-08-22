import { Backdrop } from '@/components/Backdrop';
import { halftone } from '@/components/Backdrop/visuals/halftone';
import Logo from '@/components/Logo';

export function IndexSection() {
  return (
    <div className="relative hidden overflow-hidden p-4 lg:block">
      <Backdrop visual={halftone} />

      {/* Sibling of the canvas, so swapping the visual leaves the framing alone. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 110% at 100% 100%, var(--background) 18%, oklch(from var(--background) l c h / 0.7) 45%, transparent 78%)',
        }}
      />

      <div className="absolute bottom-10 left-10 w-[400px]">
        <Logo className="mb-6 h-8 w-8 text-foreground" />
        <h1 className="font-serif text-5xl italic leading-tight tracking-tight">
          Essays &amp; Experiments at the frontier of the web
        </h1>
      </div>
    </div>
  );
}
