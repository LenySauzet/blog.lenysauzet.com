import { ReadingRail } from './_components/ReadingRail';
import ScrollFade from './_components/ScrollFade';

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // Clips x, or a callout's overflowing corner badge scrolls the page.
  return (
    <div data-scroll-root className="h-full overflow-x-hidden overflow-y-auto pb-32">
      {children}
      <ScrollFade />
      <ReadingRail />
    </div>
  );
}
