import { ReadingRail } from './_components/ReadingRail';
import ScrollFade from './_components/ScrollFade';

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // `clip`, not `hidden`, which would make this a scroll container in place of the page.
  return (
    <div className="overflow-x-clip pb-32">
      {children}
      <ScrollFade />
      <ReadingRail />
    </div>
  );
}
