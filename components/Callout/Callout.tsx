import { InformationCircleIcon, SpamIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// my-3 on top of the post's own 20px block gap: callouts want more room than
// plain paragraphs, and flex margins there do not collapse.
const calloutVariants = cva('relative my-3 rounded-xl border px-4 py-3', {
  variants: {
    variant: {
      info: 'border-primary/15 bg-primary/10 dark:border-primary/[0.08]',
      danger: 'border-destructive/15 bg-destructive/10 dark:border-destructive/[0.08]',
    },
  },
  defaultVariants: { variant: 'info' },
});

// The floating badge sits on the tinted variant colour; its icon/text takes the
// page background, so it reads inverted against the badge in either theme.
const badgeColor = cva('bg-(--badge) text-background', {
  variants: {
    variant: {
      info: '[--badge:var(--primary)]',
      danger: '[--badge:var(--destructive)]',
    },
  },
});

type CalloutVariant = NonNullable<VariantProps<typeof calloutVariants>['variant']>;

const variantIcon: Record<CalloutVariant, IconSvgElement> = {
  info: InformationCircleIcon,
  danger: SpamIcon,
};

const variantAnnounce: Record<CalloutVariant, string> = {
  info: 'Note',
  danger: 'Warning',
};

interface CalloutProps {
  variant?: CalloutVariant;
  /** A short text pill in the corner. Replaces the default icon when set. */
  label?: string;
  children?: ReactNode;
}

export function Callout({ variant = 'info', label, children }: CalloutProps) {
  return (
    <aside className={calloutVariants({ variant })}>
      <span className="sr-only">{variantAnnounce[variant]}: </span>

      {label ? (
        <span
          className={cn(
            'absolute -top-4 -right-2 rounded-lg px-2.5 py-1.5 text-sm font-medium select-none',
            badgeColor({ variant })
          )}
        >
          {label}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-5 -right-5 grid place-items-center rounded-full border-[6px] border-background p-1.5',
            badgeColor({ variant })
          )}
        >
          <HugeiconsIcon icon={variantIcon[variant]} size={20} strokeWidth={2.5} />
        </span>
      )}

      {/* Neutralise each block's own vertical margin so the gap alone sets the
          rhythm — lets any component (image, code, list, video) sit inside. */}
      <div className="flex flex-col gap-4 [&>*]:my-0 [&>p]:text-foreground">
        {children}
      </div>
    </aside>
  );
}
