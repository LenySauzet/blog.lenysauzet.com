import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

// jsdom applies no Tailwind, so these assert which classes reach the element,
// not what they paint. Whether the class exists in the compiled CSS is a build
// concern; the glow silently never generated once, and only reading the built
// stylesheet caught it.
describe('Button', () => {
  it('is a real button, and says so to assistive tech', () => {
    render(<Button>Press</Button>);

    expect(screen.getByRole('button', { name: 'Press' })).toBeInTheDocument();
  });

  it('carries the pointer cursor Tailwind preflight drops', () => {
    render(<Button>Press</Button>);

    expect(screen.getByRole('button').className).toContain('cursor-pointer');
  });

  it('defaults to the primary variant, bevel and glow included', () => {
    render(<Button>Press</Button>);
    const cls = screen.getByRole('button').className;

    expect(cls).toContain('bg-primary');
    expect(cls).toContain('shadow-[var(--shadow-bevel)]');
    expect(cls).toContain('hover:shadow-[var(--shadow-bevel),0_2px_40px_-4px');
  });

  // The press animates `scale`, which Tailwind v4 sets as its own property, so
  // the transition has to name it. Naming only `transform` animates nothing.
  it('transitions the property the press actually changes', () => {
    render(<Button>Press</Button>);
    const cls = screen.getByRole('button').className;

    expect(cls).toContain('active:scale-');
    // Tailwind encodes spaces as underscores, so `scale` is followed by `_`.
    expect(cls).toMatch(/\[transition:[^\]]*,scale_/);
  });

  it('drops the hand cursor and the press when disabled', () => {
    render(<Button disabled>Press</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:cursor-not-allowed');
  });

  it('renders as the child element when asked', () => {
    render(
      <Button asChild>
        <a href="/somewhere">Go</a>
      </Button>
    );

    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('href', '/somewhere');
    expect(link.className).toContain('bg-primary');
  });

  it('reflects variant and size for styling hooks', () => {
    render(
      <Button variant="ghost" size="icon" aria-label="Menu">
        icon
      </Button>
    );
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'icon');
  });
});
