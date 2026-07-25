import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BeforeAfterSlider } from './BeforeAfterSlider';

// The pointer drag depends on element geometry, which jsdom reports as zero, so
// it's exercised in a real browser instead. Here we cover the deterministic
// part: the slider semantics and the keyboard stepping/clamping.
const props = {
  beforeSrc: 'https://cdn.example.com/before.png',
  afterSrc: 'https://cdn.example.com/after.png',
  alt: 'Before/after comparison',
  defaultPosition: 45,
  width: 700,
  height: 500,
};

const valueNow = (el: HTMLElement) => el.getAttribute('aria-valuenow');

describe('BeforeAfterSlider', () => {
  it('exposes a named horizontal slider at the initial position', () => {
    render(<BeforeAfterSlider {...props} />);
    const slider = screen.getByRole('slider', { name: 'Before/after comparison' });
    expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(valueNow(slider)).toBe('45');
  });

  it('steps and clamps with the keyboard', async () => {
    const user = userEvent.setup();
    render(<BeforeAfterSlider {...props} />);
    const slider = screen.getByRole('slider');
    slider.focus();

    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(valueNow(slider)).toBe('50'));

    await user.keyboard('{End}');
    await waitFor(() => expect(valueNow(slider)).toBe('100'));

    await user.keyboard('{ArrowRight}'); // already at the maximum
    await waitFor(() => expect(valueNow(slider)).toBe('100'));

    await user.keyboard('{Home}');
    await waitFor(() => expect(valueNow(slider)).toBe('0'));

    await user.keyboard('{ArrowLeft}'); // already at the minimum
    await waitFor(() => expect(valueNow(slider)).toBe('0'));
  });
});
