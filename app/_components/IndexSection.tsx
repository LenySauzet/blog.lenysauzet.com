import { Backdrop } from '@/components/Backdrop';
import { halftone } from '@/components/Backdrop/visuals/halftone';
import Logo from '@/components/Logo';

export function IndexSection() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <Backdrop visual={halftone} />

      <div className="absolute bottom-10 left-10 w-[400px]">
        <Logo className="mb-8 h-14 w-14 text-foreground" />
        <h1 className="font-serif text-5xl italic leading-tight tracking-tight">
          Essays &amp; Experiments at the frontier of the web
        </h1>
      </div>
    </div>
  );
}
