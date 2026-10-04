import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ConfusionMatrix from './ConfusionMatrix';

const matrix = [
  [259, 7, 3],
  [10, 141, 118],
  [9, 60, 437],
];
const labels = ['Normal', 'Viral', 'Bacterial'];

/** The tinted surface is the trigger inside the cell, not the cell itself. */
const cellsOf = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('td [style*="color-mix"]')];

describe('ConfusionMatrix', () => {
  it('is a table, so each count is read with its row and column', () => {
    render(<ConfusionMatrix matrix={matrix} labels={labels} />);

    for (const label of labels) {
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: '437' })).toBeInTheDocument();
  });

  it('tints every cell across the data\'s own range, not against an absolute', () => {
    const { container } = render(<ConfusionMatrix matrix={matrix} labels={labels} />);
    const mix = (text: string) =>
      Number(
        /--heat-to\) ([\d.]+)%/.exec(
          cellsOf(container).find((cell) => cell.textContent?.trim() === text)!.style
            .backgroundColor
        )![1]
      );

    expect(mix('437')).toBeGreaterThan(mix('259'));
    expect(mix('259')).toBeGreaterThan(mix('3'));
    // 3 against a peak of 437 is very nearly nothing, which is the point.
    expect(mix('3')).toBeLessThan(1);
  });

  /**
   * The ramp runs the other way in each theme, so one swap covers both: the
   * far end is dark on a light page and bright on a dark one, and
   * `--background` is the opposite of whichever it is. Measured at this
   * threshold, the worst of 36 cells is 8.5:1 in dark and 6.78:1 in light.
   */
  it('flips the count to the page colour only at the far end of the ramp', () => {
    const { container } = render(<ConfusionMatrix matrix={matrix} labels={labels} />);
    const cells = cellsOf(container);
    const mix = (cell: HTMLElement) =>
      Number(/--heat-to\) ([\d.]+)%/.exec(cell.style.backgroundColor)![1]) / 100;

    for (const cell of cells) {
      expect(cell).toHaveClass(mix(cell) > 0.58 ? 'text-background' : 'text-foreground');
    }
    // Both sides of the threshold are exercised, or the test proves nothing.
    expect(cells.some((c) => mix(c) > 0.58)).toBe(true);
    expect(cells.some((c) => mix(c) <= 0.58)).toBe(true);
  });

  it('survives a matrix of zeroes rather than dividing by one', () => {
    const { container } = render(
      <ConfusionMatrix
        matrix={[
          [0, 0],
          [0, 0],
        ]}
        labels={['a', 'b']}
      />
    );
    expect(cellsOf(container)).toHaveLength(4);
  });

  /** Every row answers "of all the Xs, how many were called Y". */
  it('names the row, the column and the share on each cell', async () => {
    const user = userEvent.setup();
    render(<ConfusionMatrix matrix={matrix} labels={labels} />);

    await user.hover(screen.getByRole('button', { name: '118' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      '118 of 269 viral called bacterial (44%)'
    );
  });
});
