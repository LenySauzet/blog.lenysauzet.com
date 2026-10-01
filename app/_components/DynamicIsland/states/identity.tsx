import Logo from '@/components/Logo';
import siteConfig from '@/config/site';

import type { IslandState } from '../types';

/** The fallback: no condition, last in the registry. Who writes here. */
export const identity: IslandState = {
  id: 'identity',
  render: () => (
    <div className="flex items-center gap-3 px-1">
      <Logo className="size-5 shrink-0" />
      <span className="text-sm font-medium whitespace-nowrap">
        {siteConfig.authorName}
      </span>
    </div>
  ),
};
