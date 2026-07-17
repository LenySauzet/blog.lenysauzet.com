import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Lightbox } from './Lightbox';

/**
 * Dismissal is asserted here rather than on ImageZoom: this surface has no
 * shared-layout morph, so its exit animation completes under jsdom, where every
 * element is zero-sized and Motion's layout projection never settles.
 */
function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <Lightbox
      open={open}
      onOpenChange={setOpen}
      title="Distance field breakdown"
      trigger={<button type="button">Open</button>}
    >
      <div data-testid="zoomed-content">zoomed</div>
    </Lightbox>
  );
}

/** Same surface, but with `open` driven from the outside. */
function Controlled({ open }: { open: boolean }) {
  return (
    <Lightbox
      open={open}
      onOpenChange={() => {}}
      title="Distance field breakdown"
      trigger={<button type="button">Open</button>}
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
  it('stays closed until the trigger is activated', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the trigger and names itself with the title', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = await open(user);

    expect(dialog).toHaveAccessibleName('Distance field breakdown');
  });

  it('renders its children while open', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = await open(user);

    expect(within(dialog).getByTestId('zoomed-content')).toBeInTheDocument();
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

    const dialog = await open(user);
    await user.click(dialog);

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });

  it('keeps the page locked for as long as it is on screen', async () => {
    const { rerender } = render(<Controlled open />);

    await waitFor(() => expect(document.body.style.pointerEvents).toBe('none'));

    rerender(<Controlled open={false} />);

    // The surface is still animating out, and the page must stay locked until
    // it is gone: the morph targets the box the trigger held at dismissal, so
    // scrolling now would move that target and make the image jump on unmount.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.pointerEvents).toBe('none');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(document.body.style.pointerEvents).toBe('');
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
