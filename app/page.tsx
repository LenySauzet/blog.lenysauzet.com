import DarkVeil from '@/components/DarkVeil';
import { Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-full w-full">
      <div className="absolute h-full w-full top-0 left-0 -z-10">
        <DarkVeil hueShift={30} />
      </div>
      <span className="badge-border badge-background text-white my-4 px-4 py-1 rounded-lg flex items-center gap-2 mx-auto w-fit">
        <Globe className="w-4 h-4" />
        Personal blog
      </span>
      <h1 className="text-lg md:text-2xl font-signature text-white select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        LenySauzet
      </h1>
    </div>
  );
}
