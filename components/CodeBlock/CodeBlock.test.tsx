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

function Long({ lines }: { lines: number }) {
  return (
    <CodeBlock data-rehype-pretty-code-figure="">
      <pre>
        <code>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} data-line>{`line ${i + 1}`}</span>
          ))}
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

  it('leaves the lines a diff removes out of the copied code', async () => {
    render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <pre>
          <code>
            <span data-line className="diff remove">old();</span>
            <span data-line className="diff add">next();</span>
          </code>
        </pre>
      </CodeBlock>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('next();');
  });

  it('folds a long block and unfolds it on demand', async () => {
    render(<Long lines={25} />);
    const toggle = screen.getByRole('button', { name: 'Show all 25 lines' });
    const region = screen.getByRole('region', { name: 'Code' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveClass('[&_pre]:max-h-[calc(16lh+0.75rem)]');

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(region).not.toHaveClass('[&_pre]:max-h-[calc(16lh+0.75rem)]');
  });

  it('leaves a block of 24 lines or fewer unfolded', () => {
    render(<Long lines={24} />);

    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
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
