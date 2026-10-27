import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Pipeline from './Pipeline';

describe('Pipeline', () => {
  it('stands as one image, named', () => {
    render(<Pipeline />);

    expect(
      screen.getByRole('img', { name: 'The graphics pipeline, from the CPU to the frame buffer' }),
    ).toBeInTheDocument();
  });

  it('names both processors and every stage', () => {
    render(<Pipeline />);

    for (const name of ['CPU', 'GPU', 'Vertex data', 'Vertex shader', 'Rasterizer', 'Fragment shader', 'Frame buffer'])
      expect(screen.getByText(name)).toBeInTheDocument();
  });
});
