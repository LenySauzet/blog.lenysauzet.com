import { format } from 'date-fns';
import { afterEach, describe, expect, it } from 'vitest';

import { postDate } from './post-date';

const here = process.env.TZ;

// The bug this guards only shows west of Greenwich, and both the runner and CI sit
// east of it. V8 re-reads `TZ` on the next `Date`, so the zone is moved for the test.
const somewhereWest = (zone: string) => {
  process.env.TZ = zone;
};

afterEach(() => {
  process.env.TZ = here;
});

describe('postDate', () => {
  it('keeps the day that was written, wherever it is read', () => {
    somewhereWest('America/Los_Angeles');

    expect(format(postDate('2026-04-22'), 'MMM d, yyyy')).toBe('Apr 22, 2026');
  });

  // A post published on a 1 January would otherwise be filed under the year before.
  it('keeps a new year on the right side of midnight', () => {
    somewhereWest('Pacific/Honolulu');

    expect(postDate('2026-01-01').getFullYear()).toBe(2026);
  });

  it('reads the same day east of Greenwich', () => {
    process.env.TZ = 'Europe/Paris';

    expect(format(postDate('2026-04-22'), 'MMM d, yyyy')).toBe('Apr 22, 2026');
  });
});
