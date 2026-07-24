import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Lightbox } from './Lightbox';

// Dismissal is asserted here, not on ImageZoom: this surface has no shared-layout
// morph, so its exit completes under jsdom's zero-sized boxes.
function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <>
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
    </>
  );
}

function Controlled({ open }: { open: boolean }) {
  return (
    <Lightbox
      open={open}
      onOpenChange={() => {}}
      title="Distance field breakdown"
    >
      <div>zoomed</div>
    </Lightbox>
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

    // Why this owns its surface instead of a dialog primitive: Radix disables
    // <body> pointer events while its layer is mounted, freezing the page for
    // the exit. Here nothing touches the page; `overscroll-contain` holds it.
    expect(document.body.style.pointerEvents).toBe('');

    rerender(<Controlled open={false} />);
    expect(document.body.style.pointerEvents).toBe('');
  });

  it('takes focus when it opens', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);

    // aria-modal claims the page is gone, so focus must leave the trigger.
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

    // Focus can leave by means the surface doesn't mediate; yanking it back on
    // dismiss would discard the reader's intent.
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(elsewhere).toHaveFocus();
  });
});
