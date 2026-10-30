import type { Element, Root } from 'hast';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';

import { codeTheme } from '@/config/code-theme';

import rehypeCode, { VARIANTS } from './rehype-code.mjs';

// A fence as remark-rehype hands it over: <pre><code> with the fence's meta as data.
async function render(code: string, meta: string, lang = 'txt') {
  const tree: Root = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: [`language-${lang}`] },
            data: { meta },
            children: [{ type: 'text', value: code }],
          },
        ],
      },
    ],
  };
  await unified().use(rehypeCode, { theme: codeTheme, keepBackground: false }).run(tree);
  return tree;
}

function find(node: Root | Element, test: (element: Element) => boolean): Element[] {
  return node.children.flatMap((child) =>
    child.type === 'element' ? [...(test(child) ? [child] : []), ...find(child, test)] : []
  );
}

describe('rehypeCode', () => {
  it.each(VARIANTS)('reads variant="%s" off the fence onto its <pre>', async (variant) => {
    const tree = await render('A log line', `title="Log" variant="${variant}"`);

    expect(find(tree, (el) => el.tagName === 'pre')[0].properties.dataVariant).toBe(variant);
  });

  it('fails on a log carrying a diff or highlighted lines', async () => {
    await expect(render('a = 1; // [!code ++]', 'variant="warning"', 'ts')).rejects.toThrow(
      'A "warning" log takes no diff and no highlighted lines.'
    );
    await expect(render('a\nb', 'variant="info" {2}')).rejects.toThrow('A "info" log');
  });

  it('does not take the quoted variant for a word to highlight', async () => {
    const tree = await render('Danger: the danger zone', 'variant="danger"');

    expect(find(tree, (el) => 'data-highlighted-chars' in el.properties)).toHaveLength(0);
  });

  it('fails on a variant no block is styled for', async () => {
    await expect(render('x', 'variant="success"')).rejects.toThrow('Unknown code block variant "success"');
  });

  it('marks the lines Shiki diff notation names', async () => {
    const tree = await render('a = 1; // [!code --]\na = 2; // [!code ++]', '', 'ts');
    const classes = find(tree, (el) => 'data-line' in el.properties).map((el) => el.properties.className);

    expect(classes).toEqual([['diff', 'remove'], ['diff', 'add']]);
  });
});
