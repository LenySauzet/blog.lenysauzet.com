import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PanelReveal } from './PanelReveal';

describe('PanelReveal', () => {
  // `vitest-setup` forces reduced motion, so this is the branch jsdom can reach, and
  // it is the one that matters: a curtain held still is a covered panel, not a reveal.
  it('renders nothing under reduced motion', () => {
    const { container } = render(<PanelReveal />);
    expect(container).toBeEmptyDOMElement();
  });
});
