export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto pb-32">{children}</div>;
}
