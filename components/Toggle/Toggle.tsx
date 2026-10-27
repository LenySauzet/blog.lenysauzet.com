'use client';

import { useId } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  label: string;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export default function Toggle({
  label,
  defaultChecked,
  onCheckedChange,
  className,
}: ToggleProps) {
  const id = useId();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Switch id={id} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
