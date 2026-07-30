import type { ReactNode } from 'react';

import {
  Card as CardRoot,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface CardProps {
  /** Header line. Omitted, the card renders body-only with no separator. */
  title?: ReactNode;
  children: ReactNode;
}

/**
 * Prose wrapper over the Card primitive, which owns every style decision. All
 * this adds is the article's block rhythm and the header/separator that a
 * `title` implies.
 */
export default function Card({ title, children }: CardProps) {
  return (
    <CardRoot className="my-6">
      {title ? (
        // `border-b` draws the separator and triggers the primitive's own
        // bottom padding; preflight's `* { @apply border-border }` colours it.
        <CardHeader className="border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </CardRoot>
  );
}
