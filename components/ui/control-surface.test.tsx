import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch } from './switch';

// jsdom applies no Tailwind, so these assert which classes reach the element,
// not what they paint. The marks below animate rotate, scale and translate,
// each of which Tailwind v4 sets as its own property rather than folding into
// `transform`; a transition naming `transform` compiles fine and animates
// nothing, which is exactly how this shipped the first time.
const MARKS = [
  {
    name: 'Checkbox',
    property: 'rotate',
    role: 'checkbox',
    render: () => <Checkbox />,
  },
  {
    name: 'Switch',
    property: 'translate',
    role: 'switch',
    render: () => <Switch />,
  },
  {
    name: 'RadioGroupItem',
    property: 'scale',
    role: 'radio',
    render: () => (
      <RadioGroup>
        <RadioGroupItem value="one" />
      </RadioGroup>
    ),
  },
] as const;

describe.each(MARKS)('$name', ({ property, role, render: renderControl }) => {
  it(`transitions ${property}, the property its mark actually changes`, () => {
    const { container } = render(renderControl());
    // The switch animates its thumb, the other two a pseudo-element on the root.
    const classes = [...container.querySelectorAll('*')]
      .map((el) => el.className)
      .join(' ');

    expect(classes).toContain(`${property}_`);
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
