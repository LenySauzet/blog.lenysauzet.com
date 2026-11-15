import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetPageScroll, scrollPage } from '@/test/scroll';

import { ReadingRail } from './ReadingRail';

vi.mock('next/navigation', () => ({ usePathname: () => '/posts/anything' }));

const column = (markup: string) => {
  const node = document.createElement('div');
  node.innerHTML = markup;
  document.body.append(node);
  scrollPage(0, 2000, 800);

  return node;
};

afterEach(resetPageScroll);

describe('ReadingRail', () => {
  it('stands on a page with no headings at all', () => {
    column('<p>Nothing to see here.</p>');

    expect(() => render(<ReadingRail />)).not.toThrow();
  });

  it('stands on a page too short to scroll', () => {
    expect(() => render(<ReadingRail />)).not.toThrow();
  });

  // Without `data-prose` this reads nothing and quietly retests the case above.
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
