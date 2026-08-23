import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PostsList } from './PostsList';

const post = (slug: string, date: string) => ({
  slug,
  metadata: { title: slug, date },
});

const groups = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-year]')];

describe('PostsList', () => {
  it('groups posts under the year they were written, newest first', () => {
    const { container } = render(
      <PostsList
        posts={[
          post('newest', '2026-04-22'),
          post('also-2026', '2026-01-30'),
          post('older', '2024-02-02'),
        ]}
      />
    );

    expect(groups(container).map((g) => g.getAttribute('data-year'))).toEqual([
      '2026',
      '2024',
    ]);
    expect(groups(container).map((g) => g.querySelectorAll('a').length)).toEqual([
      2, 1,
    ]);
  });

  // `data-year` is what the dim keys on: hovering one group fades the others through
  // a `:has()` rule, so the attribute is load-bearing rather than descriptive. The
  // fade itself is CSS on a pointer that jsdom has not got, and is checked in a
  // browser.
  it('marks every group so the others can be dimmed around it', () => {
    const { container } = render(
      <PostsList posts={[post('one', '2026-04-22'), post('two', '2025-02-02')]} />
    );

    expect(groups(container)).toHaveLength(2);
  });
});
