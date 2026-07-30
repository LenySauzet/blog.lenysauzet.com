import type { ReactNode } from 'react';

import {
  Card as CardSurface,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface CardProps {
  /** Header line. Omitted, the card renders body-only with no separator. */
  title?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    // size="sm" is the primitive's own 16px scale, matching Details. Only the
    // edge is overridden: the primitive draws it with a ring, Details with a
    // border, and the two surfaces must not drift apart.
    <CardSurface
      size="sm"
      className="my-6 border border-border shadow-none ring-0"
    >
      {title ? (
        // `border-b` draws the separator and triggers the primitive's own
        // bottom padding. It picks up --border from the preflight rule in
        // globals.css, so no colour is named here.
        <CardHeader className="border-b">
          <CardTitle className="font-display text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="flex flex-col gap-4 font-display text-base leading-7 text-muted-foreground [&>*]:my-0">
        {children}
      </CardContent>
    </CardSurface>
  );
}
