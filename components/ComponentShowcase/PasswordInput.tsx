'use client';

import { ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

export interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Names the reveal toggle for assistive tech. */
  revealLabel?: string;
}

/**
 * A password field whose contents can be revealed. The toggle reports its state
 * through `aria-pressed`, and the label follows the action rather than the
 * state, so a screen reader hears what pressing it will do.
 */
export default function PasswordInput({
  revealLabel = 'password',
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={revealed ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={revealed}
          aria-label={revealed ? `Hide ${revealLabel}` : `Show ${revealLabel}`}
          onClick={() => setRevealed((shown) => !shown)}
        >
          <HugeiconsIcon icon={revealed ? ViewIcon : ViewOffSlashIcon} />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
