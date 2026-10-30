// rehype-pretty-code with Shiki transformers. Turbopack only accepts serialisable
// plugin options, and a transformer is a function, so they are added here, in a
// plugin next.config.ts can name by its path.
import { transformerNotationDiff } from '@shikijs/transformers';
import rehypePrettyCode from 'rehype-pretty-code';

export default function rehypeCode(options) {
  return rehypePrettyCode({
    ...options,
    transformers: [...(options.transformers ?? []), transformerNotationDiff()],
  });
}
