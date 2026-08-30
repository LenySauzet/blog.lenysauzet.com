import { describe, expect, it } from 'vitest';

import { toPlainText } from './plain-text';

describe('toPlainText', () => {
  it('drops the export frontmatter without taking the post with it', () => {
    const text = toPlainText(
      [
        'export const metadata = {',
        "  title: 'Shades of Halftone',",
        "  tags: ['glsl'],",
        '};',
        '',
        'The dots are the point.',
      ].join('\n')
    );

    expect(text).toBe('The dots are the point.');
  });

  // A search for "const" should not surface every post carrying a code block.
  it('drops fenced code and display math', () => {
    const text = toPlainText(
      ['Before.', '```glsl', 'const float PI = 3.14;', '```', '$$x = 1$$', 'After.'].join(
        '\n'
      )
    );

    expect(text).toBe('Before. After.');
  });

  it('keeps what a component wraps, and nothing of the component', () => {
    const text = toPlainText('<Callout type="info">Watch the grid.</Callout>');

    expect(text).toBe('Watch the grid.');
  });

  it('drops a self-closing component even when its props run over lines', () => {
    const text = toPlainText(
      ['Above.', '<VideoPlayer', '  src="a.mp4"', '  autoPlay', '/>', 'Below.'].join('\n')
    );

    expect(text).toBe('Above. Below.');
  });

  // The link text is prose and the URL is not, so one stays and the other goes.
  it('unwraps links and drops images', () => {
    const text = toPlainText(
      'See [Paper](https://paper.design/).\n\n![A diagram](blog/halftone.png)'
    );

    expect(text).toBe('See Paper.');
  });

  it('leaves the words of a heading, a quote and a list', () => {
    const text = toPlainText(
      ['## Behind the Dot', '> A quote.', '- First', '1. Second'].join('\n')
    );

    expect(text).toBe('Behind the Dot A quote. First Second');
  });

  it('strips emphasis without splitting the word it marks', () => {
    expect(toPlainText('a **bold** and _quiet_ `call`')).toBe(
      'a bold and quiet call'
    );
  });
});
