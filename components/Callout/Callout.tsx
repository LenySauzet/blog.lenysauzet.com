import { AlertCircleIcon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const calloutVariants = cva('relative my-6 rounded-xl border p-4', {
  variants: {
    variant: {
      info: 'border-primary/20 bg-primary/[0.06]',
      danger: 'border-destructive/25 bg-destructive/[0.06]',
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
  danger: AlertCircleIcon,
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
            'absolute -top-3.5 right-3 rounded-lg px-2.5 py-1 text-sm font-medium select-none',
            badgeColor({ variant })
          )}
        >
          {label}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'absolute -top-4 -right-4 grid place-items-center rounded-full border-4 border-background p-1',
            badgeColor({ variant })
          )}
        >
          <HugeiconsIcon icon={variantIcon[variant]} size={18} strokeWidth={2.5} />
        </span>
      )}

      <div className="flex flex-col gap-3 [&_p]:m-0 [&_p]:text-foreground">
        {children}
      </div>
    </aside>
  );
}
