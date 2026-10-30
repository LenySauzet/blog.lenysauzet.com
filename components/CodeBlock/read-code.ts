import { Children, isValidElement, type ReactNode } from 'react';

export interface LogLevel {
  label: string;
  accent: string;
}

// A log block's level: its name in words, its colour alone not saying it, and the
// accent its surface and ink derive from (globals.css). lib/rehype-code.mjs admits
// the same keys.
export const LOG_LEVELS = new Map<string, LogLevel>([
  ['info', { label: 'Info', accent: '[--code-accent:var(--primary)]' }],
  ['warning', { label: 'Warning', accent: '[--code-accent:var(--warning)]' }],
  ['danger', { label: 'Error', accent: '[--code-accent:var(--destructive)]' }],
]);

export interface CodeStats {
  lines: number;
  added: number;
  removed: number;
  variant?: string;
}

interface CodeProps {
  children?: ReactNode;
  className?: string;
  'data-variant'?: string;
}

// Read off the markup rehype-pretty-code emits: a line is a `data-line` span, a
// diff marks it `add` or `remove`, and a fence's variant sits on its <pre>.
export function readCode(node: ReactNode, stats: CodeStats = { lines: 0, added: 0, removed: 0 }) {
  Children.forEach(node, (child) => {
    if (!isValidElement<CodeProps>(child)) return;
    const { props } = child;
    stats.variant ??= props['data-variant'];
    if (!('data-line' in props)) {
      readCode(props.children, stats);
      return;
    }
    const classes = props.className?.split(' ') ?? [];
    stats.lines += 1;
    if (classes.includes('add')) stats.added += 1;
    if (classes.includes('remove')) stats.removed += 1;
  });
  return stats;
}
