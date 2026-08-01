import { AtIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import Showcase from './ComponentShowcase';
import PasswordInput from './PasswordInput';

const SAMPLE = `Here's to the crazy ones.
The misfits.
The rebels.`;

/** Two columns, empty then filled, mirroring how the reference presents these. */
function Pair({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">{children}</div>
  );
}

export default function InputShowcase() {
  return (
    <>
      <Showcase label="Subscribe">
        <div className="flex w-full items-center gap-2">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={AtIcon} />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              placeholder="hello@lenysauzet.com"
              aria-label="Email address"
            />
          </InputGroup>
          <Button>Subscribe</Button>
        </div>
      </Showcase>

      <Showcase label="Labelled">
        <Pair>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name-empty">Name</Label>
            <Input id="name-empty" placeholder="Name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name-filled">Name</Label>
            <Input id="name-filled" defaultValue="Lény Sauzet" />
          </div>
        </Pair>
      </Showcase>

      <Showcase label="With an icon, and a valid value">
        <Pair>
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={AtIcon} />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              placeholder="hello@lenysauzet.com"
              aria-label="Email address"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon className="text-success">
              <HugeiconsIcon icon={Tick02Icon} />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              defaultValue="hello@lenysauzet.com"
              aria-label="Email address, valid"
            />
          </InputGroup>
        </Pair>
      </Showcase>

      <Showcase label="Password">
        <Pair>
          <PasswordInput placeholder="Password" aria-label="Password" />
          <PasswordInput defaultValue="correct horse battery" aria-label="Password" />
        </Pair>
      </Showcase>

      <Showcase label="Textarea">
        <Pair>
          <div className="flex flex-col gap-2">
            <Label htmlFor="text-empty">Example text</Label>
            <Textarea id="text-empty" rows={6} placeholder="Type some text here" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="text-filled">Example text</Label>
            <Textarea id="text-filled" rows={6} defaultValue={SAMPLE} />
          </div>
        </Pair>
      </Showcase>

      <Showcase label="Disabled">
        <Pair>
          <Input placeholder="Name" disabled />
          <Textarea rows={2} placeholder="Type some text here" disabled />
        </Pair>
      </Showcase>
    </>
  );
}
