import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch } from './switch';

// jsdom applies no Tailwind, so these assert which classes reach the element,
// not what they paint. Each mark animates a property Tailwind v4 sets on its
// own rather than folding into `transform`; a transition naming `transform`
// compiles fine and animates nothing, which is how this shipped the first time.
//
// The expectation matches the mark's whole transition declaration, since the
// shared surface animates `scale` too for its hover feedback and a bare
// property name would pass on that alone.
const MARKS = [
  {
    name: 'Checkbox',
    transition: '[transition:stroke-dashoffset_',
    role: 'checkbox',
    render: () => <Checkbox />,
  },
  {
    name: 'Switch',
    transition: '[transition:translate_',
    role: 'switch',
    render: () => <Switch />,
  },
  {
    name: 'RadioGroupItem',
    transition: 'before:[transition:scale_',
    role: 'radio',
    render: () => (
      <RadioGroup>
        <RadioGroupItem value="one" />
      </RadioGroup>
    ),
  },
] as const;

describe.each(MARKS)('$name', ({ transition, role, render: renderControl }) => {
  it('transitions the property its mark actually changes', () => {
    const { container } = render(renderControl());
    const classes = [...container.querySelectorAll('*')]
      .map((el) => el.getAttribute('class') ?? '')
      .join(' ');

    expect(classes).toContain(transition);
    expect(classes).not.toMatch(/\[transition:[^\]]*transform_/);
  });

  it('carries the pointer cursor Tailwind preflight drops', () => {
    render(renderControl());

    expect(screen.getByRole(role)).toHaveClass('cursor-pointer');
  });
});

describe('Checkbox', () => {
  it('toggles on click and reports its state', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" />);

    const box = screen.getByRole('checkbox', { name: 'Accept' });
    expect(box).not.toBeChecked();

    await user.click(box);
    expect(box).toBeChecked();
  });

  it('stays inert when disabled', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" disabled />);

    const box = screen.getByRole('checkbox', { name: 'Accept' });
    await user.click(box);

    expect(box).not.toBeChecked();
    expect(box.className).toContain('disabled:cursor-not-allowed');
  });
});

describe('Switch', () => {
  it('toggles on click and reports its state', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    await user.click(toggle);

    expect(toggle).toBeChecked();
  });
});

describe('RadioGroup', () => {
  it('moves the selection rather than adding to it', async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="one">
        <RadioGroupItem value="one" aria-label="One" />
        <RadioGroupItem value="two" aria-label="Two" />
      </RadioGroup>
    );

    await user.click(screen.getByRole('radio', { name: 'Two' }));

    expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'One' })).not.toBeChecked();
  });
});
