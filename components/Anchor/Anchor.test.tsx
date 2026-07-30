import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Anchor from './Anchor';

const iconsIn = (el: HTMLElement) => el.querySelectorAll('svg');

describe('Anchor', () => {
  it('renders an internal href without a link-type icon', () => {
    render(<Anchor href="/">Home</Anchor>);

    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(iconsIn(link)).toHaveLength(0);
  });

  it('marks a known external domain with its own icon', () => {
    render(<Anchor href="https://github.com/LenySauzet">@LenySauzet</Anchor>);

    expect(iconsIn(screen.getByRole('link'))).toHaveLength(1);
  });

  it('marks an unknown external domain with the generic external icon', () => {
    render(<Anchor href="https://developer.mozilla.org">MDN Web Docs</Anchor>);

    expect(iconsIn(screen.getByRole('link'))).toHaveLength(1);
  });

  it('adds a directional arrow without losing the label', () => {
    render(
      <Anchor href="/" direction="left">
        Back
      </Anchor>
    );

    const link = screen.getByRole('link', { name: 'Back' });
    expect(iconsIn(link)).toHaveLength(1);
  });

  // MDX wraps a component's children in a paragraph as soon as they sit on
  // their own line, and `p` is globally mapped to muted prose type. That
  // paragraph used to keep its own colour while the icon kept the anchor's,
  // splitting one link across two colours.
  //
  // jsdom applies no Tailwind, so it cannot see the resulting colour; it can
  // only hold the override in place. The colour itself is asserted in a real
  // browser (see the PR).
  describe('children arriving wrapped in a paragraph, as MDX emits them', () => {
    it('still renders the label inside the link', () => {
      render(
        <Anchor href="/" direction="left">
          <p>Back</p>
        </Anchor>
      );

      const link = screen.getByRole('link', { name: 'Back' });
      expect(link.querySelector('p')).toHaveTextContent('Back');
      expect(iconsIn(link)).toHaveLength(1);
    });

    it('neutralises that paragraph so it cannot restyle the label', () => {
      render(
        <Anchor href="/">
          <p>Back</p>
        </Anchor>
      );

      expect(screen.getByRole('link').className).toContain('[&>p]:text-inherit');
    });
  });
});
