// rehype-pretty-code with Shiki transformers. Turbopack only accepts serialisable
// plugin options, and a transformer is a function, so they are added here, in a
// plugin next.config.ts can name by its path.
import { transformerNotationDiff } from '@shikijs/transformers';
import rehypePrettyCode from 'rehype-pretty-code';

// The log levels CodeBlock styles, as Callout has them.
export const VARIANTS = ['info', 'warning', 'danger'];

// rehype-pretty-code reads any "quoted" word in a fence's meta as one to highlight,
// so `variant="danger"` loses its quotes before that, as `variant=danger`.
export function filterMetaString(meta) {
  return meta.replace(/(^|\s)variant="([^"]*)"/, '$1variant=$2');
}

// A fence's `variant`, onto its <pre>. An unknown one, or a log carrying a diff or
// highlighted lines, which have no place in output, fails the build rather than
// rendering wrong.
export const transformerVariant = {
  name: 'variant',
  pre(node) {
    const meta = this.options.meta?.__raw ?? '';
    const variant = meta.match(/(?:^|\s)variant=(\S*)/)?.[1];
    if (variant === undefined) return;
    if (!VARIANTS.includes(variant)) {
      throw new Error(`Unknown code block variant "${variant}". Known: ${VARIANTS.join(', ')}.`);
    }
    if (/\[!code (?:\+\+|--)\]/.test(this.source) || /\{[\d\s,-]+\}/.test(meta)) {
      throw new Error(`A "${variant}" log takes no diff and no highlighted lines.`);
    }
    node.properties['data-variant'] = variant;
  },
};

export default function rehypeCode(options) {
  return rehypePrettyCode({
    ...options,
    filterMetaString: (meta) => filterMetaString(options.filterMetaString?.(meta) ?? meta),
    transformers: [...(options.transformers ?? []), transformerNotationDiff(), transformerVariant],
  });
}
