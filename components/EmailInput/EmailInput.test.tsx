import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import EmailInput from './EmailInput';

const field = (defaultValue: string) => {
  render(<EmailInput aria-label="Email" defaultValue={defaultValue} />);
  return screen.getByLabelText('Email') as HTMLInputElement;
};

describe('EmailInput', () => {
  // The tick is driven by :valid, so validity is the whole component contract.
  it.each(['hello@gmail.com', 'first.last@sub.example.co.uk'])(
    'accepts %s',
    (value) => {
      expect(field(value).checkValidity()).toBe(true);
    }
  );

  // `type="email"` alone accepts every one of these.
  it.each(['hello@gmail.c', 'hello@a', 'hello@', 'hello'])(
    'rejects %s',
    (value) => {
      expect(field(value).checkValidity()).toBe(false);
    }
  );

  // Empty is valid on purpose: an untouched optional field is not an error.
  // `:not(:placeholder-shown)` is what keeps the tick hidden, which is why the
  // placeholder cannot be dropped.
  it('stays valid while empty, but keeps its placeholder', () => {
    const input = field('');

    expect(input.checkValidity()).toBe(true);
    expect(input).toHaveAttribute('placeholder');
  });
});
