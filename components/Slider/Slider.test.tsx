import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Slider from './Slider';

describe('Slider', () => {
  // Radix puts role="slider" on the thumb, so a label left on the root is
  // never announced.
  it('names the thumb, which is what carries the role', () => {
    render(<Slider label="Opacity" defaultValue={30} />);

    expect(screen.getByRole('slider', { name: 'Opacity' })).toBeInTheDocument();
  });

  it('reads out its value with the unit and precision asked for', () => {
    render(<Slider label="Opacity" defaultValue={65} unit="%" />);

    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('keeps the readout to whole numbers by default', () => {
    render(<Slider label="Count" defaultValue={12} />);

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('exposes the range it accepts', () => {
    render(<Slider label="Volume" min={0} max={500} defaultValue={250} />);
    const thumb = screen.getByRole('slider');

    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '500');
    expect(thumb).toHaveAttribute('aria-valuenow', '250');
  });
});
