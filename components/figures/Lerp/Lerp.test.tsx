import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Lerp from './Lerp';

describe('Lerp', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: IntersectionObserverCallback) {}
        observe() {
          this.report([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
        }
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stands as one image, named', () => {
    render(<Lerp />);

    expect(screen.getByRole('img', { name: 'A point interpolated from P0 to P1' })).toBeInTheDocument();
  });

  it('holds still under reduced motion, at a t worth reading', () => {
    render(<Lerp />);

    expect(screen.getByText('t = 0.73')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('plays once asked, and pauses again', async () => {
    const user = userEvent.setup();
    render(<Lerp />);

    await user.click(screen.getByRole('button', { name: 'Play' }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));

    expect(screen.queryByText('t = 0.73')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    const held = screen.getByText(/^t = /).textContent;
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));

    expect(screen.getByText(/^t = /).textContent).toBe(held);
  });
});
