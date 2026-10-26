import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Wave from './Wave';

describe('Wave', () => {
  it('stands as one image, named', () => {
    render(<Wave />);

    expect(screen.getByRole('img', { name: 'A grid displaced by a ripple' })).toBeInTheDocument();
  });

  it('turns the surface with its second control', async () => {
    const user = userEvent.setup();
    const { container } = render(<Wave />);
    const first = () => container.querySelector('polygon')?.getAttribute('points');
    const before = first();

    await user.click(screen.getByRole('slider', { name: 'Turn' }));
    await user.keyboard('{End}');

    expect(first()).not.toBe(before);
  });

  it('counts its vertices', () => {
    render(<Wave />);

    expect(screen.getByText('625 vertices')).toBeInTheDocument();
  });
});
