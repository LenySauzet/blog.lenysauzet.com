---
paths:
  - "components/CommandPalette/**"
  - "lib/commands/**"
  - "lib/search/**"
  - "components/ui/command.tsx"
  - "hooks/use-cmdk-store.ts"
  - "hooks/use-scroll-tracking.ts"
  - "app/search-index.json/**"
---

# The command palette and search

**The command palette is a registry, not a component full of items.**
`lib/commands/registry.ts` is a list of `{ id, label, icon, group, keywords, run }`,
and `components/CommandPalette` only renders it and hands each `run` the page's router
and theme. Adding a command is one entry; nothing about the surface changes. `run`
takes a context rather than reaching for hooks itself, which is what keeps the registry
a plain module a test can read.

A command either acts on the site or **opens a page of the palette**, never both;
the `Command` union keeps the pair from being written together. `search` and `accent`
are the pages, and they force four things worth knowing before opening the files:

- **A page ranks its own rows**, so cmdk gets `shouldFilter={false}` and the selection
  is driven from outside through `onResults`. cmdk moves it when *its* search box
  changes and at no other time.
- **Backspace-to-leave is read on the cmdk root**, not the input, and the input is
  focused by hand when a page opens: a row reached with the mouse keeps the focus.
  **`BackHint` is what says so**, at the end of the input row, and only while the box
  is empty, which is the only time the key does that: with a query in hand it deletes
  a character, and a hint promising otherwise is worse than none. It is the target as
  well, so a mouse is not left with Escape alone, and it hands the box back its focus
  on the way out, the button leaving with the page it belongs to. **cmdk reads Enter on
  its root** and runs whatever row is highlighted, so a button inside it is reachable by
  Tab and dead on arrival until the key is stopped at the button.
- **cmdk nulls `onPointerMove` on a disabled row**, hence `onPointerEnter` for the
  disabled hover, and it refuses to select such a row at all.
- **A list swapped wholesale needs a new `key`**: `FadingList` finds the scrolling
  node once, at mount.

The index is built at build time by `lib/search/build-index.ts` and served static by
`app/search-index.json/route.ts`, **fetched on the first thing typed and not before**.
The unsearched list is the server's, handed to the palette as `posts`: drawn from the
index it arrived after the page did, so a cold load opened the search page on a line of
text and then resized it under the reader once the archive landed. Between a keystroke
and the index there is a plain match on title and description, so the panel keeps
something true on screen for the length of the fetch and never shows a post that does
not answer what was typed. **`INDEX_OPTIONS`
is shared by the build and the browser on purpose**: `loadJSON` reads an index against
the options it is handed, so the two drifting apart stops matching rather than failing.
`lib/search/query.ts` holds the engine, which is what keeps the view free of MiniSearch
and the ranking testable without a DOM.

A command may also say **when it is worth recommending**, which lifts it out of its
group and to the top of the palette. Lifted, not copied: one command is one row, or
cmdk returns two of them for the same search. The section exists only when something
asks for it, holds five at most, and reads in the palette's own group order rather
than the registry's. `lib/commands/recommend.ts` is the whole policy, testable
without a DOM.

Three moments ask for something today: the index, an article underway, and an
article finished. A reader who has only just arrived at an article is offered
nothing, having made no move yet to answer.

What the reader has scrolled is in the context too, which is what lets a command
withhold itself: `Go to top` is not offered to someone already there.
`hooks/use-scroll-tracking.ts` owns that reading for both the palette and the
island, and **hands back the object it already holds when nothing has moved**: a
fresh one per scroll event re-renders both of them sixty times a second to say
nothing changed, which measured 189ms of scripting over 300 frames against 79ms
once it stopped.

`components/ui/command.tsx` is customized beyond the CLI output seven times over: its
`CommandInput` is a bare box laid out inline rather than through `InputGroup`, no
leading icon, with a `hint` slot at the end of its row; **rows rest on the body tier
and the selected one steps up to `--foreground` on a faint wash**, never the accent,
which belongs to what the reader chose rather than to where the cursor is (a search
match keeps it, being the reader's own word); **the selection shows only where a fine
pointer exists or the keyboard is driving**: cmdk always selects a row, which under a
finger alone is no cursor and read as one row stuck lit, so it takes
`any-pointer-fine` (a tablet with a trackpad keeps it) or `data-keyed`, which the root
sets on any key and a touch clears. Any key, not the arrows alone: a query typed on a
phone makes Enter run the first row, and cmdk also moves on Ctrl+N and Ctrl+P. The
selection is the only focus indicator there, DOM focus staying in the box;
**`CommandHint` names what a row says on its right** and lifts it with the selection the way a shortcut does, since the one
thing on the line that does not answer the selection reads as disabled (it is
exported as a class too, for a mark that has to be a motion element to animate
its own exit), **a row's selection is not transitioned**, **Motion animates the dialog rather
than the primitive's keyframes**, and **it travels its backdrop's radius both ways**
rather than only its opacity. The row eased its colour and its wash over 100ms while
the icon, whose colour is set on the `svg` and carries no transition of its
own, snapped: one change arriving at two speeds. Only the press is animated
now, which is the same reason the reading rail's titles take their accent at
once. A blurred backdrop is as good as fully blurred at an opacity of
zero, so fading alone held the page blurred to the last frame and let it snap back,
which reads as a missing exit where there is detail behind the panel. Mounting the palette takes one frame of 65 to 85ms, and a
CSS animation is timed from that frame's start: the 100ms entrance was nine tenths
done when first painted, so none was ever seen. Motion's starts on the frame after. A command the reader picks runs on the
dialog's `onExitComplete`, not on a timer guessing its length, and at once if the
palette is reopened first, the exit then never completing. **A leaving dialog is shut**: AnimatePresence keeps
the props it last had, an open one's, so the box takes `inert` from `useIsPresent`,
and stops Enter as well, the browser only taking back the focus it holds at the next
frame: three quick presses otherwise ran a command twice. Enter alone, or the ⌘K that
reopens it mid-exit is swallowed too; and reopened so, it hands the box its focus again
once rendered, `inert` having refused the first. **With no trigger, Radix has nothing to hand the focus
back to**, so the dialog notes what held it on opening and returns it on closing; a
keyboard reader otherwise started again from the top of the page. **The box is 16px
below `sm`**, the size under which iOS zooms the page on focus, and 14px above. **`ui/dialog.tsx` is gone**, nothing
using it once the dialog was built on Radix's primitives: `add command` brings it
back as a dependency, so drop it again. Update it with
`bunx shadcn@latest add command --diff` and re-apply, and note that overriding the
selected colour from a caller's `className` does not work: the primitive's sits under
`any-pointer-fine` and `in-data-keyed`, which `cn()` keeps beside a plain
`data-selected:` one, and wins wherever those apply.

**A page of the palette is an entry in `lib/commands/pages.ts`**, holding its prompt and
whether it ranks its own rows. `Page` is the map's keys, so a page that is not described
there cannot be opened, and a new one is a line plus a branch rather than a condition
spread across the view. `search` ranks for itself and tells cmdk to stand down; `accent`
lets cmdk filter four names.

- **One pane is mounted at a time, which `AnimatePresence mode="wait"` is for.** A page
  is a `CommandList`, and two of them inside one `Command` would have cmdk ranking and
  arrowing through rows nobody can see. The reveal reads the same for it: the pane
  leaves to one side under a blur, the next arrives from the other.
- **The blur is the movement's own**, so it resolves to `none` through `transitionEnd`
  rather than resting at `blur(0)`, which would leave every pane holding a composited
  layer for the life of the palette.
- **The box travels with its contents, and `layout` cannot do it.** Motion's layout
  animation transforms the element and lets the real box jump, which is exactly what
  the dialog sizes itself to: measured, it still took 222px in a single frame. The
  height is measured off the pane with a `ResizeObserver` and animated for real, and it
  holds through the gap between one pane leaving and the next arriving because the
  observer has nothing to watch there. **The box keeps a floor of five rows**, or
  filtering to a single command drops it to one and the page it opens climbs
  all the way back out, which reads as a pulse rather than as a list
  narrowing. Deeper than five and an empty result is mostly void.
  **Only a swap travels**, never a filter: the
  first reading from a pane is the swap, everything after it is the list
  narrowing under a box that should simply follow, and easing down to meet it
  and back up again reads as the dialog breathing rather than as rows going
  away. Held on the observation rather than cleared when the animation ends,
  which never fires for two panes that happen to be the same height.
  **Only the arriving pane is measured**, which the `data-pane` guard is for: entering a page clears the box too, so the pane on its
  way out re-renders unfiltered and swells back to full height first, and following it
  grew the dialog to meet a list nobody would see before dropping to the page's own
  size. 33 frames where there was one, and typing in the
  root stopped snapping as well.
