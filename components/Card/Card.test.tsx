import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Card from './Card';

describe('Card', () => {
  it('renders its body', () => {
    render(<Card>Cards group related content.</Card>);

    expect(screen.getByText('Cards group related content.')).toBeInTheDocument();
  });

  it('renders the title in a header when one is given', () => {
    render(<Card title="A card title">Body</Card>);

    const title = screen.getByText('A card title');
    expect(title).toBeInTheDocument();
    expect(title.closest('[data-slot="card-header"]')).not.toBeNull();
  });

  // The separator is the header's own bottom border, so its presence is what a
  // titleless card must not have. jsdom applies no Tailwind, so the rule itself
  // is verified in a browser.
  it('renders no header at all without a title', () => {
    const { container } = render(<Card>Body</Card>);

    expect(container.querySelector('[data-slot="card-header"]')).toBeNull();
  });

  it('accepts an arbitrary block as its body, not just text', () => {
    render(
      <Card title="With a block">
        <figure>
          <img src="/x.png" alt="A diagram" />
        </figure>
      </Card>
    );

    expect(screen.getByAltText('A diagram')).toBeInTheDocument();
  });
});
