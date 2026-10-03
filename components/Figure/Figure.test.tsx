import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Figure from './Figure';

describe('Figure', () => {
  it('is a figure, and its caption is the figcaption', () => {
    render(<Figure caption="What this shows">content</Figure>);

    const figure = screen.getByRole('figure');
    expect(figure).toHaveTextContent('content');
    expect(figure.querySelector('figcaption')).toHaveTextContent('What this shows');
  });

  it('draws no caption and no controls row when given neither', () => {
    const { container } = render(<Figure>content</Figure>);

    expect(container.querySelector('figcaption')).toBeNull();
    // The surface, and nothing beside it.
    expect(screen.getByRole('figure').children).toHaveLength(1);
  });

  /**
   * A control shrinks to its content in a plain flex row, which left the
   * sampling diagram's slider rendered as a label and a readout jammed
   * together with no bar between them.
   */
  it('lets each control stretch rather than shrink to its content', () => {
    render(
      <Figure controls={<input aria-label="Steps" />}>
        content
      </Figure>
    );

    const row = screen.getByLabelText('Steps').parentElement!;
    expect(row.className).toContain('[&>*]:flex-1');
  });
});
