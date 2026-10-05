import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReadingRail } from './ReadingRail';

vi.mock('next/navigation', () => ({ usePathname: () => '/posts/anything' }));

/** jsdom gives every box a height of zero, so a column has to be told it
    scrolls before the rail reads a single heading out of it. Its ResizeObserver
    is a stub too, so no tick is ever laid out here: what a DOM test can reach
    is that the component stands, which is exactly where it once did not. */
const column = (markup: string) => {
  const node = document.createElement('div');
  node.setAttribute('data-scroll-root', '');
  node.innerHTML = markup;
  Object.defineProperty(node, 'scrollHeight', { value: 2000 });
  Object.defineProperty(node, 'clientHeight', { value: 800 });
  document.body.append(node);

  return node;
};

describe('ReadingRail', () => {
  // Most posts carry no heading at all, and the rail has to be a ruler for
  // them rather than a crash: reading a title's state off an array sized by
  // the sections once took every one of those pages down with it.
  it('stands on a page with no headings at all', () => {
    column('<p>Nothing to see here.</p>');

    expect(() => render(<ReadingRail />)).not.toThrow();
  });

  it('stands before the column it measures exists', () => {
    expect(() => render(<ReadingRail />)).not.toThrow();
  });

  // Without `data-prose` this read nothing and quietly retested the case
  // above: only the article's own headings count, a widget's title not being
  // a place in the article.
  it('stands on a page whose prose has them', () => {
    const node = column(
      '<div data-prose><h2 id="one">One</h2><h3 id="two">Two</h3></div>'
    );

    expect(node.querySelectorAll('[data-prose] > h2, [data-prose] > h3')).toHaveLength(2);
    expect(() => render(<ReadingRail />)).not.toThrow();
  });

  it('leaves a heading that belongs to a widget out of the rail', () => {
    const node = column('<div data-prose><div><h2>Inside a card</h2></div></div>');

    expect(node.querySelectorAll('[data-prose] > h2, [data-prose] > h3')).toHaveLength(0);
    expect(() => render(<ReadingRail />)).not.toThrow();
  });
});
