import { beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above every other statement, so the spies have to be too.
const { announce, cal, getCalApi } = vi.hoisted(() => {
  const cal = vi.fn();
  return { announce: vi.fn(), cal, getCalApi: vi.fn(async () => cal) };
});

vi.mock('@/app/_components/DynamicIsland', () => ({ announce }));
vi.mock('@calcom/embed-react', () => ({ getCalApi }));

import siteConfig from '@/config/site';

import { openBooking } from './booking';

describe('opening the booker', () => {
  beforeEach(() => {
    announce.mockClear();
    cal.mockClear();
    getCalApi.mockClear();
  });

  it('asks cal.com for the page, not for one event type', async () => {
    await openBooking('dark');

    expect(cal).toHaveBeenCalledWith('modal', { calLink: siteConfig.calHandle });
    expect(announce).not.toHaveBeenCalled();
  });

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    [undefined, 'dark'],
  ])('carries the page theme %s into the embed as %s', async (page, embed) => {
    await openBooking(page);

    expect(cal).toHaveBeenCalledWith('ui', { theme: embed });
  });

  it('says so on the island when cal.com cannot be reached', async () => {
    getCalApi.mockRejectedValueOnce(new Error('offline'));

    await expect(openBooking('dark')).resolves.toBeUndefined();
    expect(announce).toHaveBeenCalledWith('Booking is unreachable', expect.anything());
  });
});
