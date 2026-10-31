---
paths:
  - "**/*.tsx"
  - "**/*.css"
---

# Styling, tokens and theming

**Tailwind v4 + Shadcn/UI.** No style files, all styling is inline `className`. Use
`cn()` from `@/lib/utils` for conditional merging. The one exception is a surface
made of layered pseudo-elements, which is unreadable as classes: it becomes an
`@utility` in `app/globals.css`, driven by one custom property its component sets,
as `callout-surface` is by `--callout`. Token tables live in
`.cursor/rules/tokens.mdc`; the definitions live in `app/globals.css`. The rules
that neither file makes obvious:

- **`--base-hue` is the only knob.** Every themed oklch token derives from it, syntax
  highlighting included; only the status colours (`--destructive`, `--success`,
  `--warning`) keep fixed hues, since a warning must not turn blue with the accent. Retheming the site is one line, so never hardcode a colour that
  should follow it.
- **Text runs on three tiers**: `--foreground` (headings, `strong`), `--muted-foreground`
  (body copy, `h4`), `--subtle-foreground` (article date, discreet links, card titles,
  `em`). The third is ours, not shadcn's, added per its "Adding Custom Colors" recipe, as
  `--success` and `--warning` were. **Do not substitute an opacity step for it**: an alpha
  composites against whatever surface sits behind the text, so the same tier would drift
  between the page and a card, and it cannot change chroma. The body and third tiers are
  the reference's secondary and tertiary text in both themes (its gray-1100 and 1000).
- **`--primary` is the thematic accent** shared by every active state (primary buttons,
  checked boxes, list markers, the note callout) and by hyperlinks, which `Anchor` takes
  straight from it. Not `--accent`, which is shadcn's muted hover *surface*.
- **Never put `outline-none` on the element that draws its own focus ring.** Tailwind v4
  renamed v3's `outline-none` to `outline-hidden` and gave the old name new behaviour:
  it now sets `outline-style: none` for that element, and the width utilities resolve
  their style from the same variable. `outline-none focus-visible:outline-2` therefore
  computes to `2px none` and paints nothing. Drop it: the browser only draws its default
  ring when `:focus-visible` matches anyway, which is where ours takes over. **It only
  bites an actual `outline`**: `ring-*` is a box-shadow and is untouched by it, which is
  why `MediaPlayer`, `ImageZoom`, `BeforeAfterSlider` and the Sandpack buttons are fine
  as written. Also harmless when the ring lives on a different element (`ui/slider.tsx`
  puts it on the root, `outline-none` on the thumb) or when focus is shown some other way
  (`ui/input.tsx` uses border and shadow, `CopyButton` a background). Grep for it with
  care: `focus-visible:outline-` matches `focus-visible:outline-none` itself.
- **A framed block rounds its outer corners with `rounded-frame-xl` or `rounded-frame-lg`**,
  its usual radius unless a container sets `--frame-radius`. A container that frames blocks
  sets it, as `Callout` does, so what sits inside nests in its corners rather than
  matching them. Code, tweets, tables, images and video use them; a new framed block
  should too.
- **Inline code is not syntax-highlighted.** It takes a flat `--code-inline`, because a
  bare identifier tokenises as plain text in any grammar and highlighting only dimmed it
  into the prose. Set in `next.config.ts` via `defaultLang`.

- **A class can be valid to the eye and absent from the stylesheet.** `blur(0)` is
  minified to an invalid `blur()`, and `[prop:value!important]` compiles to nothing: the
  important mark trails, `[prop:value]!`. Read the computed value before believing a
  class applied.

## Theming

`next-themes` writes `light`/`dark` as a class on `<html>` (`attribute="class"`,
`defaultTheme="dark"`, `enableSystem`). **Never hardcode `dark` on `<body>` or any
element**: that force-applies dark and breaks the toggle. It was a bug once; don't
reintroduce it. `:root` is light, `.dark` overrides, both in `app/globals.css`.

`components/ModeToggle` is no longer mounted anywhere: the theme is switched from the
palette, with ⌘D. `<html
suppressHydrationWarning>` plus next-themes' injected script avoids the flash. Mobile
chrome colour follows the OS via the `themeColor` viewport export, not the toggle.
