import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PanelReveal } from './PanelReveal';

describe('PanelReveal', () => {
  it('hides its layers in CSS rather than skipping them on the client', () => {
    const { container } = render(<PanelReveal />);
    const layers = [...container.children];

    expect(layers).toHaveLength(2);
    for (const layer of layers) expect(layer).toHaveClass('motion-reduce:hidden');
  });
});
