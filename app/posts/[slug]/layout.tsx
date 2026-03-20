export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto py-6 pt-64">{children}</div>;
}
