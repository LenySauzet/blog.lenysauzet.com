import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Halftone from './Halftone';

describe('Halftone', () => {
  it('stands as one image, named, under a radius, a cell count and three switches', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<Halftone />);

    expect(screen.getByRole('img', { name: "Vermeer's Girl with a Pearl Earring, drawn as a halftone" })).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    for (const name of ['Dots', 'Pixelate', 'Size by brightness'])
      expect(screen.getByRole('switch', { name })).toBeInTheDocument();
  });
});
