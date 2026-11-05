import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Slider from './Slider';

describe('Slider', () => {
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

  it('tells a listener what the reader moved it to', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="Angle" defaultValue={5} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('slider'));
    await user.keyboard('{ArrowRight}');

    expect(onValueChange).toHaveBeenLastCalledWith(6);
  });
});
