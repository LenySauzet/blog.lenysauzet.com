import { getCalApi } from '@calcom/embed-react';
import { Calendar01Icon } from '@hugeicons/core-free-icons';

import { announce } from '@/app/_components/DynamicIsland';
import siteConfig from '@/config/site';

export async function openBooking(theme: string | undefined) {
  try {
    const cal = await getCalApi();

    cal('ui', { theme: theme === 'light' ? 'light' : 'dark' });
    cal('modal', { calLink: siteConfig.calHandle });
  } catch {
    announce('Booking is unreachable', Calendar01Icon);
  }
}
