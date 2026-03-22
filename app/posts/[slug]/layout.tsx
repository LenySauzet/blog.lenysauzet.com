export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full overflow-y-auto pb-32 pt-28 sm:pt-64">
      {children}
    </div>
  );
}
