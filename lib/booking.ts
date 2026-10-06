import { getCalApi } from '@calcom/embed-react';
import { Calendar01Icon } from '@hugeicons/core-free-icons';

import { announce } from '@/app/_components/DynamicIsland';
import siteConfig from '@/config/site';

/** Nothing is focused: cal.com reads Escape on the parent, and the iframe holding it
    would send the key across origins instead. */
export async function openBooking(theme: string | undefined) {
  try {
    const cal = await getCalApi();

    cal('ui', { theme: theme === 'light' ? 'light' : 'dark' });
    cal('modal', { calLink: siteConfig.calHandle });
  } catch {
    // A new tab is blocked by here: the gesture is spent.
    announce('Booking is unreachable', Calendar01Icon);
  }
}
