import { describe, expect, it } from 'vitest';

import { readingTime } from './reading-time';

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('readingTime', () => {
  it('counts prose at two hundred words a minute', () => {
    expect(readingTime(words(400))).toBe(2);
    expect(readingTime(words(1000))).toBe(5);
  });

  it('never reports less than a minute', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime('a handful of words')).toBe(1);
  });

  it('ignores the frontmatter export', () => {
    const source = `export const metadata = {
  title: 'A title long enough to matter',
  description: 'A description with a great many words in it indeed',
  tags: ['webgl'],
  date: '2026-01-01',
};

${words(400)}`;
    expect(readingTime(source)).toBe(2);
  });

  // Component names and props are markup, not reading.
  it('reads the text inside a component, not its tags', () => {
    const source = `<Callout variant="info" className="my-6">${words(400)}</Callout>`;
    expect(readingTime(source)).toBe(2);
  });

  it('ignores imports, URLs and math', () => {
    const source = `import Thing from '@/components/Thing';

$$\\sqrt{\\dfrac{a}{b}} + \\sum_{i=0}^{n} x_i$$

See https://example.com/a/very/long/path/that/is/not/read

${words(400)}`;
    expect(readingTime(source)).toBe(2);
  });

  it('counts code, which still takes time to skim', () => {
    const source = `${words(200)}

\`\`\`ts
${words(200)}
\`\`\``;
    expect(readingTime(source)).toBe(2);
  });
});
