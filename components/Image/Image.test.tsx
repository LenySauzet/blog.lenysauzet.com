import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import siteConfig from '@/config/site';
import { getImageDimensions } from '@/lib/image-utils';

import Image from './Image';
import type { ImageZoomProps } from './ImageZoom';

vi.mock('@/lib/image-utils', () => ({
  getImageDimensions: vi.fn(async () => ({ width: 960, height: 731 })),
}));

// Stands in for the client island: these tests are about what the server
// resolves and hands over, not about the zoom interaction.
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

const probe = vi.mocked(getImageDimensions);

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
});
