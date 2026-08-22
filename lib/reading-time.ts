import fs from 'fs/promises';
import path from 'path';

const WORDS_PER_MINUTE = 200;

/** Code counts towards the total: skimming a listing still takes time. */
export function readingTime(source: string): number {
  const words = source
    .replace(/export const metadata[\s\S]*?\n};?\n/, '')
    .replace(/^import .*$/gm, '')
    .replace(/```\w*/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]*\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export async function readingTimeOf(slug: string): Promise<number> {
  const file = path.join(process.cwd(), 'content', `${slug}.mdx`);
  return readingTime(await fs.readFile(file, 'utf8'));
}
