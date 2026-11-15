import { Link04Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactElement, ReactNode } from 'react';

function getTextContent(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (typeof children === 'object' && children !== null) {
    const el = children as ReactElement<{ children?: ReactNode }>;
    if (el.props?.children) return getTextContent(el.props.children);
  }
  return '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function PostH2({ children }: { children: ReactNode }) {
  const id = slugify(getTextContent(children));

  return (
    <h2
      id={id}
      className="group flex items-center gap-2 mt-20 mb-6 scroll-mt-24"
    >
      <a
        href={`#${id}`}
        className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-foreground shrink-0 no-underline"
      >
        {children}
        <HugeiconsIcon
          icon={Link04Icon}
          size={17}
          strokeWidth={2}
          className="text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
        />
      </a>
      <div
        className="flex-1 h-px bg-repeat-x bg-size-[8px_1px] ml-1"
        style={{
          backgroundImage:
            'linear-gradient(to right,var(--border) 50%, transparent 0)',
        }}
      />
    </h2>
  );
}
