import type { SandpackTheme } from '@codesandbox/sandpack-react';

// Maps Sandpack onto the same design tokens as the static code block, so the
// live editor inherits the site theme (and re-themes with --base-hue). Ported
// from Maxime Heckel's mapping, retargeted to this project's tokens.
export const sandpackTheme: SandpackTheme = {
  colors: {
    surface1: 'var(--code-bg)',
    surface2: 'var(--code-border)',
    surface3: 'var(--code-emphasis)',
    base: 'var(--foreground)',
    disabled: 'var(--muted-foreground)',
    hover: 'var(--foreground)',
    clickable: 'var(--muted-foreground)',
    accent: 'var(--foreground)',
    error: 'var(--destructive)',
    errorSurface: 'oklch(from var(--destructive) l c h / 0.12)',
  },
  syntax: {
    plain: 'var(--shiki-foreground)',
    comment: { color: 'var(--shiki-token-comment)' },
    keyword: 'var(--shiki-token-keyword)',
    tag: 'var(--shiki-token-constant)',
    punctuation: 'var(--shiki-token-punctuation)',
    definition: 'var(--shiki-token-function)',
    property: 'var(--shiki-token-function)',
    static: 'var(--shiki-token-constant)',
    string: 'var(--shiki-token-string)',
  },
  font: {
    body: 'var(--font-display)',
    mono: 'var(--font-mono-code)',
    size: '14px',
    lineHeight: '1.7',
  },
};
