import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ConfusionMatrix from './ConfusionMatrix';

const matrix = [
  [259, 7, 3],
  [10, 141, 118],
  [9, 60, 437],
];
const labels = ['Normal', 'Viral', 'Bacterial'];

const cellsOf = (container: HTMLElement) =>
  [...container.querySelectorAll('td')].filter((td) => td.textContent?.trim());

describe('ConfusionMatrix', () => {
  it('is a table, so each count is read with its row and column', () => {
    render(<ConfusionMatrix matrix={matrix} labels={labels} />);

    for (const label of labels) {
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole('cell', { name: '437' })).toBeInTheDocument();
  });

  it('tints every cell against the peak, so the scale is the data and not the count', () => {
    const { container } = render(<ConfusionMatrix matrix={matrix} labels={labels} />);
    const mix = (text: string) =>
      Number(
        /--primary\) ([\d.]+)%/.exec(
          cellsOf(container).find((td) => td.textContent?.trim() === text)!.style.backgroundColor
        )![1]
      );

    expect(mix('437')).toBeGreaterThan(mix('259'));
    expect(mix('259')).toBeGreaterThan(mix('3'));
    // 3 against a peak of 437 is very nearly nothing, which is the point.
    expect(mix('3')).toBeLessThan(1);
  });

  /**
   * The cap is what lets every cell keep one text colour. Inverting the hottest
   * ones instead measured 3.79:1 in both themes and 2.16:1 in light, so a
   * regression here is a contrast failure rather than a cosmetic one.
   */
  it('never mixes the accent deep enough to fight the body text', () => {
    const { container } = render(<ConfusionMatrix matrix={matrix} labels={labels} />);
    const deepest = Math.max(
      ...cellsOf(container).map((td) => Number(/--primary\) ([\d.]+)%/.exec(td.style.backgroundColor)![1]))
    );

    expect(deepest).toBeLessThanOrEqual(45);
    for (const cell of cellsOf(container)) {
      expect(cell).toHaveClass('text-foreground');
    }
  });

  it('survives a matrix of zeroes rather than dividing by one', () => {
    const { container } = render(<ConfusionMatrix matrix={[[0, 0], [0, 0]]} labels={['a', 'b']} />);
    expect(cellsOf(container)).toHaveLength(4);
  });
});
