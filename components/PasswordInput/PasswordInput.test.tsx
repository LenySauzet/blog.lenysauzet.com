import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('masks the value until asked otherwise', () => {
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('reveals and re-masks on the toggle', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
  });

  // The label names the action, not the state, so a screen reader hears what
  // pressing will do; aria-pressed carries the state, and is also what the
  // stylesheet reads to redraw the eye.
  it('reports its state through aria-pressed', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" />);

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(
      screen.getByRole('button', { name: 'Hide password' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('never submits the form it sits in', () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  // A live toggle on a dead field would reveal a value nobody can edit.
  it('disables the toggle along with the field', () => {
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" disabled />);

    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
