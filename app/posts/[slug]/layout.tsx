export default function MdxLayout({ children }: { children: React.ReactNode }) {
  // clip x so corner badges that overflow their callout can never scroll the page
  return (
    <div className="h-full overflow-x-hidden overflow-y-auto pb-32">
      {children}
    </div>
  );
}
