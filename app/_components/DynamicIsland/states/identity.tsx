import Logo from '@/components/Logo';
import siteConfig from '@/config/site';

import type { IslandState } from '../types';

/** The first name only: the island has a cap's worth of room, not a byline's. */
const [firstName] = siteConfig.authorName.split(' ');

/** The fallback: no condition, last in the registry. Who writes here. */
export const identity: IslandState = {
  id: 'identity',
  render: () => (
    <div className="flex items-center gap-4">
      {/* Sized to the island's inner height, so its curve is concentric with the
          cap it sits in rather than merely near it. */}
      <Logo className="size-[1.875rem] shrink-0" />
      <span className="pr-3 text-[0.95rem] whitespace-nowrap">{firstName}</span>
    </div>
  ),
};
