import EmailInput from '@/components/EmailInput';
import PasswordInput from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SAMPLE = `Here's to the crazy ones.
The misfits.
The rebels.`;

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Left column empty, right column filled and disabled, mirroring how the
 * reference presents these. The right-hand email needs `valid` spelled out:
 * disabling a control bars it from constraint validation, so `:valid` no
 * longer matches however well-formed the address is.
 */
export default function InputShowcase() {
  return (
    <div className="my-6 flex flex-col gap-10">
      <div className="flex items-center gap-2">
        <EmailInput aria-label="Email address" />
        <Button>Subscribe</Button>
      </div>

      <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
        <Field label="Name" htmlFor="name-empty">
          <Input id="name-empty" placeholder="Name" />
        </Field>
        <Field label="Name" htmlFor="name-filled">
          <Input id="name-filled" defaultValue="Lény Sauzet" disabled />
        </Field>

        <EmailInput aria-label="Email address" />
        <EmailInput
          aria-label="Email address, valid"
          defaultValue="hello@lenysauzet.com"
          valid
          disabled
        />

        <PasswordInput placeholder="Password" aria-label="Password" />
        <PasswordInput
          aria-label="Password"
          defaultValue="supersecretpassword"
          disabled
        />

        <Field label="Example Text" htmlFor="text-empty">
          <Textarea id="text-empty" rows={6} placeholder="Type some text here" />
        </Field>
        <Field label="Example Text" htmlFor="text-filled">
          <Textarea id="text-filled" rows={6} defaultValue={SAMPLE} disabled />
        </Field>
      </div>
    </div>
  );
}
