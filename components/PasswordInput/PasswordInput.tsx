'use client';

import { useState } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export interface PasswordInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Names the reveal toggle for assistive tech. */
  revealLabel?: string;
}

/**
 * A password field whose eye redraws between its two states: the pupil draws in
 * as the strike retracts.
 *
 * The toggle reports its state through `aria-pressed`, and its label follows
 * the action rather than the state, so a screen reader hears what pressing it
 * will do.
 */
export default function PasswordInput({
  className,
  revealLabel = 'password',
  disabled,
  ...props
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        type={revealed ? 'text' : 'password'}
        disabled={disabled}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          disabled={disabled}
          data-revealed={revealed}
          aria-pressed={revealed}
          aria-label={revealed ? `Hide ${revealLabel}` : `Show ${revealLabel}`}
          onClick={() => setRevealed((shown) => !shown)}
          className="[--eye:2] [--strike:0] data-[revealed=true]:[--eye:0] data-[revealed=true]:[--strike:2]"
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              pathLength={1}
              className="[stroke-dasharray:2] [stroke-dashoffset:var(--eye)] [transition:stroke-dashoffset_.5s_ease] motion-reduce:transition-none"
            />
            <line
              x1="4"
              y1="4"
              x2="20"
              y2="20"
              pathLength={1}
              className="[stroke-dasharray:2] [stroke-dashoffset:var(--strike)] [transition:stroke-dashoffset_.4s_ease] motion-reduce:transition-none"
            />
          </svg>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
