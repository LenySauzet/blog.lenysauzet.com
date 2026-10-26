import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Bezier from './Bezier';

describe('Bezier', () => {
  it('stands as one image, named', () => {
    render(<Bezier />);

    expect(
      screen.getByRole('img', { name: "De Casteljau's construction of a cubic Bézier" }),
    ).toBeInTheDocument();
  });

  it('names each pass in the margin', () => {
    render(<Bezier />);

    for (const name of ['1st pass', '2nd pass', 'B(t)']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('moves the point along the curve as t changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<Bezier />);
    const drawn = () =>
      container.querySelector('path[stroke-width="3"]')?.getAttribute('d');
    const before = drawn();

    await user.click(screen.getByRole('slider'));
    await user.keyboard('{End}');

    expect(drawn()).not.toBe(before);
  });
});
