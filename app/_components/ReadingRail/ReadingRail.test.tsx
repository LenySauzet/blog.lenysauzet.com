import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReadingRail } from './ReadingRail';

vi.mock('next/navigation', () => ({ usePathname: () => '/posts/anything' }));

const column = (markup: string) => {
  const node = document.createElement('div');
  node.setAttribute('data-scroll-root', '');
  node.innerHTML = markup;
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

  it('stands on a page that has them', () => {
    column('<h2 id="one">One</h2><h3 id="two">Two</h3>');

    expect(() => render(<ReadingRail />)).not.toThrow();
  });
});
