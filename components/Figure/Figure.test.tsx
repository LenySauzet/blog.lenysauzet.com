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

  /** It is a frame, not a box: given only content, it adds nothing around it. */
  it('wraps its content in nothing at all when given neither caption nor controls', () => {
    render(
      <Figure>
        <p>content</p>
      </Figure>
    );

    const figure = screen.getByRole('figure');
    expect(figure.querySelector('figcaption')).toBeNull();
    expect(figure.children).toHaveLength(1);
    expect(figure.firstElementChild?.tagName).toBe('P');
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
