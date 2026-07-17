import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Lightbox } from './Lightbox';

/**
 * Dismissal is asserted here rather than on ImageZoom: this surface carries no
 * shared-layout morph, so its exit completes under jsdom, where every element is
 * zero-sized and Motion's layout projection never settles.
 */
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

/** Same surface, but with `open` driven from the outside. */
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

    // The reason this component owns its own surface instead of using a dialog
    // primitive. Radix disables pointer events on <body> for as long as its
    // layer is mounted, and the layer must outlive the dismiss to animate out,
    // freezing the page for the length of the exit. Nothing here ever touches
    // the page: `overscroll-contain` is what keeps it still while open.
    expect(document.body.style.pointerEvents).toBe('');

    rerender(<Controlled open={false} />);
    expect(document.body.style.pointerEvents).toBe('');
  });

  it('takes focus when it opens', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);

    // aria-modal claims the rest of the page does not exist. Leaving focus on
    // the trigger outside would make that a lie, and would let the next Tab
    // land on content the surface only visually covers.
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

    // Focus can leave by means the surface does not mediate — a click, the
    // browser chrome. Yanking it back on dismiss would discard the reader's
    // intent.
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    elsewhere.focus();
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(elsewhere).toHaveFocus();
  });
});
