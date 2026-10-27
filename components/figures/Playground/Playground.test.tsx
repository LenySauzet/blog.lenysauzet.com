import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Playground } from './Playground';

describe('Playground', () => {
  it('labels the controls and sets them beside what they drive, with an action by the label', () => {
    render(
      <Playground controls={<button type="button">Frequency</button>} action={<button type="button">Pause</button>}>
        <div>surface</div>
      </Playground>,
    );

    expect(screen.getByText('Uniforms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Frequency' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByText('surface')).toBeInTheDocument();
  });
});
