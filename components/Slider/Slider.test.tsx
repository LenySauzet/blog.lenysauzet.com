import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  // The drag resistance is derived from the step rather than a prop of its own,
  // so the step has to reach the control for any of it to happen.
  it('carries its step through to the control', async () => {
    const user = userEvent.setup();
    render(<Slider label="Stepped" min={0} max={100} step={25} defaultValue={50} />);

    const thumb = screen.getByRole('slider');
    await user.click(thumb);
    await user.keyboard('{ArrowRight}');

    expect(thumb).toHaveAttribute('aria-valuenow', '75');
  });

  it('exposes the range it accepts', () => {
    render(<Slider label="Volume" min={0} max={500} defaultValue={250} />);
    const thumb = screen.getByRole('slider');

    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '500');
    expect(thumb).toHaveAttribute('aria-valuenow', '250');
  });
});
