import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import siteConfig from '@/config/site';
import { measureImage } from '@/lib/image-utils';

import Image from './Image';
import type { ImageZoomProps } from './ImageZoom';

vi.mock('@/lib/image-utils', () => ({
  measureImage: vi.fn(async () => ({ width: 960, height: 731, measured: true })),
}));

// Stub the client island: these tests cover what the server resolves and hands
// over, not the zoom interaction.
vi.mock('./ImageZoom', () => ({
  default: (props: ImageZoomProps) => (
    <img
      data-testid="zoom"
      src={props.src}
      alt={props.alt}
      width={props.width}
      height={props.height}
      data-quality={props.quality}
    />
  ),
}));

const probe = vi.mocked(measureImage);

describe('Image', () => {
  beforeEach(() => {
    probe.mockClear();
  });

  it('resolves a relative src against the CDN images prefix', async () => {
    render(await Image({ src: 'post/diagram.png', alt: 'A diagram' }));

    expect(screen.getByTestId('zoom')).toHaveAttribute(
      'src',
      `${siteConfig.cdnUrl}/images/post/diagram.png`
    );
  });

  it('looks up dimensions when the post omits them', async () => {
    render(await Image({ src: 'post/diagram.png', alt: 'A diagram' }));

    expect(probe).toHaveBeenCalledWith(`${siteConfig.cdnUrl}/images/post/diagram.png`);
    const image = screen.getByTestId('zoom');
    expect(image).toHaveAttribute('width', '960');
    expect(image).toHaveAttribute('height', '731');
  });

  it('skips the network entirely when both dimensions are given', async () => {
    render(
      await Image({
        src: 'post/diagram.png',
        alt: 'A diagram',
        width: 800,
        height: 600,
      })
    );

    expect(probe).not.toHaveBeenCalled();
    expect(screen.getByTestId('zoom')).toHaveAttribute('width', '800');
  });

  it('still looks up dimensions when only one of the two is given', async () => {
    render(
      await Image({ src: 'post/diagram.png', alt: 'A diagram', width: 800 })
    );

    expect(probe).toHaveBeenCalled();
  });

  it('captions the figure with the alt text', async () => {
    render(
      await Image({ src: 'post/diagram.png', alt: 'Distance field breakdown' })
    );

    const caption = screen.getByText('Distance field breakdown');
    expect(caption.tagName).toBe('FIGCAPTION');
    expect(caption.closest('figure')).toBeInTheDocument();
  });

  it('defaults quality to the highest allowed value', async () => {
    render(await Image({ src: 'post/diagram.png', alt: 'A diagram' }));

    expect(screen.getByTestId('zoom')).toHaveAttribute('data-quality', '100');
  });

  // An asset can vanish years after a post shipped. Taking every later deploy down
  // with it punishes work that has nothing to do with the breakage, so the figure
  // reserves a fallback ratio and the build says so instead.
  it('still renders when the asset can no longer be measured', async () => {
    probe.mockResolvedValueOnce({ width: 1600, height: 900, measured: false });

    render(await Image({ src: 'post/gone.png', alt: 'A diagram' }));

    const image = screen.getByTestId('zoom');
    expect(image).toHaveAttribute('width', '1600');
    expect(image).toHaveAttribute('height', '900');
    expect(screen.getByText('A diagram').tagName).toBe('FIGCAPTION');
  });
});
