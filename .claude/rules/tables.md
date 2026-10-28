---
paths:
  - "components/Table/**"
  - "components/ui/table.tsx"
---

# Tables

**A table is written as a table.** GFM pipes map onto the shadcn primitive through
`mdx-components.tsx`, the way `![alt](src)` maps onto `Image` and `>` onto
`Blockquote`. `remark-gfm` runs at build and ships nothing, and the source round-trips:
`/posts/<slug>/index.md` serves a pipe table back untouched, where a component arrives
as a line of JSX and tells a reader nothing. Measured on the design system, which is
the whole argument for preferring the markdown form to a `<Table>` a post composes.

**`data-table` is not a component to reach for**, and shadcn says so on the page: it is
a guide to composing their `Table` with TanStack Table yourself, a `columns.tsx` and a
feature registration per table. It is 31 kB and `'use client'` for the whole table,
against pipes that cost nothing, so a six-row comparison in an article is the wrong
place for it. It composes **on top of this same primitive** when a post genuinely needs
to sort or filter fifty rows, which is why nothing has to be undone to get there.

- **`bunx shadcn@latest add table` repeats the `cn` trap**, exactly as `add chart` does:
  it imports from a npm package called `cn` and installs it. Repoint to `@/lib/utils`
  and remove the package.
- **The primitive carries no `"use client"` here.** A table has no behaviour, and the
  generated file's directive would put every table in an article on the client. The
  other edits to re-apply on `--diff`: the row hover and the footer take
  `--foreground/5` rather than `--muted`, for the asymmetry measured on the chart's own
  hover band; cells are `px-4 py-3 align-top` on the article's rhythm rather than `p-2`;
  and **`whitespace-nowrap` stays on `th` alone**, a header being a short label where a
  cell holds prose that has to wrap.
- **The cells' type is declared once on the table**, in `components/Table`, and every
  cell inherits it. Only a header says anything about itself.
- **A cell is mapped whole, never as `({ children }) => ...`.** GFM carries a column's
  alignment as an inline style on each cell, and rewriting the mapping in the prevailing
  shape of `mdx-components.tsx` drops it, rendering a table that ignores its own
  delimiter row.
  `Table.test.tsx` guards it.
- **A table is a surface, and it is the code block's.** `--card` and `--border` are
  what `--code-bg` and `--code-border` already resolve to, so a table and a fenced
  block are the same panel in an article rather than two near-misses. Flush to the
  prose it was tried first and reads as cramped.
- **Its header is marked the way the code block's is**, by the rule under it and the
  type on it, over a fill faint enough not to read as a second panel. `--wash/30` was
  tried, the raised surface Select and Slider sit on, and measured 1.328 against the
  page in dark where the header now reads 1.086. A control a pointer can press earns
  that lift; a column name does not.
- **Only what GFM emits is mapped.** `tfoot` and `caption` have no markdown syntax, so
  nothing can reach them from a post; the primitive still exports both, the way
  `ui/card.tsx` keeps `CardFooter`, for the day a post composes a table by hand.
- **The row hover belongs to `tbody`, not to the row.** Mapped from markdown, a header
  is a `tr` like any other, so a hover declared on `TableRow` lit the header too and
  promised an interaction that is not there.
- **A column has a floor, and that is what makes a wide table scroll.** Without one the
  cells simply wrap, and a seven-column table turns every sentence into a column of
  single words rather than overflowing. At `min-w-36` a three-column table still fits
  the measure exactly and a seven-column one runs to 1008px inside it.
- **The edge it can still travel to dissolves, with no JavaScript and no client
  component.** `app/globals.css` carries it, a deliberate exception like the
  ordered-list counters, `animation-timeline` being no more a Tailwind class than
  `content: counter()`. Three things it forces:
  - **Two registered `<length>`s, never two mask values.** A mask interpolates between
    `calc(100% - 48px)` and `100%` by not interpolating at all: sampled across the
    scroll, it held the first keyframe to halfway and flipped to the second in one
    step. `@property` with `syntax: '<length>'` travels, and the mask is composed from
    the pair.
  - **Each runs over its own 3rem of the scroll and then holds**, through
    `animation-range`. Spread across the whole range instead, both edges sit at half
    width in the middle of a long table and read as the fade backing out.
  - **A mask, not a colour ramp**, for the banding `ScrollFade` was built around. The
    mask is always declared, since composing it from the lengths is what buys the
    interpolation, so a table that fits carries an opaque no-op rather than nothing at
    all. That is the trade and it is a cheap one: **no layer is promoted**, where a
    `blur(0)` left in place would hold one for the life of the page, and the style
    recalculation costs **0.004ms per table per repaint**, measured over four
    interleaved passes on 60 tables, twenty times what an article carries.
- **The scroll region is left to the browser for its keyboard path.** Chrome puts a
  scrollable container in the tab order on its own and leaves one that fits out of it,
  which is the discrimination an unconditional `tabIndex={0}` would destroy: every
  table in every article would take a tab stop to scroll nothing. Verified by tabbing,
  not by reading the property, `tabIndex` reporting -1 either way.
- **`remark-gfm` also brings strikethrough, task lists and autolink literals.** None
  appears in `content/` today, so nothing changed under it, but a bare URL in prose is
  a link from now on.
