import { describe, expect, it } from 'vitest';

import { partitionByRecommendation } from './recommend';
import type { Command, CommandContext } from './types';

const context = { finished: true } as CommandContext;

const command = (id: string, recommend?: boolean): Command => ({
  id,
  label: id,
  icon: [],
  group: 'Tools',
  recommend: recommend === undefined ? undefined : () => recommend,
  run: () => {},
});

describe('partitionByRecommendation', () => {
  it('lifts out what the moment asks for', () => {
    const wanted = command('wanted', true);
    const other = command('other');

    const { recommended, rest } = partitionByRecommendation(
      [other, wanted],
      context
    );

    expect(recommended).toEqual([wanted]);
    expect(rest).toEqual([other]);
  });

  it('leaves no copy behind in the group it was lifted from', () => {
    const wanted = command('wanted', true);

    const { rest } = partitionByRecommendation([wanted], context);

    expect(rest).toEqual([]);
  });

  // Past a handful it stops being a recommendation and becomes a second menu.
  it('recommends no more than five', () => {
    const many = Array.from({ length: 8 }, (_, index) =>
      command(`wanted-${index}`, true)
    );

    const { recommended, rest } = partitionByRecommendation(many, context);

    expect(recommended).toHaveLength(5);
    expect(rest).toHaveLength(3);
  });

  it('recommends nothing when nothing asks', () => {
    const { recommended, rest } = partitionByRecommendation(
      [command('a'), command('b', false)],
      context
    );

    expect(recommended).toEqual([]);
    expect(rest).toHaveLength(2);
  });
});
