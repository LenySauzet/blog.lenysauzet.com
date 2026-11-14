import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

export interface EmailInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Forces the tick on a disabled or read-only control, which never matches `:valid`. */
  valid?: boolean;
}

const EMAIL_PATTERN = '[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}';

export default function EmailInput({
  className,
  placeholder = 'hello@lenysauzet.com',
  valid,
  ...props
}: EmailInputProps) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        type="email"
        pattern={EMAIL_PATTERN}
        placeholder={placeholder}
        {...props}
      />
      <InputGroupAddon
        data-valid={valid || undefined}
        className={cn(
          '[--at-delay:.35s] [--at:0] [--tick-delay:0s] [--tick:2]',
          'peer-[:valid:not(:placeholder-shown)]:[--at-delay:0s]',
          'peer-[:valid:not(:placeholder-shown)]:[--at:2]',
          'peer-[:valid:not(:placeholder-shown)]:[--tick-delay:.35s]',
          'peer-[:valid:not(:placeholder-shown)]:[--tick:0]',
          'data-[valid]:[--at:2] data-[valid]:[--tick:0]'
        )}
      >
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path
            pathLength={1}
            strokeWidth={2}
            className="[stroke-dasharray:2] [stroke-dashoffset:var(--at)] [transition:stroke-dashoffset_.5s_ease_var(--at-delay)] motion-reduce:transition-none"
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
          <path
            pathLength={1}
            strokeWidth={2}
            className="stroke-success [stroke-dasharray:2] [stroke-dashoffset:var(--tick)] [transition:stroke-dashoffset_.5s_ease_var(--tick-delay)] motion-reduce:transition-none"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </InputGroupAddon>
    </InputGroup>
  );
}
