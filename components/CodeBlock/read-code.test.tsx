import { describe, expect, it } from 'vitest';

import { VARIANTS } from '@/lib/rehype-code.mjs';

import { LOG_LEVELS, readCode } from './read-code';

describe('readCode', () => {
  it('counts the lines rehype-pretty-code marks, through nested tokens and newlines', () => {
    const stats = readCode(
      <pre>
        <code>
          <span data-line="">
            <span>const</span>
            <mark data-highlighted-chars="">
              <span>a</span>
            </mark>
          </span>
          {'\n'}
          <span data-line="" className="diff add">
            <span>b</span>
          </span>
          {'\n'}
          <span data-line="" className="diff remove">
            <span>c</span>
          </span>
        </code>
      </pre>
    );

    expect(stats).toEqual({ lines: 3, added: 1, removed: 1 });
  });

  it('reads the variant off the <pre>', () => {
    const stats = readCode(
      <pre data-variant="warning">
        <code>
          <span data-line="">log</span>
        </code>
      </pre>
    );

    expect(stats.variant).toBe('warning');
  });
});

describe('LOG_LEVELS', () => {
  // A variant the plugin admits but CodeBlock does not know would build into a block
  // with no accent and no name.
  it('names every variant lib/rehype-code.mjs admits, and no other', () => {
    expect([...LOG_LEVELS.keys()]).toEqual(VARIANTS);
  });
});
