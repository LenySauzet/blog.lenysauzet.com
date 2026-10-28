---
name: figure-code
description: >-
  Puts live, editable code in a blog post with components/Sandpack, themed with the
  site's tokens, for when the code itself is the subject and the reader should change
  and run it. Use whenever a post should show a runnable example (a React hook, an
  API, a library, a technique by example), even when the user only asks for 'an
  example the reader can edit', and for changes to components/Sandpack.
---

# Live code

A sandbox is for when **the code is the subject**: the reader learns by reading it,
changing a line and seeing what happens. When the code only produces a picture the post
is about, build that picture as a figure instead (`figures` decides), and show the code
that matters as a fenced block beside it.

## Using it

```mdx
<Sandpack
  template="react"
  dependencies={{ motion: '13.4.4' }}
  defaultTab="preview"
  files={{
    '/App.js': `export default function App() { ... }`,
    '/scene.css': { code: `...`, hidden: true },
  }}
/>
```

- **`template`** is any Sandpack template; `react` gets `setup-files.ts`, which centres
  the preview and is hidden from the tabs.
- **Pin dependency versions.** `latest` makes a post change under its reader.
- **One idea per sandbox, and the shortest code that shows it.** Hide setup files the
  reader does not need (`hidden: true`) rather than deleting them; the open file is the
  lesson.
- **Name things the way the prose does**, so a reader can move between the two.
- **The preview obeys `figure-design`** when it draws anything: the accent, both themes,
  motion that respects reduced motion.

## What bites

- **A post's Markdown twin keeps the code.** `/posts/<slug>/index.md` drops only the
  imports a post opens with, so an `import` inside a sandbox's `files` survives. Keep
  examples in props, never in post-level imports.
- **The editor is themed from the code block's tokens** (`theme.ts`), so it follows the
  accent and the theme. Do not hand it literal colours.
- **It is heavy and client-only.** Several per post is several runtimes: prefer one
  sandbox the reader edits over many small ones.
- **`Sandpack` takes no `className` yet**, against the house rule. Add it the first time
  a post needs to place one.

Finish with `figure-verify`: run it, edit it, check the console pane and both themes.
