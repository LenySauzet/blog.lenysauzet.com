import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Playground } from './Playground';
import { Shader } from './Shader';

describe('Shader', () => {
  it('stands as one image, named, and says so when the browser has no WebGL', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<Shader fragment="void main() {}" label="A lit surface" uniforms={{}} />);

    expect(screen.getByRole('img', { name: 'A lit surface' })).toHaveTextContent(/needs WebGL/);
  });
});

describe('Playground', () => {
  it('sets the controls under a heading beside what they drive', () => {
    render(
      <Playground controls={<button type="button">Frequency</button>}>
        <div>surface</div>
      </Playground>,
    );

    expect(screen.getByText('Uniforms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Frequency' })).toBeInTheDocument();
    expect(screen.getByText('surface')).toBeInTheDocument();
  });
});
