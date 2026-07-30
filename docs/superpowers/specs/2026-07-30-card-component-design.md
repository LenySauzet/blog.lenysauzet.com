# Card component — design

Date: 2026-07-30
Branch: `feat/card`
Status: implemented. See "Corrections found during implementation" for where reality
differed from this design.

## Goal

A prose card for grouping related content on a raised surface inside an article, ported
from Maxime Heckel's Card and built on the shadcn Card primitive already vendored at
`components/ui/card.tsx`.

## Authoring API

```mdx
<Card title="A card title">
  Cards group related content on a raised surface. The body accepts any markdown,
  `inline code`, links and more.
</Card>

<Card>
  No title, so no header and no separator.
</Card>
```

```ts
interface CardProps {
  /** Header line. Omitted, the card renders body-only with no separator. */
  title?: ReactNode;
  children: ReactNode;
}
```

One prop, mirroring `Details` (`summary`) and `Callout` (`label`). The body takes any
block, not just text.

## Structure

`components/ui/card.tsx` is CLI-generated and is **not** edited. `components/Card/Card.tsx`
composes it:

```tsx
<Card>                              // ui/card, surface overridden
  {title ? (
    <CardHeader className="border-b">
      <CardTitle>{title}</CardTitle>
    </CardHeader>
  ) : null}
  <CardContent>{children}</CardContent>
</Card>
```

This is the same relationship `Details` has with `ui/accordion.tsx`: the primitive stays
regenerable with `bunx shadcn@latest add card --diff`, the wrapper carries the prose
ergonomics.

## Decisions

**The separator costs nothing.** shadcn's `CardHeader` already carries `[.border-b]:pb-6`,
so passing `border-b` yields both the rule and the header's bottom padding. `globals.css`
applies `* { @apply border-border }`, so the rule picks up `--border` without being named.
No CSS of our own.

**The surface is overridden.** The generated primitive draws its edge with
`ring-1 ring-foreground/10` plus `shadow-xs`. The wrapper neutralises that and applies
`border border-border` so the card and `Details` share one surface definition and cannot
drift apart when a token changes.

**The body mirrors `Details`.** `flex flex-col gap-4` with `[&>*]:my-0`, so a paragraph,
an image or a code block can sit inside without contributing stray vertical margin. This
also absorbs the MDX paragraph wrapping that broke `Anchor` (see "The MDX paragraph trap"
in CLAUDE.md).

**A `div`, not a `section`.** A named `section` becomes an ARIA landmark; several cards in
one article would clutter screen-reader navigation for no gain. shadcn makes the same call.

**Spacing starts native.** The primitive's own `py-6` / `px-6` are kept initially rather
than invented, then compared against the reference rendering and adjusted only if the
rhythm differs.

## Out of scope

No surface variants (Maxime ships primary / secondary / tertiary; only the default is
wanted, and `secondary`'s glass only makes sense over a coloured background this blog does
not have). No `CardFooter` or `CardAction` re-export. No clickable card. The sub-components
remain importable from `@/components/ui/card` if an article ever needs them.

## Testing

`components/Card/Card.test.tsx`, colocated:

- renders the title and the header when `title` is given
- renders no header at all when it is omitted
- renders the body content
- accepts an arbitrary block as a child

jsdom applies no Tailwind, so the separator and surface are verified by rendering the
design-system page in a browser, not asserted in a unit test.

## Delivery

- register in `mdx-components.tsx`
- add a `## Card` section to `content/design-system.mdx`, after Lists

## Corrections found during implementation

**The style belongs in the primitive, not the wrapper.** This design put the surface
override, the title colour and the body type on the wrapper. That splits one component's
appearance across two files and lets them drift. `components/ui/card.tsx` now owns all of
it, the way `badge.tsx` already does, and the wrapper holds only `my-6` — article rhythm,
not a description of the card. The cost is that a regeneration must re-apply those edits;
that is documented in CLAUDE.md alongside Badge's.

**`size="sm"` became the primitive's default** rather than a prop the wrapper passes.
Choosing a size is a style decision, so it does not belong in the wrapper either.

**The title needed its own colour.** Both title and body were `--muted-foreground`, so the
title read as merely smaller. Pixel-scanning the reference gives a card background of 15,
a title of 148 and a body of 187, a ratio of 0.79 — the title is genuinely dimmer.
`text-muted-foreground/75`, the step `Anchor`'s discreet variant already uses, renders at
139 against a body of 188, a ratio of 0.74. Maxime's own value is a solid
`oklch(66.65% 0.04 var(--base-hue))`, which happens to equal our `--shiki-foreground`;
reusing that token here would have been semantically wrong, and minting a new one for a
single title is the duplication this refactor exists to avoid.

**Header rhythm deviates deliberately.** The reference's header band is 43.5px against
55px here, because it uses a tighter header (~12px) than its own body (16px). 16px was
kept so Card and Details stay level.
