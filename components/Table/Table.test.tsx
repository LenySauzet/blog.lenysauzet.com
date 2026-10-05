import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { components } from '@/mdx-components';

const Table = components.table as React.ComponentType<React.ComponentProps<'table'>>;
const Row = components.tr as React.ComponentType<React.ComponentProps<'tr'>>;
const Cell = components.td as React.ComponentType<React.ComponentProps<'td'>>;
const Head = components.th as React.ComponentType<React.ComponentProps<'th'>>;

describe('a markdown table', () => {
  it('renders as one, so a screen reader reads rows and columns', () => {
    render(
      <Table>
        <tbody>
          <Row>
            <Cell>262.04</Cell>
          </Row>
        </tbody>
      </Table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '262.04' })).toBeInTheDocument();
  });

  /**
   * GFM carries a column's alignment as an inline style on every cell it
   * applies to, so a mapping written as `({ children }) => ...` renders a
   * table that silently ignores its own delimiter row.
   */
  it.each([
    ['td', (props: React.ComponentProps<'td'>) => <Cell {...props} />],
    ['th', (props: React.ComponentProps<'th'>) => <Head {...props} />],
  ])('keeps the alignment GFM puts on a %s', (_name, Mapped) => {
    render(
      <table>
        <tbody>
          <tr>
            <Mapped style={{ textAlign: 'right' }}>1.0</Mapped>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByText('1.0')).toHaveStyle({ textAlign: 'right' });
  });
});
