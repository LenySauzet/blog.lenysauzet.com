// rehype-pretty-code with Shiki transformers. Turbopack only accepts serialisable
// plugin options, and a transformer is a function, so they are added here, in a
// plugin next.config.ts can name by its path.
import { transformerNotationDiff } from '@shikijs/transformers';
import rehypePrettyCode from 'rehype-pretty-code';

// The log levels CodeBlock styles, as Callout has them.
export const VARIANTS = ['info', 'warning', 'danger'];

const PLAIN = ['txt', 'text', 'plaintext'];

// Shiki's diff notation, in any form it accepts.
const NOTATION = /\[!code (?:\+\+|--)(:\d+)?\]/i;

// Only a notation ending the line it marks: the Markdown twin mirrors that one, and
// the others (a range, or a comment alone marking the line below) read ambiguously.
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

// rehype-pretty-code reads any "quoted" word in a fence's meta as one to highlight,
// so `variant="danger"` loses its quotes before that, as `variant=danger`.
function filterMetaString(meta) {
  return meta.replace(/(^|\s)variant="([^"]*)"/, '$1variant=$2');
}

// A fence's `variant`, onto its <pre>. A log is output, without a diff or highlighted
// lines; anything else fails the build rather than rendering wrong.
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
