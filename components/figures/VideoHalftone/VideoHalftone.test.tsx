import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import VideoHalftone from './VideoHalftone';

vi.mock('@/lib/shader', async (original) => ({
  ...(await original<typeof import('@/lib/shader')>()),
  createShader: () => ({ sync: () => {}, dispose: () => {} }),
}));

describe('VideoHalftone', () => {
  it('stands as one image, named, under a pixel size, a radius and a pause', () => {
    render(<VideoHalftone />);

    expect(screen.getByRole('img', { name: 'Clouds drifting, pixelated, with a white dot in every cell' })).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument();
  });
});
