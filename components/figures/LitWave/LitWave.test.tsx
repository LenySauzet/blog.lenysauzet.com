import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LitWave from './LitWave';

describe('LitWave', () => {
  it('stands as one image, named, driven by a frequency and a light', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<LitWave />);

    expect(screen.getByRole('img', { name: 'A rippled surface, lit from one side' })).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByRole('switch', { name: 'Normals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });
});
