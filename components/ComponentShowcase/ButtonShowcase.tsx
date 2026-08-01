import {
  ArrowUpRight01Icon,
  NewTwitterIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';

import Showcase from './ComponentShowcase';

/**
 * Every Button variant, size and state in one place, so the design can be
 * judged on screen rather than in a diff. Lives with the showcase rather than
 * in the post, because it is markup, not prose.
 */
export default function ButtonShowcase() {
  return (
    <>
      <Showcase label="Variants">
        <Button>Button</Button>
        <Button variant="secondary">Button</Button>
        <Button variant="outline">Button</Button>
        <Button variant="ghost">Button</Button>
        <Button variant="link">Button</Button>
        <Button variant="destructive">Button</Button>
      </Showcase>

      <Showcase label="With an icon">
        <Button>
          Portfolio
          <HugeiconsIcon icon={ArrowUpRight01Icon} data-icon="inline-end" />
        </Button>
        <Button>
          <HugeiconsIcon icon={NewTwitterIcon} data-icon="inline-start" />
          Follow me!
        </Button>
      </Showcase>

      <Showcase label="Sizes">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </Showcase>

      <Showcase label="Icon only, square">
        <Button size="icon" aria-label="Follow on X">
          <HugeiconsIcon icon={NewTwitterIcon} />
        </Button>
        <Button size="icon" variant="outline" aria-label="Follow on X">
          <HugeiconsIcon icon={NewTwitterIcon} />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Follow on X">
          <HugeiconsIcon icon={NewTwitterIcon} />
        </Button>
      </Showcase>

      <Showcase label="Icon only, round">
        <Button size="icon" className="rounded-full" aria-label="Follow on X">
          <HugeiconsIcon icon={NewTwitterIcon} />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full"
          aria-label="Follow on X"
        >
          <HugeiconsIcon icon={NewTwitterIcon} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          aria-label="Follow on X"
        >
          <HugeiconsIcon icon={NewTwitterIcon} />
        </Button>
      </Showcase>

      <Showcase label="Disabled">
        <Button disabled>Button</Button>
        <Button variant="secondary" disabled>
          Button
        </Button>
        <Button variant="outline" disabled>
          Button
        </Button>
        <Button variant="ghost" disabled>
          Button
        </Button>
      </Showcase>
    </>
  );
}
