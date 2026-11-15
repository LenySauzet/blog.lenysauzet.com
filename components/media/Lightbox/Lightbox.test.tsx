import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useLightboxStore } from '@/hooks/use-lightbox-store';

import { Lightbox } from './Lightbox';

// Motion caches reduced motion by import order, so an uncollapsed exit races `waitFor`.
const Instantly = ({ children }: { children: ReactNode }) => (
  <MotionConfig transition={{ duration: 0 }}>{children}</MotionConfig>
);

function Covered() {
  return <output data-testid="covered">{String(useLightboxStore((state) => state.open > 0))}</output>;
}

function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <Instantly>
      <Covered />
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Lightbox
        open={open}
        onOpenChange={setOpen}
        title="Distance field breakdown"
      >
        <div data-testid="zoomed-content">zoomed</div>
      </Lightbox>
    </Instantly>
  );
}

function Controlled({ open }: { open: boolean }) {
  return (
    <Instantly>
      <Lightbox
        open={open}
        onOpenChange={() => {}}
        title="Distance field breakdown"
      >
        <div>zoomed</div>
      </Lightbox>
    </Instantly>
  );
}

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Open' }));
  return screen.findByRole('dialog');
};

describe('Lightbox', () => {
  it('stays closed until asked to open', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names itself with the title', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);

    expect(surface).toHaveAccessibleName('Distance field breakdown');
    expect(surface).toHaveAttribute('aria-modal', 'true');
  });

  it('renders its children while open', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);

    expect(within(surface).getByTestId('zoomed-content')).toBeInTheDocument();
  });

  it('dismisses on Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await open(user);
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('dismisses when clicking anywhere on the surface', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);
    await user.click(surface);

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('never takes pointer events away from the page', async () => {
    const { rerender } = render(<Controlled open />);
    await screen.findByRole('dialog');

    // Radix disables <body> pointer events for its whole exit; this surface must not.
    expect(document.body.style.pointerEvents).toBe('');

    rerender(<Controlled open={false} />);
    expect(document.body.style.pointerEvents).toBe('');
  });

  it('takes focus when it opens', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);

    expect(surface).toHaveFocus();
  });

  it('does not let Tab escape to the page behind', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <a href="/elsewhere">Behind the surface</a>
      </>
    );

    const surface = await open(user);
    await user.tab();

    expect(surface).toHaveFocus();
    expect(
      screen.getByRole('link', { name: 'Behind the surface' })
    ).not.toHaveFocus();
  });

  it('returns focus to the trigger once dismissed', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await open(user);
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
    );
  });

  it('leaves focus alone if the reader moved it elsewhere', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <button type="button">Elsewhere</button>
      </>
    );

    await open(user);

    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(elsewhere).toHaveFocus();
  });

  it('tells the rest of the page while it covers it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByTestId('covered')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByTestId('covered')).toHaveTextContent('true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByTestId('covered')).toHaveTextContent('false'));
  });

  it('holds focus on the surface while its parent re-renders with a new callback', () => {
    const focused = vi.fn();
    // A focusable trigger, so a re-run of the effect would hand focus back to it.
    const surface = (open: boolean, callback: () => void) => (
      <Instantly>
        <button type="button">Trigger</button>
        <Lightbox open={open} onOpenChange={callback} title="Steady">
          <div>zoomed</div>
        </Lightbox>
      </Instantly>
    );
    const { rerender } = render(surface(false, () => {}));
    screen.getByRole('button', { name: 'Trigger' }).focus();
    rerender(surface(true, () => {}));
    const dialog = screen.getByRole('dialog');
    dialog.addEventListener('focus', focused);
    rerender(surface(true, () => {}));
    rerender(surface(true, () => {}));
    expect(focused).not.toHaveBeenCalled();
    expect(dialog).toHaveFocus();
  });
});
