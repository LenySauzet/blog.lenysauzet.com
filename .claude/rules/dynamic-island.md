---
paths:
  - "app/_components/DynamicIsland/**"
  - "hooks/use-island-store.ts"
  - "hooks/use-scroll-tracking.ts"
  - "lib/scroll-column.ts"
  - "lib/link-preview/**"
  - "app/api/link-preview/**"
---

# The Dynamic Island and link previews

**The Dynamic Island is the page shell**, and it replaced the header and the dock,
which were a placeholder with three dead links. It is a status surface and the door
to the palette, never a menu: one action, whatever it is showing, or it stops being
something a reader can rely on.

The island and the palette agree on the end of an article: the island invites support
and the palette carries that command in `Recommended`, one press away. The island
still only ever opens the palette, whatever it is showing.

`app/_components/DynamicIsland/states/` is a registry like the command one, ordered,
first condition wins, last entry carries none. A state owns its layout and its data
sources; the island owns only the container. States come from two places: ambient
ones derived from the context, and transient ones raised through
`hooks/use-island-store.ts` by anything on the page. `announce()` is the site's only
notification surface, which is why sonner was removed rather than kept beside it.

What the shape forces, none of it obvious:

- **Motion scales the pill, it does not resize it.** Mid-morph the container reads
  `matrix(1.26, 0, 0, 1)` and everything inside is stretched with it. That stretch is
  the effect, so children must not be counter-scaled and must not scale themselves:
  either one puts a second, disagreeing movement on screen.
- **Hover is the only state change a pointer can cause**, so the hint keeps the width
  of whatever it covers. Without that the pill shrinks out from under the pointer
  that raised it and the two states trade places several times a second. It is a
  floor, not a width, or a short title cuts the line off.
- **The lift and the press scale the target, not the pill.** A transform carries the
  hit area with it; on the pill they would reach past their own target and bring the
  oscillation back.
- **A wheel over the island does nothing on its own.** `body` does not scroll and the
  scrolling column is a sibling, so the delta is handed on by hand.
- **A button centres its text**, so the island's content wrapper undoes it once
  rather than every multi-line state fighting the same browser default.
- **A state that reports on something else goes `inert`**, and the positioner is
  what takes `pointer-events-none`, not the button: the positioner is a box of its
  own and keeps catching what the button no longer does. Opened over the very link
  that raised it, the island would otherwise take the pointer off that link, shrink
  back, hand it over again, and oscillate about three times a second.
- **Nothing of one state survives into the next**, and between two sizes far
  apart the island passes through its own resting shape, empty. The content goes
  at once, the box travels alone, and the next state arrives into a pill the size
  it is about to be. Crossing the two over instead was tried and looks worse: a
  large layout and a small one share the screen and the collapse stretches both.
  Traced leaving a card: empty by 40ms, down to 87x37 by 276ms, the next state at
  285ms, settled at 220x44.
- **A shape that empties keeps the corner it had.** Dropped back to the pill's
  radius, a box still card-sized rounds into a pebble and the shape drifts away
  from the one it is leaving. Held, it converges on its own, a corner being
  clamped to half the shorter side once the box is small enough, and Motion
  carries it through the morph as a percentage so the rendered corner never
  moves: 6.5% of 336 and 11% of 199 are both 22px.
- **Measure the pill, never the button.** `layout` animates a transform on the
  pill, and a parent's layout box does not see a child's transform: the button's
  rect snaps between the two sizes in a single frame and makes a working morph
  look like a jump. Three readings were taken off the wrong element before that
  showed up.
- **The scroll progress lives at module scope**, not in the state that draws it: a
  state unmounts on every change of shape and the ring would fall back to zero.

**Hovering a link previews where it goes**, through one delegated listener in
`LinkPreviews` rather than a handler on `Anchor`: every link in every post would
otherwise become a client component, and the delegation catches links no `Anchor`
rendered. It speaks only where a reader cannot already tell: a post behind link
text saying something else, and any external site. The site's own pages are left
alone, their link text being the whole of it.

**It answers twice.** `lib/link-preview/providers.ts` is a registry, like the
command one: each provider matches a URL and reads what the URL alone gives, which
is what the island shows at once. `app/api/link-preview` then fetches the page and
the island morphs as that lands. A reader therefore never waits on a request and
never sees a spinner, and an answer arriving after they have moved on is dropped.
Internal posts are never asked about: the layout already carries their title and
description, and their picture is the OG image we generate anyway. **The index
previews nothing at all**, since it names every post beside its date already and
the card would cover the very list it was repeating.

A provider may also say how to merge what it learns. The default lets the page's
own title win, but one that read a label out of the path keeps it: GitHub's title
repeats the repository, and Bluesky builds its page in the reader's browser, so
its title is just the name of the app.

**The route is the only part that can be dangerous**, and it is reachable by
anyone, not only through a link in a post. So it answers only for hosts a post
actually links to, read off the content once per instance by
`allowed-hosts.ts`: the set is the whole of what a reader can hover, and
any other first host is refused before a socket is opened. **A redirect is not held to
that set**: `reach` walks it through `safe-url.ts`, so a linked host can send the fetch
on to any public address, never a private one. Re-checking the allowlist on each hop
would close that, at the cost of previews for sites that redirect to a CDN. Fetching whatever it is
handed would otherwise be both a request forgery primitive and someone else's
crawler running on our bill.

Beyond that, `safe-url.ts` checks every address a name resolves to rather than
the name, redirects are walked by hand so that runs again on each hop, the read
is bounded and stops at `</head>`, and every failure answers an empty object.

**Checking the name is not enough, so the address is pinned.** `safe-url.ts`
hands back the address it approved and `pinned-request.ts` gives the socket that
address through `lookup`, because a resolver answering public once is under no
obligation to answer the second lookup the same way, and `fetch` would have made
exactly that second lookup. The request keeps its hostname, so the certificate
and the `Host` header stay the ones the site expects, and `agent: false` is
load-bearing: Node pools sockets by name, and a reused one never reaches the
lookup its request pinned. YouTube goes through oEmbed, which gives the channel their
own tags do not, and falls back to the page when they refuse.

The answer is cached at the edge for a day, so the next reader's hover is instant,
and once per link per page in the browser. The wait before showing keeps a paragraph
of links from flickering; the grace before hiding carries the island from one link
to the next without dropping back in between.

The island is deliberately absent from `content/design-system.mdx`. It is global
chrome, always on screen, and a second one rendered inside an article would be two
islands disagreeing.
