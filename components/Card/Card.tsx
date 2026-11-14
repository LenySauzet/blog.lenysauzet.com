import type { ReactNode } from 'react';

import {
  Card as CardRoot,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface CardProps {
  title?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <CardRoot className="my-6">
      {title ? (
        <CardHeader className="border-b">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </CardRoot>
  );
}
