import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Coverage from './Coverage';

describe('Coverage', () => {
  it('stands as one image, named', () => {
    render(<Coverage />);

    expect(
      screen.getByRole('img', { name: 'Coverage anti-aliasing of an edge across a pixel grid' }),
    ).toBeInTheDocument();
  });

  it('reads out a new share as the edge turns', async () => {
    const user = userEvent.setup();
    render(<Coverage />);
    const readout = () => screen.getByText(/^\d+%$/).textContent;
    const before = readout();

    await user.click(screen.getByRole('slider'));
    await user.keyboard('{Home}');

    expect(readout()).not.toBe(before);
  });
});
