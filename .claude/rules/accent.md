---
paths:
  - "lib/hues.ts"
  - "hooks/use-hue.ts"
  - "app/layout.tsx"
  - "app/globals.css"
---

# The accent

**The accent is a reader's choice, out of seventeen presets.** `lib/hues.ts` is the
whole list; everything else reads it. One row in `Tools` opens a page of the palette,
and the choosing happens there.

- **The names come from Tailwind's palette, and so do the angles**, which is the only
  way a name stays honest. The site shipped 262.04 as "Violet" for a long time; that is
  Tailwind's *blue* at 259.8, and the real violet is at 292.7. The default is Blue now,
  and `hues.test.ts` checks every preset against Tailwind's own figure.
- **The accent has its own lightness**, `--accent-l`, where every other token takes
  only the hue. It needs one: the accent carries far more chroma than anything else, so
  rotating it alone drops `--primary` on white from 4.06 at the warm end to 3.17 at
  teal, well under what the site shipped. Nine presets carry a lightness that buys it
  back, by at most 0.05. Measured on the page after the change, teal in light mode
  reads 3.84 where it read 3.17.
- **The floor is checked, not asserted.** `hues.test.ts` converts oklch to sRGB itself
  and fails a preset that falls under 3.79 in light or 4.5 in dark. The conversion is
  test-only and agrees with Chrome to within 0.02 of a ratio.
- **There is no Neutral, and that is the answer rather than an omission.** Zeroing the
  accent's chroma only reaches `--primary`: every other token carries its own and
  points at whatever angle is set, so a grey accent sat on a pink page. Measured under
  it, `--subtle-foreground` came out 170,138,147, thirty-two points of 255 apart across
  its channels, where `--primary` was a flat 131,131,131. A preset turns the wheel and
  grey is not on it; making it honest would mean all 88 token definitions taking a
  chroma multiplier.
- **A blocking script paints it before the first frame**, built in `app/layout.tsx`
  from `HUES` itself so a preset cannot exist there and nowhere else. Left to React the
  page paints the default and corrects it on hydration, which is a flash of the wrong
  colour. Measured on a cold load with a preset stored: the right accent at readyState
  `interactive`, at the first frame, at first contentful paint, in both themes.
- **The mark reads itself in, letter by letter**, on the grammar `ZoomCaption` uses
  under a zoomed image: a 6px blur per glyph, staggered left to right, and leaving
  mirrors it last letter first so the mark hands over to the row that takes it rather
  than blinking out. Measured mid-reveal, the seven letters sit at 0.96 down to 0.20.
- **The chooser opens on the accent in force**, so the reader starts from where they
  are. The selection is set a frame late, cmdk putting its own highlight on the first
  row as the rows mount. **Hovering a row does not preview it**: tried, and a page
  that rethemes under a pointer merely passing over a list is more startling than it
  is useful.
- **`--base-hue` in `globals.css` is the angle `DEFAULT_HUE` names**, or the two
  disagree and the page shifts the moment anything reads a preset.
- **Picking applies in place and the page stays open.** Every other command acts and
  the palette shuts behind it; a chooser has to let one accent be compared with the
  next.
- **The swatch is two discs and a cut, and the cut is a mask.** A border would be a
  colour that has to match whatever sits behind it, on a panel, in either theme, under
  any accent; a mask makes the separation the surface itself. The disc behind is mixed
  into the page rather than laid over it at an alpha, for the same reason the text
  tiers are named colours.
- **Nothing else had to change**, which was the point of the token architecture: the
  shader follows because `Backdrop` reads the accent every frame, and the syntax
  highlighting follows because `config/code-theme.ts` emits `var(--shiki-token-*)`
  rather than literal colours.
