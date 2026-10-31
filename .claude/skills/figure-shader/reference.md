# Rendered surfaces: what the engine forces

## The engine

- **One engine, `lib/shader.ts`, under the figures and `Backdrop` alike.** It knows no
  React: `createShader` holds the canvas, the loop and the observers, and `sync` takes
  the whole scene on every render and redoes only what changed, a vector compared by
  its values, a texture fetched once and freed on the GPU when its source changes. A
  uniform left out of a scene keeps its last value. `Shader` is the thin component
  around it.
- **WebGL 2 and GLSL ES 3.00 only**, `#version 300 es` on a fragment's first line:
  derivatives for an edge, `textureLod`, mipmaps on an image of any size. Every
  browser the site supports has it; the rest are told so.
- **It draws on change.** While on screen it re-reads its colour tokens each frame
  (`lib/css-color.ts`, for the reason given there) and redraws only when one of them,
  a uniform, a texture or the size has moved. `playing` runs `uTime` inside that loop,
  so a playing shader never re-renders React, and a still one with no colour to watch
  runs no loop at all. The first frame only reads the clock: a frame's timestamp can
  predate the call that asked for it, and stepping from that call ran time backwards.
- **It draws onto transparency**, so a theme flip repaints only the ink, unless the
  figure is a picture: `Halftone` and `VideoHalftone` are opaque, the same in both themes.
- **The engine reports a status, React reads it through `useSyncExternalStore`**:
  no WebGL 2 or a lost context, a shader that does not link (checked by hand, since OGL
  then throws inside the loop), an image or video that does not load, a video the
  browser will not play (autoplay refused, which a pause's own rejection is not). A
  named figure says which in one sentence, which becomes its label; a decoration stays
  silent. A lost context tears the engine down, or a playing `Backdrop` kept drawing
  into a dead one. The WebGL 2 context is taken before OGL asks, since OGL quietly
  falls back to WebGL 1.
- **A texture is a CDN path in `textures`**: sampler, `<name>Size` zero until it loads,
  trilinear mipmaps and anisotropy, since a painting shrunk three times without them is
  moiré. It reads across origins, which works only because the R2 bucket carries a
  CORS rule (`Access-Control-Allow-Origin: *`, GET and HEAD): removing it breaks every
  texture without breaking any `<img>`.
- **A video is a texture whose path has a video extension** (`isVideo`), read from
  `videos/` like any other. Muted and looping, it plays only while the shader does and
  is on screen, and is uploaded again only when it presents a new frame
  (`requestVideoFrameCallback`, every frame where Firefox before 132 lacks it).
  Mipmapped like an image, so a halftone cell reads the level it spans; building them
  costs the GPU a fraction of a millisecond. Encode it at the size it is drawn: every
  frame of a 4K source is 33MB through the GPU for a figure 682px wide.
- **`uPixelRatio` is the device pixels to a CSS one**, capped at two like the
  canvas, so a size a reader picks in pixels, a halftone's cell, holds on any screen.
- **A halftone samples a cell at the mip level the cell spans**, through `textureLod`,
  which blends what the cell covers. Point-sampled, a cell takes whichever stroke its
  centre lands on.
- **The highlight is `--figure-shine`, not white**, which vanished into the light panel.
  A mark drawn into a picture is the exception: `VideoHalftone`'s dots are part of
  the image they sit in, never on the page, so they stay white.
- **A dot never reaches past half its cell**: each pixel knows only its own cell's
  centre, so a larger one is cut square and runs into its neighbours.

## Figures on it

- **`Playground`** is Maxime Heckel's layout: uniforms and canvas as two panels, wider
  than the column, the canvas first on a phone, `Playback` beside the panel's title.
  Its controls are `Slider` and `Toggle`, a `Switch` named by its label.
- **What a shader needs is computed in TypeScript and tested**: the camera is `basis`
  of the SVG surface's `ISOMETRIC`, and the framing is measured off the surface at each
  frequency. The GLSL only marches.
- **The marched box stands a hair above the surface.** A ray entering through a lid at
  exactly a crest's height reads itself as below it and shades the underside.

## Backdrop

**`components/Backdrop` is a `Shader` and two CSS gradients**, and it draws onto
transparency, so the page supplies the ground.
The shader outputs the accent with the ink as alpha, so `--background` is never copied
into the frame. It used to be a uniform, and a theme flip left the old one baked in
until the next mount: light mode with a black blob over it. Do not reintroduce it. The
framing gradients stay in CSS for the same reason, and cost nothing extra: measured
under 6x CPU throttling, opaque and transparent both delivered 961 frames over 8s.

**The accent is read on every frame, because CSS has no change event.** Three things
change what a token resolves to and only two of them are DOM mutations: a theme class,
an inline override, and an edit to a rule in the stylesheet. That third one is what
devtools does and what a runtime `--base-hue` control would do, and no observer can
see it. Watching `<html>` and `document.head` looked right and left the visual on the
old hue while the rest of the site rethemed. Reading it from a React effect is worse
still: child effects run before the theme provider's, which is what writes the class,
so the read lands one theme behind.

The read is affordable because the oklch-to-sRGB conversion is skipped unless the
string has moved: `getComputedStyle` measured 8.1us under 6x CPU throttling, and three
runs of one build spread p95 from 9.8 to 10.8 and the worst frame from 13.6 to 110.7,
so a per-frame read is well under the noise. Reduced motion stops the clock, not the
read, so the accent still follows a theme flip.
