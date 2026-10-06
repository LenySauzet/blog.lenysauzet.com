import { beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` is hoisted above every other statement, so the spy has to be too.
const { announce } = vi.hoisted(() => ({ announce: vi.fn() }));
vi.mock('@/app/_components/DynamicIsland', () => ({ announce }));

import { openBooking } from './booking';

describe('opening the booker', () => {
  beforeEach(() => {
    announce.mockClear();
    vi.resetModules();
  });

  /**
   * The embed is reached over the network, so the press has to answer for itself
   * when it cannot be. A new tab is not the answer: the gesture is spent by then
   * and the popup would be blocked.
   */
  it('says so on the island when cal.com cannot be reached', async () => {
    vi.doMock('@calcom/embed-react', () => {
      throw new Error('offline');
    });

    await expect(openBooking('dark')).resolves.toBeUndefined();
    expect(announce).toHaveBeenCalledWith('Booking is unreachable', expect.anything());
  });
});
