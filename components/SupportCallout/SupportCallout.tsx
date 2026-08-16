import Anchor from '@/components/Anchor/Anchor';
import { Button } from '@/components/ui/button';
import { Card as CardRoot, CardContent } from '@/components/ui/card';

import SupporterBand from './SupporterBand';

const COFFEE_URL = 'https://buymeacoffee.com/lenysauzet';
const MEMBERSHIP_URL = 'https://buymeacoffee.com/lenysauzet/membership';

/**
 * The copy and the links are the same on every article, so this half stays a Server
 * Component and ships no JavaScript. Only the band below needs the network.
 */
export default function SupportCallout() {
  // The size variant has to be answered in kind: `p-0` and `gap-0` lose to the
  // primitive's own `data-[size=sm]:` rules, which would leave the band floating 16px
  // clear of the card's bottom edge instead of running into it.
  return (
    <CardRoot className="my-8 overflow-hidden data-[size=sm]:gap-0 data-[size=sm]:py-0">
      <CardContent className="flex flex-col gap-5 p-6">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Support this work
        </h3>

        <p className="font-display text-base leading-7 text-muted-foreground">
          Enjoying my writing and feeling like supporting my work? You can show
          your appreciation by{' '}
          <Anchor href={COFFEE_URL}>buying me a coffee</Anchor> (I really really{' '}
          <span className="font-medium text-subtle-foreground italic">really</span>{' '}
          do like coffee), which gives me the energy to take on more ambitious
          articles and projects.
        </p>

        <p className="font-display text-base leading-7 text-muted-foreground">
          As a token of gratitude, your name will be featured on the little screen
          below. Thank you for reading!
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild>
            <a href={COFFEE_URL} target="_blank" rel="noreferrer noopener">
              Buy me a coffee
            </a>
          </Button>
          <Anchor href={MEMBERSHIP_URL}>Become a monthly sponsor</Anchor>
        </div>
      </CardContent>

      <SupporterBand />
    </CardRoot>
  );
}
