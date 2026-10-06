import { Calendar01Icon } from '@hugeicons/core-free-icons';

import { announce } from '@/app/_components/DynamicIsland';
import siteConfig from '@/config/site';

/**
 * Opens cal.com over the page, fetching the embed rather than importing it so a reader
 * who never books never asks them for anything.
 *
 * Nothing is focused once it is up: cal.com reads Escape on the parent document, so
 * giving the iframe the focus sends the key across origins and the modal stops closing.
 */
export async function openBooking(theme: string | undefined) {
  try {
    const { getCalApi } = await import('@calcom/embed-react');
    const cal = await getCalApi();

    cal('ui', { theme: theme === 'light' ? 'light' : 'dark' });
    cal('modal', { calLink: siteConfig.calHandle });
  } catch {
    // Not a new tab: the gesture is spent by now, so the popup would be blocked.
    announce('Booking is unreachable', Calendar01Icon);
  }
}
