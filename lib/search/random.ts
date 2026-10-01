export function pickAnother(slugs: string[], current?: string): string | undefined {
  const elsewhere = slugs.filter((slug) => slug !== current);
  if (!elsewhere.length) return undefined;

  return elsewhere[Math.floor(Math.random() * elsewhere.length)];
}
