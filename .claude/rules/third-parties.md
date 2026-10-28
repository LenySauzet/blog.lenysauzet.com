---
paths:
  - "lib/booking.ts"
  - "lib/supporters.ts"
  - "app/api/supporters/**"
  - "components/SupportCallout/**"
---

# Third parties: cal.com and Buy Me a Coffee

**Booking is one row in `Tools` and nothing else.** `lib/booking.ts` is the whole of
it: the command's `run` hands it the theme the palette already carries, and cal.com's
own modal goes up over the page. `config/site.ts` holds the handle, the embed taking a
path rather than a URL, and the page rather than one event type so a visitor picks the
length they need.

- **A plain import, and the deferral is `getCalApi()`'s.** It pulls their `embed.js`
  only when called, so a reader who never books asks cal.com for nothing: measured, no
  request and no `window.Cal` on load or on opening the palette. A dynamic `import()`
  was there first and bought none of that, costing 4 KB over the static one.
- **Nothing is focused once it is up, and that is the fix rather than the bug.**
  cal.com reads Escape on the parent document, so handing the iframe the focus sends
  the key to a cross-origin document and the modal can no longer be dismissed:
  measured, Escape closes it untouched and fails the moment the iframe is focused.
  Tab reaches the booker in three presses on its own, which is the cheaper half of
  that trade.
- **A dismissed modal is `visibility: hidden`, never `display: none`**, and the host
  stays in the DOM. Reading the wrong property reported Escape and their own close
  button as both broken when all three paths work.
- **The failure answers on the island.** A new tab cannot: the gesture is spent by the
  time the import rejects, so the popup is blocked, and cal.com is what just failed to
  answer anyway.
- **It is the first third party on any page here.** The modal is cal.com's surface,
  not ours, and it will not follow the accent. Only the theme is passed, which is all
  `cssVarsPerTheme` could carry honestly: every token here is oklch derived from
  `--base-hue`, the reader picks one of seventeen, and an iframe reads its variables
  once.

**Buy Me a Coffee answers 200 to everything.** `lib/supporters.ts` and
`app/api/supporters/route.ts` read their API, and `response.ok` proves nothing there: an
empty result is `{ error: "No supporters" }` and a stale token is a 200 carrying their
*login page*, so the route checks the content type instead. Their published reference is
marked no longer maintained and is wrong in ways that matter: it omits `support_hidden`,
which the live payload does send and which reads as a privacy flag, and it shows
`supporter_name` null with the real name in `payer_name`. An amount is
`support_coffees × support_coffee_price`; reading either alone turns a 5 EUR coffee into
"1". `per_page` is fixed at 5 and ignored when passed, so more names means walking pages.
**Never widen what the band shows on the strength of that reference alone**: verify
against a live response first, and when a privacy field is ambiguous, exclude.

**`support_visibility` is not that field, and treating it as one emptied the band.**
Their two endpoints give one name opposite meanings: the developer API returned 0 for
a supporter that `app.buymeacoffee.com/api/creators/slug/<name>/coffees`, which needs
no token and feeds their own public widget, returns as 1 and publishes. A field they
contradict themselves on cannot carry a privacy decision, so only `support_hidden` and
`is_refunded` do. That public endpoint is also the way to settle the next such
question: if it publishes a name without a token, the name is public.

**`components/SupportCallout` fetches from the browser on purpose.** Posts are statically
generated, so reading the supporter list at build time would freeze the names until the
next deploy. The card itself stays a Server Component; only the band is a client.

**The band's repeat count is a ratio of names, never a measurement.** A window
`ROWS_IN_VIEW` rows tall over a repeat of `count` rows is `ceil(ROWS_IN_VIEW / count)`:
row height sits on both sides and cancels. Dividing the rendered list's height by the
repeat count already drawn feeds an answer into its own input; that version asked for 317
repeats where 18 was right and rendered 11,160 rows. Under `prefers-reduced-motion` the
whole apparatus goes, not just the movement, because a frozen window of repeated names
reads as a duplication bug. **jsdom cannot reach any of this**: `vitest-setup` forces
reduced motion and Motion caches it at module scope, so the loop and the ramps are
verified in a browser and only the arithmetic is a unit test.
