import { describe, expect, it } from 'vitest';

import { pickAnother } from './random';

describe('pickAnother', () => {
  it('never hands back the post already being read', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      expect(pickAnother(['a', 'b', 'c'], 'b')).not.toBe('b');
    }
  });

  it('has nothing to offer when the one post is the one being read', () => {
    expect(pickAnother(['a'], 'a')).toBeUndefined();
    expect(pickAnother([], undefined)).toBeUndefined();
  });

  it('reaches every post it is given', () => {
    const seen = new Set<string | undefined>();
    for (let attempt = 0; attempt < 200; attempt += 1) {
      seen.add(pickAnother(['a', 'b', 'c'], 'c'));
    }

    expect([...seen].sort()).toEqual(['a', 'b']);
  });
});
