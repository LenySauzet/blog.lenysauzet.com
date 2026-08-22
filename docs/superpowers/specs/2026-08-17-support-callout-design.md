# Support callout — design

Date: 2026-08-17
Branch: `feat/support-callout`
Status: designed.

## Goal

A card an article can drop in to ask for support, ending in a live band of recent
supporters pulled from Buy Me a Coffee. It exists to thank the people who already gave
as much as to ask the ones who have not.

## Authoring API

```mdx
<SupportCallout />
```

No props. Everything it needs — the copy, the links, the data source — is the same on
every article, and a prop nobody varies is a prop nobody should have to pass.

## Shape

```text
┌────────────────────────────────────────────┐
│ Support this work                          │
│                                            │
│ Prose, with an inline link and emphasis.   │
│                                            │
│ [ Buy me a coffee ↗ ]  Become a sponsor ↗  │
├────────────────────────────────────────────┤
│ ● RECENT SUPPORTERS            1 284 TOTAL │
│  ╭ names fading in at the top ──────────╮  │
│    Mateo Rossi                      $33    │
│    Ingrid Holm                      $18    │
│  ╰ names fading out at the bottom ──────╯  │
└────────────────────────────────────────────┘
```

Built from what already exists: `Card` for the shell, `Anchor` for the inline and
secondary links, `Button` for the primary call to action, `--primary` for the pulse and
the amounts.

## Split

| File | Renders on | Why |
|---|---|---|
| `components/SupportCallout/SupportCallout.tsx` | server | Copy and links are static. This half ships no JavaScript. |
| `components/SupportCallout/SupporterBand.tsx` | client | The only part that needs the network and an animation loop. |
| `app/api/supporters/route.ts` | server | Holds the token, which must never reach a browser. |

## Data

The route answers in **our** shape, not Buy Me a Coffee's:

```ts
type Supporter = {
  name: string;
  amount: number;
  currency: string;
  recurring: boolean; // a monthly member rather than a one-off coffee
};

type SupportersResponse = {
  supporters: Supporter[];
  total: number;
};
```

Buy Me a Coffee's published reference is marked no longer maintained and is wrong in
ways that matter: it omits `support_hidden`, which the live payload sends and which reads
as a privacy flag, and it shows `supporter_name` null with the real name in `payer_name`.
Normalising at the route puts that whole uncertainty in one pure
function, adjustable against a real response without touching a component, and testable
with no network.

The route caches its answer, so traffic to the blog does not become traffic to Buy Me a
Coffee.

`BMC_TOKEN` lives in `.env` locally and in Vercel's environment. It is documented in
`.env.example` and never committed.

## The band

The list renders twice, end to end, each copy repeated until it outruns the window so a
short list cannot tear a gap open on the wrap. A frame loop advances the offset by
`speed × delta`, wrapped modulo one copy's height, so the seam never shows.

The window is five names tall and follows the measured row height. Both one-off coffees
and monthly members appear, newest first; a member carries a `/ mo` suffix, since the
same figure means something different for each.

**Speed is a spring, not a switch.** Hovering sends it to 0, leaving sends it to 1. The
gradual stop the design calls for is then a property of the spring rather than a special
case — `animation-play-state` can only cut, which is why a CSS marquee cannot express
this.

Both edges fade through a linear mask plus a masked blur layer, the technique
`ScrollFade` already uses.

Under `prefers-reduced-motion` the whole apparatus goes, not just the movement: no fixed
window, no fades, no repeats. A frozen window of repeated names reads as a duplication
bug. Because endless motion also needs a stop that is not the mouse, the moving band is
focusable and pauses on focus (WCAG 2.2.2).

## The pulse

A dot on `--primary` with a ring that expands and fades on a loop. Reduced motion keeps
the dot and drops the ring.

## When it fails

No token, or Buy Me a Coffee unreachable: the route answers with an empty list and the
band does not mount. Their API answers 200 to everything, including a login page for a
stale token, so the route trusts the content type rather than the status. The card keeps its copy and its buttons, so a fork of the repo or a
`bun dev` with no token shows a complete, working card rather than a broken strip.

## Testing

- The normaliser, as a pure function: the real logic, and the part most likely to be
  wrong first.
- The band renders the names it is given, and renders nothing when the list is empty.
- The repeat arithmetic, as a pure function.
- The scroll itself is unreachable from jsdom, which forces `prefers-reduced-motion`;
  the loop, the ramps and the wrap are measured in a browser.

## Assumptions to confirm against reality

- ~~The secondary link points at a Buy Me a Coffee membership page.~~ Confirmed: the
  membership level is live and the link resolves.
- The supporter count is a number of people, not an amount and not a number of coffees.
