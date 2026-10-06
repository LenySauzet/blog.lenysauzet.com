import { Calendar01Icon } from '@hugeicons/core-free-icons';

import { announce } from '@/app/_components/DynamicIsland';
import siteConfig from '@/config/site';

/**
 * Opens cal.com over the page. The embed is fetched here rather than imported, so a
 * reader who never books never asks cal.com for anything.
 *
 * Nothing is focused once it is up, deliberately: cal.com reads Escape on the parent
 * document, and handing the iframe the focus sends the key to a cross-origin document
 * instead, which trades a working dismissal for the three tabs it saves.
 */
export async function openBooking(theme: string | undefined) {
  try {
    const { getCalApi } = await import('@calcom/embed-react');
    const cal = await getCalApi();

    cal('ui', { theme: theme === 'light' ? 'light' : 'dark' });
    cal('modal', { calLink: siteConfig.calHandle });
  } catch {
    // Not a new tab: the gesture is spent by the time we know, so the popup would be
    // blocked. Reaching cal.com is what just failed, so sending them there is no
    // answer either.
    announce('Booking is unreachable', Calendar01Icon);
  }
}
