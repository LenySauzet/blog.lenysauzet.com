// Shiki's `css-variables` theme, generated once via `createCssVariablesTheme`
// and inlined as plain data: next.config.ts compiles to CommonJS and cannot
// import ESM-only shiki, and Turbopack only accepts serializable plugin
// options. Token colours resolve to the `--shiki-token-*` variables defined in
// app/globals.css, so the palette lives with the rest of the design tokens.
export const codeTheme = {
  name: 'css-variables',
  type: 'dark',
  colors: {
    'editor.foreground': 'var(--shiki-foreground)',
    'editor.background': 'var(--shiki-background)',
  },
  tokenColors: [
    {
      scope: [
        'keyword.operator.accessor',
        'meta.group.braces.round.function.arguments',
        'meta.template.expression',
        'markup.fenced_code meta.embedded.block',
      ],
      settings: { foreground: 'var(--shiki-foreground)' },
    },
    { scope: 'emphasis', settings: { fontStyle: 'italic' } },
    {
      scope: ['strong', 'markup.heading.markdown', 'markup.bold.markdown'],
      settings: { fontStyle: 'bold' },
    },
    { scope: ['markup.italic.markdown'], settings: { fontStyle: 'italic' } },
    {
      scope: 'meta.link.inline.markdown',
      settings: { fontStyle: 'underline', foreground: 'var(--shiki-token-link)' },
    },
    {
      scope: ['string', 'markup.fenced_code', 'markup.inline'],
      settings: { foreground: 'var(--shiki-token-string)' },
    },
    {
      scope: ['comment', 'string.quoted.docstring.multi'],
      settings: { foreground: 'var(--shiki-token-comment)' },
    },
    {
      scope: [
        'constant.numeric',
        'constant.language',
        'constant.other.placeholder',
        'constant.character.format.placeholder',
        'variable.language.this',
        'variable.other.object',
        'variable.other.class',
        'variable.other.constant',
        'meta.property-name',
        'meta.property-value',
        'support',
      ],
      settings: { foreground: 'var(--shiki-token-constant)' },
    },
    {
      scope: [
        'keyword',
        'storage.modifier',
        'storage.type',
        'storage.control.clojure',
        'entity.name.function.clojure',
        'entity.name.tag.yaml',
        'support.function.node',
        'support.type.property-name.json',
        'punctuation.separator.key-value',
        'punctuation.definition.template-expression',
      ],
      settings: { foreground: 'var(--shiki-token-keyword)' },
    },
    {
      scope: 'variable.parameter.function',
      settings: { foreground: 'var(--shiki-token-parameter)' },
    },
    {
      scope: [
        'support.function',
        'entity.name.type',
        'entity.other.inherited-class',
        'meta.function-call',
        'meta.instance.constructor',
        'entity.other.attribute-name',
        'entity.name.function',
        'constant.keyword.clojure',
      ],
      settings: { foreground: 'var(--shiki-token-function)' },
    },
    {
      scope: [
        'entity.name.tag',
        'string.quoted',
        'string.regexp',
        'string.interpolated',
        'string.template',
        'string.unquoted.plain.out.yaml',
        'keyword.other.template',
      ],
      settings: { foreground: 'var(--shiki-token-string-expression)' },
    },
    {
      scope: [
        'punctuation.definition.arguments',
        'punctuation.definition.dict',
        'punctuation.separator',
        'meta.function-call.arguments',
      ],
      settings: { foreground: 'var(--shiki-token-punctuation)' },
    },
    {
      scope: ['markup.underline.link', 'punctuation.definition.metadata.markdown'],
      settings: { foreground: 'var(--shiki-token-link)' },
    },
    {
      scope: ['beginning.punctuation.definition.list.markdown'],
      settings: { foreground: 'var(--shiki-token-string)' },
    },
    {
      scope: [
        'punctuation.definition.string.begin.markdown',
        'punctuation.definition.string.end.markdown',
        'string.other.link.title.markdown',
        'string.other.link.description.markdown',
      ],
      settings: { foreground: 'var(--shiki-token-keyword)' },
    },
    {
      scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
      settings: { foreground: 'var(--shiki-token-inserted)' },
    },
    {
      scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
      settings: { foreground: 'var(--shiki-token-deleted)' },
    },
    {
      scope: ['markup.changed', 'punctuation.definition.changed'],
      settings: { foreground: 'var(--shiki-token-changed)' },
    },
    // Not part of the stock css-variables theme: give operators (= => etc.)
    // their own token so they can carry the fixed orange accent.
    {
      scope: ['keyword.operator', 'storage.type.function.arrow'],
      settings: { foreground: 'var(--shiki-token-operator)' },
    },
    // The stock css-variables scopes miss most TS type/class/interface/enum
    // names and decorators, leaving them plain. Colour them like functions
    // (pink), as Maxime does, for readable dense TypeScript.
    {
      scope: [
        'entity.name.type',
        'entity.name.type.class',
        'entity.name.type.interface',
        'entity.name.type.enum',
        'entity.name.type.alias',
        'entity.name.type.module',
        'entity.other.inherited-class',
        'support.type',
        'support.class',
        'meta.decorator',
        'meta.decorator entity.name.function',
        'punctuation.decorator',
      ],
      settings: { foreground: 'var(--shiki-token-function)' },
    },
  ],
};
