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
        duration={0.3}
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
      duration={0.3}
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

  it('stops the wheel chaining past it to the page', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const surface = await open(user);

    // The surface covers the viewport and owns the scroll; without this the
    // wheel falls through to the page once the surface has nothing left to
    // scroll, and the page drifts behind the open image.
    expect(surface.className).toContain('overscroll-contain');
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
});
