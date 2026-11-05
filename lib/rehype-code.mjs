import { transformerNotationDiff } from '@shikijs/transformers';
import rehypePrettyCode from 'rehype-pretty-code';

export const VARIANTS = ['info', 'warning', 'danger'];

const PLAIN = ['txt', 'text', 'plaintext'];

const NOTATION = /\[!code (?:\+\+|--)(:\d+)?\]/i;

const notationForm = {
  name: 'notation-form',
  preprocess(code) {
    for (const line of code.split('\n')) {
      const match = line.match(NOTATION);
      if (!match) continue;
      const before = line.slice(0, match.index).replace(/(?:\/\/|#|--|\/\*|<!--|;|%)\s*$/, '');
      if (match[1] || !before.trim() || PLAIN.includes(this.options.lang)) {
        throw new Error(
          `Diff notation goes at the end of the line it marks, in a language with comments: "${line.trim()}".`
        );
      }
    }
  },
};

// rehype-pretty-code highlights any "quoted" word in a fence's meta.
function filterMetaString(meta) {
  return meta.replace(/(^|\s)variant="([^"]*)"/, '$1variant=$2');
}

const variant = {
  name: 'variant',
  pre(node) {
    const meta = this.options.meta?.__raw ?? '';
    const name = meta.match(/(?:^|\s)variant=(\S*)/)?.[1];
    if (name === undefined) return;
    if (!VARIANTS.includes(name)) {
      throw new Error(`Unknown code block variant "${name}". Known: ${VARIANTS.join(', ')}.`);
    }
    if (NOTATION.test(this.source) || /\{[\d\s,-]+\}/.test(meta)) {
      throw new Error(`A "${name}" log takes no diff and no highlighted lines.`);
    }
    node.properties['data-variant'] = name;
  },
};

export default function rehypeCode(options) {
  return rehypePrettyCode({
    ...options,
    filterMetaString,
    transformers: [notationForm, transformerNotationDiff(), variant],
  });
}
