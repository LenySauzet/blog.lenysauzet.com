---
paths:
  - "content/**"
  - "lib/post-*.ts"
  - "lib/cdn.ts"
  - "lib/image-utils.ts"
  - "components/Image/**"
  - "components/VideoPlayer/**"
  - "components/Blockquote/**"
  - "components/List/**"
  - "components/Separator.tsx"
  - "app/posts/**"
  - "app/llms.txt/**"
  - "mdx-components.tsx"
  - "next.config.ts"
  - "config/site.ts"
  - "components/UpdatedBadge.tsx"
  - "components/Footnote.tsx"
  - "components/Footnotes/**"
  - "components/Tweet/**"
  - "lib/tweet.ts"
  - "scripts/tweet-videos.ts"
---

# Posts, media and the prose components

A figure, chart, shader or live code added to a post starts with the `figures` skill,
which decides whether it earns its place and which kind builds it.

## Content system

Posts live in `content/*.mdx` and use **JS export frontmatter**, not YAML:

```mdx
export const metadata = {
  title: '...',
  description: '...',
  tags: ['webgl'],
  date: 'YYYY-MM-DD',
  updated: 'YYYY-MM-DD', // optional: shows a badge in the post header
  draft: true, // optional: reachable by URL, hidden from every listing
};
```

The slug is the filename. Posts load via dynamic `import()` at build time
(`generateStaticParams` + `dynamicParams = false` in `app/posts/[slug]/page.tsx`).
`getPosts()` in `lib/post-utils.ts` reads `content/` and imports each file's metadata;
it excludes drafts unless asked, so the feed, RSS and sitemap never leak them.

`updated` is set by hand, so it means "changed in a way worth telling a reader
about" rather than "touched". It feeds the header badge and OpenGraph's
`modifiedTime`. **The badge's wording is read on the client**, through
`useSyncExternalStore` with the build's value as the server snapshot: a post is
static, so a relative label rendered at build time would still claim the post changed
three days ago a year later.

MDX components are registered globally in `mdx-components.tsx`.

## The same posts, for something that is not a browser

A post is served twice: as the page, and as `/posts/<slug>/index.md`, which is the
file you wrote. The page is 297KB against the source's 14 and loses the two things a
technical post rests on, measured on the planet post: Shiki splits every keyword into
one of 1027 `<span>`s, so the code arrives unfenced and indistinguishable from prose,
and the thirteen headings arrive unmarked. MathJax renders a formula as vector glyphs,
which is right for an eye and unreadable for anything else.

`lib/post-markdown.ts` is the whole transform and takes two liberties with the source,
each because the original means nothing outside the build: the metadata export becomes
YAML, which something other than a bundler can parse, and a relative media path becomes
absolute. Both are narrower than they look. **Only the imports the file opens with are
dropped**, because a component carrying an example in a prop has lines of it at column
zero: anchoring to every line start cost the design system its `import './scene.css';`
out of a Sandpack. And **a triple-backtick block is never touched**, being the subject
rather than the machinery (a `~~~` fence is not recognised, so write fences with
backticks), save one case: a fence carrying Shiki's diff notation becomes a `diff`
fence, the notation being the build's and the removed lines otherwise reading as live
code. **The CDN namespace is chosen by extension**, not by a table of components:
`.mp4`, `.webm`, `.mov` and `.m4v` go to videos and everything else to images (`resolveMediaUrl`, which the
shader engine shares), so adding a component to `mdx-components.tsx` can never put a
file in the wrong place.

- **`/llms.txt` lists the posts** and points at their Markdown rather than their pages,
  which is the point of it. Drafts are absent, the way they are from the feed, while a
  draft's own `.md` resolves, the way its page does.
- **Both are written at build**, beside the search index and the feed that already
  derive from `getPosts`. Nothing is computed per request.
- **A page says where its source is** through `alternates.types`, so nothing has to
  guess the path. `/llms.txt` is advertised nowhere: the root path is its convention,
  and claiming it as an alternate representation of the homepage would be inventing
  one.
- **Worth knowing before trying `/posts/<slug>.md`**: a route segment cannot mix a
  dynamic part with a suffix. `getSegmentParam` only reads a segment as dynamic when it
  ends in `]`, and strict mode rejects `/posts/[slug].md`, which is why the file sits
  one level down.

## Media and the CDN

Media lives on `cdn.lenysauzet.com` (Cloudflare R2), namespaced by kind: `images/…`
and `videos/…`. Origin and layout are declared in `config/site.ts` (`cdnUrl`,
`cdnPaths`); `lib/cdn.ts` is the only module aware of them. Absolute URLs pass through
untouched, so a post can point at a third-party asset.

```mdx
<Image src="blog/halftone.png" alt="Diagram breaking down the distance field" />
```

**Prefer omitting `width`/`height`.** `components/Image` is an async Server Component
that reads the image header at build time (ranged request + `image-size`, memoized with
`cache()`) to reserve space and avoid CLS. Hand-written values tend to be the *displayed*
size, not the intrinsic one, which skews the aspect ratio and the generated `srcset`.
Supplying both skips the lookup.

Markdown `![alt](src)` maps onto the same component. `remark-unwrap-images` lifts it out
of the paragraph remark would wrap it in, since `<figure>` inside `<p>` is invalid. It is
pinned to `4.0.1`: **5.0.0 is a broken publish whose npm tarball contains no code.**

**Check the CDN's cache with a GET.** A `HEAD` answers `cf-cache-status: DYNAMIC`
whatever the cache rule does, which once sent a perfectly cached bucket looking for a
bypass that was not there; a `GET` reads `HIT`.

Cloudflare image transformations are not enabled on the zone, so optimization runs
through Next's own optimizer via `images.remotePatterns`. Do not pass a `loader` to
`next/image`: that makes Next bypass its optimizer and serve the loader's URL verbatim.

## Posts on X

`<Tweet id="…" />` draws a post in the site's own markup, a Server Component with no
script of its own. What it rests on, each for a reason:

- **The post is read from X at every build**, through `react-tweet/api`, which keeps the
  token X's syndication endpoint wants. One its author deletes or makes private leaves
  the article at the next deploy, which is the point; X failing to answer degrades the
  same way, to a line saying the post is gone, and never takes the build down.
- **Only `react-tweet/api` is imported.** The package's root also ships its own theme's
  stylesheets, which Node cannot load and the page has no use for, so the text is split
  by `segmentsOf` in `lib/tweet.ts`: hashtags, mentions and links, each URL shown as X
  displays it, the media's trailing t.co link cut, indices counted in code points. X
  sends the text HTML-escaped and counts its indices in the escaped text, so the text is
  cut first and each plain run decoded after.
- **Pictures and avatars stay on X and go through the optimizer** (`pbs.twimg.com` in
  `remotePatterns`), so a reader's browser asks this site and never X. On a network
  that maps IPv4 through NAT64 (`64:ff9b::`), Next takes X's addresses for private ones
  and refuses them locally; that is the machine, not the code, and
  `dangerouslyAllowLocalIP` is not the answer.
- **Videos are copied to the CDN**, at `videos/tweets/<post>-<n>.mp4`, by
  `bun run tweet-videos`. X refuses its video files to most sites that link to them, by
  no rule anyone has published: it served this domain and refused localhost, Vercel's
  previews, GitHub and Maxime Heckel's site. Only the bytes are copied; the post is
  still read live, so a deleted one takes its video with it. A video whose copy does not
  answer at build shows its poster and sends the reader to X, and so does one X only
  streams, having no MP4 to copy. **The check is a HEAD**: the CDN caches a GET's 404
  for four hours, so asked before an upload it would go on answering missing after.
- **Counts and the date are as of the build**, the date in UTC so the build machine's
  time zone cannot move it.

## Prose components

**GFM footnotes are not the site's.** `FootnoteRef` and `FootnotesList` are components
taking an id, so they never collided; `[^1]` now parses too, and writing one would put
a second, differently styled set of notes in the same article.

**`---` is a native `<hr>`**, mapped in `mdx-components.tsx`, not shadcn's `Separator`:
a thematic break is what `<hr>` means, to a screen reader and to reader modes alike,
where the Radix primitive is a decorative `div` built for menus and toolbars.
`components/Separator.tsx` is something else, the dashed rule that opens a post's footer.

**`components/Image/Lightbox.tsx` uses no dialog primitive**: not `ui/dialog.tsx`, not
Radix, not Base UI. Radix ties its scroll lock to the layer's mount, and the layer must
outlive a dismiss to animate out, so the page is frozen for the whole exit animation by
construction. The surface holds one decorative image, so a focus trap has nothing to
trap. What remains is a portal, Escape, focus restoration and two ARIA attributes.
Colocated on purpose; do not promote it until a second consumer exists.

**`components/Blockquote` is a centred pull-quote**, not a left-border aside; markdown
`>` maps to it. It uses `font-serif` (Instrument Serif) as **a deliberate departure from
the reference**, which renders its pull-quote in the default sans because its own
`var(--font-serif)` is undefined. This is the one place the blog knowingly diverges, so
don't "correct" it back to match. The inner `<p>` is the globally MDX-mapped paragraph,
hence the `[&>p]:` overrides.

**Math (`$…$`, `$$…$$`) renders at build time** via `remark-math` + `rehype-mathjax`
(SVG output): vector glyphs, so zero client JS, no CLS, no web-font loading. MathJax over
KaTeX because it handles a deeply-nested radical (a `bmatrix` of `\sqrt{\dfrac…}`)
without the superscript collision KaTeX produces. **It must run before
`rehype-pretty-code`**, which would otherwise try to highlight the `language-math` nodes.
Two `globals.css` rules fight Tailwind preflight's `svg { display: block }`, which
otherwise decentres display math and breaks inline math onto its own line. Array cells are
textstyle by LaTeX rule, so use `\dfrac` for displaystyle fractions.

**Fenced code (`components/CodeBlock`).** A fence takes `title="file.ts"` and `{2,5-7}` to
highlight lines. A changed line ends in `// [!code ++]` or `// [!code --]` (Shiki's
notation, in the language's own comment syntax), which the build strips and draws as a
diff, its `+` and `−` read aloud as "added" and "removed"; copying leaves the removed
lines out, the Markdown twin serves the fence as a `diff`, and a titled block counts
them in its header. A word changes with `/word/#add` or `/word/#remove` on the fence,
the removed one struck through. `variant="danger"` marks an error or a failed output,
the name `Callout` uses. The transformers run through `lib/rehype-code.mjs`, because
Turbopack cannot pass a function as a plugin option. A block over 24 lines folds to its
first 16 under a veil, a floating button unfolding it, so a long listing does not bury
the prose around it: split one rather than let it fold when every line matters.

**Prose lists (`components/List`).** Every item renders the same decorative arrow marker;
ordered lists hide it via CSS and show a counter instead. Those counter rules live in
`app/globals.css` under `ol[data-list='ordered']`, a deliberate exception to the
inline-className rule, because `content: counter(...)` cannot be a Tailwind class. Nesting
needs no depth logic: each nested list carries its own `data-list`.
