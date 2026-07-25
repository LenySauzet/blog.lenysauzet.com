import { createHighlighter, type Highlighter, type ThemeRegistrationRaw } from 'shiki';
import { beforeAll, describe, expect, it } from 'vitest';

import { codeTheme } from './code-theme';

// Locks the hand-authored, order-dependent scope -> CSS-variable rules: a typo'd
// scope, a reordered rule or a Shiki grammar change would otherwise recolour
// every code block silently. Anchors one token per intent, not the whole theme.
let highlighter: Highlighter;

beforeAll(async () => {
  highlighter = await createHighlighter({
    // Shiki normalises the `tokenColors` alias to `settings` at runtime, but the
    // raw-theme type still requires `settings`, so the cast is load-bearing.
    themes: [codeTheme as unknown as ThemeRegistrationRaw],
    langs: ['tsx'],
  });
});

function colorOf(code: string, token: string): string | undefined {
  const { tokens } = highlighter.codeToTokens(code, { lang: 'tsx', theme: 'css-variables' });
  for (const line of tokens) {
    for (const entry of line) {
      if (entry.content.trim() === token) return entry.color;
    }
  }
  return undefined;
}

describe('code-theme token mapping', () => {
  it('paints ordinary variables with the plain foreground', () => {
    expect(colorOf('const myVariable = 1;', 'myVariable')).toContain('--shiki-foreground');
  });

  it('paints property names with the constant colour', () => {
    expect(colorOf('const o = { propKey: 1 };', 'propKey')).toContain('--shiki-token-constant');
  });

  it('paints numeric literals with the constant colour', () => {
    expect(colorOf('const n = 42;', '42')).toContain('--shiki-token-constant');
  });

  it('treats primitive type keywords as keywords, not the function accent', () => {
    expect(colorOf('let s: string;', 'string')).toContain('--shiki-token-keyword');
  });

  it('paints type names with the function accent', () => {
    expect(colorOf('interface Widget {}', 'Widget')).toContain('--shiki-token-function');
  });

  it('paints call expressions with the function accent', () => {
    expect(colorOf('doThing();', 'doThing')).toContain('--shiki-token-function');
  });

  it('paints operators with the operator accent', () => {
    expect(colorOf('const x = 1;', '=')).toContain('--shiki-token-operator');
  });

  it('keeps keywords on the keyword colour', () => {
    expect(colorOf('const x = 1;', 'const')).toContain('--shiki-token-keyword');
  });
});
