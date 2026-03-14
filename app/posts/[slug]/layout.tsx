export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto py-16">{children}</div>;
}
