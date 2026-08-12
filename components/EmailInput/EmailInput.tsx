import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

export type EmailInputProps = Omit<React.ComponentProps<'input'>, 'type'>;

/**
 * An email field whose icon redraws into a tick once the address parses.
 *
 * Validity is read straight from the browser through `:valid`, so the whole
 * component stays server-rendered. The placeholder is load-bearing:
 * `:placeholder-shown` is what separates "empty" from "filled", and an email
 * input with no value is `:valid` on its own.
 */
export default function EmailInput({
  className,
  placeholder = 'hello@lenysauzet.com',
  ...props
}: EmailInputProps) {
  return (
    <InputGroup className={className}>
      <InputGroupInput type="email" placeholder={placeholder} {...props} />
      <InputGroupAddon
        className={cn(
          '[--at-delay:.35s] [--at:0] [--tick-delay:0s] [--tick:1]',
          'peer-[:valid:not(:placeholder-shown)]:[--at-delay:0s]',
          'peer-[:valid:not(:placeholder-shown)]:[--at:1]',
          'peer-[:valid:not(:placeholder-shown)]:[--tick-delay:.35s]',
          'peer-[:valid:not(:placeholder-shown)]:[--tick:0]'
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
            className="[stroke-dasharray:1] [stroke-dashoffset:var(--at)] [transition:stroke-dashoffset_.5s_ease_var(--at-delay)] motion-reduce:transition-none"
            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
          />
          <path
            pathLength={1}
            className="stroke-success [stroke-dasharray:1] [stroke-dashoffset:var(--tick)] [transition:stroke-dashoffset_.5s_ease_var(--tick-delay)] motion-reduce:transition-none"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </InputGroupAddon>
    </InputGroup>
  );
}
