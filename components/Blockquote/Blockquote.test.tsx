import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Blockquote from './Blockquote';

describe('Blockquote', () => {
  it('renders its children inside a <blockquote>', () => {
    render(
      <Blockquote>
        <p>A pulled quote</p>
      </Blockquote>
    );

    expect(screen.getByText('A pulled quote').closest('blockquote')).not.toBeNull();
  });
});
