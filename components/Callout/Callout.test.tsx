import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Callout } from './Callout';

describe('Callout', () => {
  it('renders its children inside a complementary aside', () => {
    render(<Callout>The note body</Callout>);

    expect(within(screen.getByRole('complementary')).getByText('The note body')).toBeInTheDocument();
  });

  it.each([
    [undefined, 'Note', '[--callout:var(--primary)]'],
    ['info', 'Note', '[--callout:var(--primary)]'],
    ['warning', 'Warning', '[--callout:var(--warning)]'],
    ['danger', 'Caution', '[--callout:var(--destructive)]'],
  ] as const)('names the %s variant %s, in its own colour', (variant, name, accent) => {
    render(<Callout variant={variant}>Body</Callout>);

    const aside = screen.getByRole('complementary');
    expect(within(aside).getByText(name)).toBeInTheDocument();
    expect(aside).toHaveClass(accent);
  });

  it('lets a label replace the name, markup included', () => {
    render(
      <Callout variant="warning" label={<strong>Compatibility</strong>}>
        Body
      </Callout>,
    );

    const aside = screen.getByRole('complementary');
    expect(within(aside).getByText('Compatibility').tagName).toBe('STRONG');
    expect(within(aside).getByText('Warning:')).toHaveClass('sr-only');
  });

  it('still announces its variant when a label replaces the name', () => {
    render(
      <Callout variant="danger" label="Compatibility">
        Body
      </Callout>,
    );

    expect(screen.getByRole('complementary')).toHaveTextContent(/^Caution: Compatibility/);
  });

  it('hides its icon from assistive tech, the name saying it already', () => {
    render(<Callout>Body</Callout>);

    expect(screen.getByRole('complementary').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards className', () => {
    render(<Callout className="mt-10">Body</Callout>);

    expect(screen.getByRole('complementary')).toHaveClass('mt-10', 'callout-surface');
  });
});
