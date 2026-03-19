import Logo from '@/components/Logo';
import { Separator } from '@/components/ui/separator';

const Dock = () => {
  return (
    <div className="text-white flex items-center gap-4">
      <Logo className="w-5 h-5" />
      <Separator orientation="vertical" className="bg-muted" />
      <p>Index</p>
    </div>
  );
};

export default Dock;
