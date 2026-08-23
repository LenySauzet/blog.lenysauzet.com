import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UpdatedBadge } from './UpdatedBadge';

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/**
 * `vitest-setup` forces reduced motion, which here only collapses the timing: the
 * markup is the same either way, deliberately, since branching it on a preference the
 * server cannot see is a hydration mismatch. The sweep itself is checked in a browser.
 */
describe('UpdatedBadge', () => {
  // The whole point of the component. Posts are static, so the label the build wrote
  // is only true the day it shipped; left alone it would still say "3 days ago" a
  // year later.
  it('reads the clock rather than the label the build baked in', () => {
    render(<UpdatedBadge date={daysAgo(3)} label="7 months ago" />);

    expect(screen.getByText(/Updated 3 days ago/)).toBeInTheDocument();
    expect(screen.queryByText(/7 months ago/)).not.toBeInTheDocument();
  });

  it('keeps the exact day machine readable, whatever the wording says', () => {
    render(<UpdatedBadge date="2026-08-21" label="2 days ago" />);

    expect(screen.getByText(/Updated/).closest('time')).toHaveAttribute(
      'datetime',
      '2026-08-21'
    );
  });
});
