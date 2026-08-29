import ScrollFade from '@/components/ScrollFade';

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // clip x so corner badges that overflow their callout can never scroll the page
  return (
    <div data-scroll-root className="h-full overflow-x-hidden overflow-y-auto pb-32">
      {children}
      {/* Bottom only. A matching band at the top washed over the head of any
          media it covered, and the reference does not have one either. The
          `position` prop is kept, and tested, if it is ever wanted back. */}
      <ScrollFade />
    </div>
  );
}
