import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ANGLE } from './geometry';
import RaySphere from './RaySphere';

describe('RaySphere', () => {
  it('stands as one image, named', () => {
    render(<RaySphere />);

    expect(
      screen.getByRole('img', { name: "A ray crossing a planet's atmosphere" }),
    ).toBeInTheDocument();
  });

  it('redraws as the slider turns the ray off the planet', async () => {
    const user = userEvent.setup();
    render(<RaySphere />);
    expect(screen.getByText('g1')).toBeInTheDocument();

    await user.click(screen.getByRole('slider'));
    await user.keyboard('{End}');

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', String(ANGLE.max));
    expect(screen.queryByText('g1')).not.toBeInTheDocument();
    expect(screen.queryByText('p1')).not.toBeInTheDocument();
  });
});
