import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Callout } from './Callout';

describe('Callout', () => {
  it('renders its children inside a complementary aside', () => {
    render(<Callout variant="info">The note body</Callout>);

    const aside = screen.getByRole('complementary');
    expect(within(aside).getByText('The note body')).toBeInTheDocument();
  });

  it('announces the variant to assistive tech', () => {
    render(<Callout variant="danger">Body</Callout>);

    expect(screen.getByRole('complementary')).toHaveTextContent('Warning:');
  });

  it('shows the corner icon when no label is given', () => {
    render(<Callout variant="info">Body</Callout>);

    const aside = screen.getByRole('complementary');
    expect(aside.querySelector('svg')).toBeInTheDocument();
    expect(aside.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('replaces the icon with the label pill when a label is set', () => {
    render(
      <Callout variant="info" label="Learn more">
        Body
      </Callout>
    );

    const aside = screen.getByRole('complementary');
    expect(within(aside).getByText('Learn more')).toBeInTheDocument();
    // the decorative icon is gone once a label takes the corner
    expect(aside.querySelector('svg')).not.toBeInTheDocument();
  });

  it('defaults to the info variant', () => {
    render(<Callout>Body</Callout>);

    expect(screen.getByRole('complementary')).toHaveTextContent('Note:');
  });
});
