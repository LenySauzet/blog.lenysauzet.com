import { InformationCircleIcon, OctagonIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// HugeIcons has no octagon-with-alert, so compose its octagon with an
// exclamation to match the reference's danger glyph.
const OctagonAlertIcon: IconSvgElement = [
  ...OctagonIcon,
  ['path', { d: 'M12 8.5V13', key: 'octagon-alert-stem' }],
  ['path', { d: 'M12 16H12.01', key: 'octagon-alert-dot' }],
];

// my-2 on top of the post's own 20px block gap: callouts want a touch more room
// than plain paragraphs, and flex margins there do not collapse.
const calloutVariants = cva('relative my-2 rounded-xl border px-4 py-3', {
  variants: {
    variant: {
      info: 'border-primary/15 bg-primary/[0.06] dark:border-primary/[0.08]',
      danger: 'border-destructive/15 bg-destructive/[0.06] dark:border-destructive/[0.08]',
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
  danger: OctagonAlertIcon,
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

      <div className="flex flex-col gap-2 [&_p]:m-0 [&_p]:text-foreground">
        {children}
      </div>
    </aside>
  );
}
