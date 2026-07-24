import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ImageZoom from './ImageZoom';

// next/image validates remotePatterns against runtime config that Vitest does
// not load. A plain img keeps these tests about the zoom behaviour.
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => <img src={src} alt={alt} className={className} />,
}));

function renderZoom() {
  return render(
    <ImageZoom
      src="https://cdn.test/diagram.png"
      alt="Distance field breakdown"
      width={960}
      height={731}
    />
  );
}

const openLightbox = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Distance field breakdown' }));
  return screen.findByRole('dialog');
};

describe('ImageZoom', () => {
  it('stays closed until the trigger is activated', () => {
    renderZoom();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on click', async () => {
    const user = userEvent.setup();
    renderZoom();

    const dialog = await openLightbox(user);

    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName('Distance field breakdown');
  });

  it('opens from the keyboard', async () => {
    const user = userEvent.setup();
    renderZoom();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('does not announce the zoomed copy twice', async () => {
    const user = userEvent.setup();
    renderZoom();

    const dialog = await openLightbox(user);

    // The dialog is already named by its title; the zoomed image is decorative.
    expect(
      within(dialog).queryByRole('img', { name: 'Distance field breakdown' })
    ).not.toBeInTheDocument();
  });

  it('shows the same image zoomed in', async () => {
    const user = userEvent.setup();
    renderZoom();

    const dialog = await openLightbox(user);

    expect(within(dialog).getByRole('presentation')).toHaveAttribute(
      'src',
      'https://cdn.test/diagram.png'
    );
  });
});

// Dismissal lives in Lightbox.test.tsx. It cannot be asserted here: the shared
// layoutId morph never completes under jsdom, where every element measures zero,
// so the subtree stays mounted. A real browser unmounts it — verified manually.
