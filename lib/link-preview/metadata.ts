import type { LinkMetadata } from './types';

const META = /<meta\s+[^>]*>/gi;
const ATTRIBUTE = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');

const NAME = ATTRIBUTE('(?:property|name|itemprop)');
const CONTENT = ATTRIBUTE('content');
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
};

const decode = (value: string) =>
  value
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code: string) => {
      const named = ENTITIES[code.toLowerCase()];
      if (named) return named;

      const point = code.startsWith('#x')
        ? Number.parseInt(code.slice(2), 16)
        : code.startsWith('#')
          ? Number.parseInt(code.slice(1), 10)
          : NaN;

      return Number.isFinite(point) ? String.fromCodePoint(point) : whole;
    })
    .replace(/\s+/g, ' ')
    .trim();

const valueOf = (match: RegExpMatchArray | null) =>
  match ? (match[2] ?? match[3] ?? match[4] ?? '') : undefined;

/** Read against the markup: a parser pulled in to read four tags would weigh
    more than everything it reads. */
export function readMetadata(html: string, base: string): LinkMetadata {
  const tags = new Map<string, string>();

  for (const tag of html.matchAll(META)) {
    const name = valueOf(tag[0].match(NAME))?.toLowerCase();
    const content = valueOf(tag[0].match(CONTENT));

    if (name && content && !tags.has(name)) tags.set(name, decode(content));
  }

  const first = (...names: string[]) =>
    names.map((name) => tags.get(name)).find(Boolean) || undefined;

  const image = first('og:image:secure_url', 'og:image', 'twitter:image');
  const titled = html.match(TITLE)?.[1];

  return {
    title: first('og:title', 'twitter:title') ?? (titled ? decode(titled) : undefined),
    description: first('og:description', 'twitter:description', 'description'),
    image: image && URL.canParse(image, base) ? new URL(image, base).href : undefined,
    site: first('og:site_name'),
  };
}
