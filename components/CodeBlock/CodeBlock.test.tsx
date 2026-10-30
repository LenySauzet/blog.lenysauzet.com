import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from './CodeBlock';

const writeText = vi.fn().mockResolvedValue(undefined);
// jsdom has no scrollIntoView.
const scrollIntoView = vi.fn();

const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
});

beforeEach(() => {
  writeText.mockClear();
  scrollIntoView.mockReset();
  Element.prototype.scrollIntoView = scrollIntoView;
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

// rehype-pretty-code's markup: a title, token spans inside each line, and a
// newline between lines.
function Long({ lines }: { lines: number }) {
  return (
    <CodeBlock data-rehype-pretty-code-figure="">
      <figcaption data-rehype-pretty-code-title="">long.ts</figcaption>
      <pre>
        <code>
          {Array.from({ length: lines }, (_, i) => [
            <span key={i} data-line>
              <span>const</span>
              <span>{` line${i + 1} = ${i + 1};`}</span>
            </span>,
            '\n',
          ])}
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

  it('counts a diff in the header, and says it in words', () => {
    render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <figcaption data-rehype-pretty-code-title="">diff.ts</figcaption>
        <pre className="has-diff">
          <code>
            <span data-line className="diff remove">a = 1;</span>
            <span data-line className="diff add">a = 2;</span>
            <span data-line className="diff add">b = 3;</span>
          </code>
        </pre>
      </CodeBlock>
    );

    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('−1')).toBeInTheDocument();
    expect(screen.getByText('2 added, 1 removed')).toHaveClass('sr-only');
  });

  it('shows no count on a block without a diff', () => {
    render(<Long lines={3} />);

    expect(screen.queryByText(/added/)).not.toBeInTheDocument();
  });

  it('leaves the zero side out of the words', () => {
    render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <figcaption data-rehype-pretty-code-title="">add.ts</figcaption>
        <pre className="has-diff">
          <code>
            <span data-line className="diff add">a = 1;</span>
          </code>
        </pre>
      </CodeBlock>
    );

    expect(screen.getByText('1 added')).toHaveClass('sr-only');
  });

  it.each([
    ['info', 'Info'],
    ['warning', 'Warning'],
    ['danger', 'Error'],
  ])('names an untitled %s block %s, its colour not being enough', (variant, heading) => {
    render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <pre data-variant={variant}>
          <code>
            <span data-line>A log line</span>
          </code>
        </pre>
      </CodeBlock>
    );

    expect(screen.getByRole('region', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(heading)).toBeInTheDocument();
  });

  it('keeps a given title, and still says the level before it', () => {
    render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <figcaption data-rehype-pretty-code-title="">next build</figcaption>
        <pre data-variant="warning">
          <code>
            <span data-line>A log line</span>
          </code>
        </pre>
      </CodeBlock>
    );

    expect(screen.getByRole('region', { name: 'Warning: next build' })).toBeInTheDocument();
    expect(screen.getByText('Warning:')).toHaveClass('sr-only');
  });

  it('carries the variant the fence names onto the figure', () => {
    const { container } = render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <pre data-variant="danger">
          <code>
            <span data-line>TypeError: undefined</span>
          </code>
        </pre>
      </CodeBlock>
    );

    expect(container.querySelector('figure')).toHaveAttribute('data-variant', 'danger');
  });

  it('drops the space a stripped diff notation leaves at the end of a line', async () => {
    render(
      <CodeBlock data-rehype-pretty-code-figure="">
        <pre>
          <code>
            <span data-line className="diff add">{'const a = 2; '}</span>
          </code>
        </pre>
      </CodeBlock>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('const a = 2;');
  });

  it('folds a long block and unfolds it on demand', async () => {
    render(<Long lines={25} />);
    const toggle = screen.getByRole('button', { name: 'Show all 25 lines' });
    const region = screen.getByRole('region', { name: 'long.ts' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveAttribute('data-folded');

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(region).not.toHaveAttribute('data-folded');
  });

  it('brings the block back into view once it has folded', async () => {
    render(<Long lines={25} />);
    const region = screen.getByRole('region');
    // Measured before the fold, the block would still be its unfolded height.
    let foldedWhenScrolled = false;
    scrollIntoView.mockImplementation(() => {
      foldedWhenScrolled = region.hasAttribute('data-folded');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Show all 25 lines' }));
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(foldedWhenScrolled).toBe(true);
  });

  // Find in page scrolls the folded <pre> to the match.
  it('unfolds when something scrolls inside the folded block', () => {
    render(<Long lines={25} />);
    const pre = screen.getByRole('region').querySelector('pre')!;

    pre.scrollTop = 120;
    fireEvent.scroll(pre);

    expect(screen.getByRole('region')).not.toHaveAttribute('data-folded');
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
