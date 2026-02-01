import DarkVeil from '@/components/DarkVeil';
import { Globe02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const Header = () => {
  return (
    <header className="h-screen w-full">
      <div className="h-[300px] w-full absolute bottom-0 left-0 bg-linear-to-t from-background to-transparent" />
      <div className="absolute h-full w-full top-0 left-0 -z-10">
        <DarkVeil hueShift={30} />
      </div>
      <span className="badge-border badge-background text-white my-4 px-4 py-1 rounded-lg flex items-center gap-2 mx-auto w-fit">
        <HugeiconsIcon icon={Globe02Icon} className="w-4 h-4" />
        Personal Blog
      </span>
      <h1 className="text-lg md:text-2xl font-signature text-white select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        LenySauzet
      </h1>
    </header>
  );
};

export default Header;
