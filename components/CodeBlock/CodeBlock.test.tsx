import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from './CodeBlock';

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

function Fixture() {
  return (
    <CodeBlock data-rehype-pretty-code-figure="">
      <pre>
        <code>
          <span data-line>const a = 1;</span>
          <span data-line>const b = 2;</span>
        </code>
      </pre>
    </CodeBlock>
  );
}

describe('CodeBlock', () => {
  it('renders a copy button over a pretty-code figure', () => {
    render(<Fixture />);

    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
  });

  it('copies the code with newlines rebuilt from the line elements', async () => {
    render(<Fixture />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('const a = 1;\nconst b = 2;');
    // The button keeps its stable name; confirmation lands in the status region.
    expect(await screen.findByText('Copied to clipboard')).toBeInTheDocument();
  });

  it('exposes the code as a named, focusable-scroll region', () => {
    render(<Fixture />);

    expect(screen.getByRole('region', { name: 'Code' })).toBeInTheDocument();
  });

  it('passes a plain figure through without chrome', () => {
    render(
      <CodeBlock>
        <figcaption>An image caption</figcaption>
      </CodeBlock>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('An image caption')).toBeInTheDocument();
  });
});
