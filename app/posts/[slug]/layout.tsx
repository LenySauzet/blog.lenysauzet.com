import GradualBlur from '@/components/GradualBlur';

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // clip x so corner badges that overflow their callout can never scroll the page
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto pb-32">
      {children}
      {/* On trial. Dissolves the article into the bottom of the viewport as it
          scrolls. Fixed rather than absolute, because this div is the scroll
          container and the body does not scroll; an absolute band would ride
          away with the text. Remove this element and the import to drop it. */}
      <GradualBlur preset="page-footer" />
    </div>
  );
}
