import Logo from '@/components/Logo';
import siteConfig from '@/config/site';

import type { IslandState } from '../types';

const withoutDiacritics = (name: string) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '');

const [firstName] = withoutDiacritics(siteConfig.authorName).split(' ');

export const identity: IslandState = {
  id: 'identity',
  width: '13.75rem',
  render: () => (
    <div className="flex h-[1.875rem] w-full items-center justify-between pl-2 pr-4">
      <Logo className="size-5 shrink-0" />
      <span className="font-mono tracking-wider whitespace-nowrap text-muted-foreground">
        {firstName}
      </span>
    </div>
  ),
};
