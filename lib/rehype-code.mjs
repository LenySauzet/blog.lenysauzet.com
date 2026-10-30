// rehype-pretty-code with Shiki transformers. Turbopack only accepts serialisable
// plugin options, and a transformer is a function, so they are added here, in a
// plugin next.config.ts can name by its path.
import { transformerNotationDiff } from '@shikijs/transformers';
import rehypePrettyCode from 'rehype-pretty-code';

// The variants CodeBlock styles.
const VARIANTS = ['danger'];

// rehype-pretty-code reads any "quoted" word in a fence's meta as one to highlight,
// so `variant="danger"` loses its quotes before that, as `variant=danger`.
export function filterMetaString(meta) {
  return meta.replace(/(^|\s)variant="([^"]*)"/, '$1variant=$2');
}

// `variant="danger"` on a fence, onto its <pre>. An unknown one fails the build
// rather than leaving a block that looks like any other.
export const transformerVariant = {
  name: 'variant',
  pre(node) {
    const variant = this.options.meta?.__raw?.match(/(?:^|\s)variant=(\S*)/)?.[1];
    if (variant === undefined) return;
    if (!VARIANTS.includes(variant)) {
      throw new Error(`Unknown code block variant "${variant}". Known: ${VARIANTS.join(', ')}.`);
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
