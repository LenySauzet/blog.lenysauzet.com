import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@/components/theme-provider';

import { ModeToggle } from './ModeToggle';

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="dark">
      <ModeToggle />
    </ThemeProvider>
  );
}

describe('ModeToggle', () => {
  it('exposes a labelled control', () => {
    renderToggle();

    expect(
      screen.getByRole('button', { name: 'Toggle theme' })
    ).toBeInTheDocument();
  });

  it('offers light, dark and system once opened', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

    for (const name of ['Light', 'Dark', 'System']) {
      expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument();
    }
  });
});
