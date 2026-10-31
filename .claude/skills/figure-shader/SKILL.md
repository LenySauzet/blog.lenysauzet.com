---
name: figure-shader
description: >-
  Builds and changes shaders and rendered figures with components/Shader, the site's
  one WebGL 2 engine on OGL: GLSL ES 3.00 fragment shaders driven by uniforms, colour
  tokens, images, videos and time, laid out in Playground. Use whenever someone asks
  for a shader, or for anything computed per pixel (noise, lighting, ray marching,
  halftone, a filter over an image or video, an animated background), and for any
  change to components/Shader, lib/shader.ts, a fragment.ts or the homepage Backdrop,
  a one-line fix included.
---

# Rendered figures

A rendered figure is one fragment shader handed to `components/Shader`, which owns the
canvas, the loop, visibility, colours, textures and failure. A figure never holds OGL or
a canvas itself. Load `figure-design` first; how the engine behaves and why is in
[reference.md](reference.md).

## Anatomy

```
components/figures/Name/
├── Name.tsx        controls in Playground, one <Shader>
├── fragment.ts     export const FRAGMENT = /* glsl */ `#version 300 es ...`
├── settings.ts     ranges, defaults, textures, and `uniforms()` when it maps anything
├── geometry.ts     what the shader needs computed in TypeScript (camera, framing), tested
└── index.ts
```

Copy `Halftone` (an image), `VideoHalftone` (a video, time) or `LitWave` (computed
camera and framing, a colour token, time).

## What the engine gives a fragment

| Uniform | What it is |
|---|---|
| `uResolution` | The canvas in device pixels |
| `uPixelRatio` | Device pixels to a CSS one, capped at 2: a size in CSS pixels times this |
| `uTime` | Seconds, advancing only while `playing` |
| `uniforms={{ uName: value }}` | Numbers and vectors, compared by value, re-sent only on change |
| `colors={{ uInk: '--primary' }}` | A token as sRGB from 0 to 1, re-read every frame on screen, so a theme flip follows |
| `textures={{ uImage: 'blog/x.jpg' }}` | A CDN path; `.mp4` and other video extensions play as video. Adds `uImageSize`, zero until loaded |

Shared GLSL lives in `components/Shader/glsl.ts` (`LUMA`, `COVER` for `coverScale`):
reuse it, and add a snippet there the second time one is needed.

## Building one

1. **Compute in TypeScript, shade in GLSL.** Anything with an answer (a camera, a frame,
   a range) is a tested function; the shader marches, samples and shades.
2. **Write the fragment**: `#version 300 es` on the first line, `out vec4 fragColor`,
   return transparent until a texture's size is non-zero.
3. **Name it**: a `label` makes it one image to a screen reader and lets a failure speak.
   A decoration passes none and stays silent.
4. **Lay it out** in `Playground`: `Slider` and `Toggle` as `controls`, `Playback` as
   `action` when `playing` comes from `usePlayback()`. Give it an `aspect`.
5. **Verify** with `figure-verify`, in a real browser: jsdom has no WebGL, so component
   tests mock `@/lib/shader` and only prove the figure stands.

## What bites

- **Sample a cell at the mip level it spans** (`textureLod` with `log2(texelsPerCell)`),
  or a cell takes whichever texel its centre lands on and flickers.
- **A dot never reaches past half its cell**: cap the radius at 0.5.
- **The highlight is `--figure-shine`**, not white, unless the mark is part of the image.
- **Draw onto transparency**; never copy `--background` into the frame. A picture is
  the exception: both halftones paint their own ground, black, in either theme, since
  a dot sized by brightness disappears into a light page.
- **Media is encoded at the size it is drawn** (what a 4K source costs is in the
  reference): ask for a ~1280px encode, and give a replaced file a new name, or
  browsers keep the old one for four hours.
- **An engine change is tested in `lib/shader.test.ts`**, against mocked OGL with frames
  driven by hand, and proved by breaking it.
