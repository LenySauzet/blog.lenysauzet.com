import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import { isVideo, resolveMediaUrl } from '@/lib/cdn';
import { step } from '@/lib/clock';
import { cssColor } from '@/lib/css-color';

export type Uniform = number | readonly number[];

export type Status = 'ready' | 'unavailable' | 'broken' | 'missing' | 'blocked';

export interface Scene {
  uniforms: Record<string, Uniform>;
  colors: Record<string, `--${string}`>;
  textures: Record<string, string>;
  playing: boolean;
}

// A full-frame fragment shader costs every pixel it is given, and past two the extra
// ones are not visible enough to pay for.
const MAX_DPR = 2;
const ANISOTROPY = 8;
const NONE = [0, 0];

const VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export function statusStore() {
  let status: Status = 'ready';
  const listeners = new Set<() => void>();

  return {
    get: () => status,
    set(next: Status) {
      if (next === status) return;
      status = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const same = (a: unknown, b: Uniform) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((value, index) => value === b[index])
    : a === b;

const inert = { sync: () => {}, dispose: () => {} };

interface Source {
  src: string;
  media: HTMLImageElement | HTMLVideoElement;
  texture: Texture;
  stop: () => void;
  play?: (on: boolean) => void;
  refresh?: () => void;
}

export function createShader(host: HTMLElement, fragment: string, report: (status: Status) => void) {
  const canvas = document.createElement('canvas');
  // Taken before OGL asks, so OGL is handed this context rather than falling back to
  // WebGL 1, which a `#version 300 es` shader cannot compile on.
  if (!canvas.getContext('webgl2', { alpha: true, depth: false, premultipliedAlpha: false })) {
    report('unavailable');
    return inert;
  }

  const renderer = new Renderer({
    canvas,
    webgl: 2,
    alpha: true,
    depth: false,
    dpr: Math.min(window.devicePixelRatio, MAX_DPR),
  });
  const gl = renderer.gl;
  canvas.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%';
  host.appendChild(canvas);

  const program = new Program(gl, {
    vertex: VERTEX,
    fragment,
    uniforms: { uResolution: { value: [1, 1] }, uPixelRatio: { value: renderer.dpr }, uTime: { value: 0 } },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const linked = gl.getProgramParameter(program.program, gl.LINK_STATUS);

  const colors = new Map<string, { token: string; reader: ReturnType<typeof cssColor> }>();
  const textures = new Map<string, Source>();
  let playing = false;
  let dirty = true;
  let alive = true;

  const set = (name: string, value: unknown) => {
    (program.uniforms[name] ??= { value }).value = value;
    dirty = true;
  };

  const draw = () => {
    for (const [name, { reader }] of colors) {
      const value = reader.read();
      if (program.uniforms[name].value !== value) set(name, value);
    }
    if (!dirty || !linked) return;
    renderer.render({ scene: mesh });
    dirty = false;
  };

  const show = (name: string, media: Source['media'], size: number[]) => {
    const source = textures.get(name);
    if (source?.media !== media) return;
    source.texture.image = media;
    set(`${name}Size`, size);
    draw();
  };

  const image = (name: string) => {
    const element = new Image();
    element.onload = () =>
      element.decode().then(
        () => show(name, element, [element.naturalWidth, element.naturalHeight]),
        () => report('missing'),
      );
    return {
      media: element,
      stop() {
        element.onload = element.onerror = null;
        element.src = '';
      },
    };
  };

  const video = (name: string, texture: Texture) => {
    const element = document.createElement('video');
    Object.assign(element, { muted: true, loop: true, playsInline: true, preload: 'auto' });
    element.onloadeddata = () => show(name, element, [element.videoWidth, element.videoHeight]);
    const upload = () => (texture.needsUpdate = dirty = true);
    // Without it, a playing video is uploaded on every frame whether it moved or not.
    const presents = typeof element.requestVideoFrameCallback === 'function';
    let pending = 0;
    const present = () => {
      upload();
      pending = element.requestVideoFrameCallback(present);
    };
    if (presents) pending = element.requestVideoFrameCallback(present);
    return {
      media: element,
      play(on: boolean) {
        if (!on) element.pause();
        // A play cut short by a pause rejects with an AbortError, and is not a failure.
        else if (element.paused)
          element.play().catch((error: DOMException) => error.name === 'AbortError' || report('blocked'));
      },
      refresh: presents ? undefined : () => element.paused || upload(),
      stop() {
        element.onloadeddata = element.onerror = null;
        if (presents) element.cancelVideoFrameCallback(pending);
        element.removeAttribute('src');
        element.load();
      },
    };
  };

  const release = (name: string) => {
    const source = textures.get(name);
    if (!source) return;
    source.stop();
    gl.deleteTexture(source.texture.texture);
    textures.delete(name);
    set(`${name}Size`, NONE);
  };

  const load = (name: string, src: string) => {
    const texture = new Texture(gl, { minFilter: gl.LINEAR_MIPMAP_LINEAR, anisotropy: ANISOTROPY });
    const source = { src, texture, ...(isVideo(src) ? video(name, texture) : image(name)) };
    const { media } = source;
    media.crossOrigin = 'anonymous';
    media.onerror = () => report('missing');
    media.src = resolveMediaUrl(src);
    textures.set(name, source);
    set(name, texture);
    set(`${name}Size`, NONE);
  };

  let frame = 0;
  let last: number | undefined;
  const loop = (now: number) => {
    if (playing && last !== undefined) set('uTime', program.uniforms.uTime.value + step((now - last) / 1000));
    last = now;
    for (const { refresh } of textures.values()) refresh?.();
    draw();
    frame = requestAnimationFrame(loop);
  };

  let onScreen = false;
  // A still shader with no colour to watch has nothing to do between changes, and every
  // change draws on its own.
  const schedule = () => {
    const visible = onScreen && !document.hidden;
    for (const { play } of textures.values()) play?.(visible && playing);

    const running = visible && (playing || colors.size > 0);
    if (running && !frame) {
      last = undefined;
      frame = requestAnimationFrame(loop);
    } else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const sync = (scene: Scene) => {
    if (!alive) return;
    for (const [name, value] of Object.entries(scene.uniforms))
      if (!same(program.uniforms[name]?.value, value)) set(name, value);

    for (const [name, { token, reader }] of colors)
      if (scene.colors[name] !== token) {
        reader.dispose();
        colors.delete(name);
      }
    for (const [name, token] of Object.entries(scene.colors))
      if (!colors.has(name)) {
        const reader = cssColor(token);
        colors.set(name, { token, reader });
        set(name, reader.read());
      }

    for (const [name, { src }] of textures) if (scene.textures[name] !== src) release(name);
    for (const [name, src] of Object.entries(scene.textures)) if (!textures.has(name)) load(name, src);

    playing = scene.playing;
    schedule();
    draw();
  };

  const sized = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = host;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight);
    // OGL writes the size into the style in pixels, which would hold the host open.
    canvas.style.width = canvas.style.height = '100%';
    set('uResolution', [gl.canvas.width, gl.canvas.height]);
    draw();
  });
  sized.observe(host);

  const seen = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    schedule();
  });
  seen.observe(host);
  document.addEventListener('visibilitychange', schedule);

  const teardown = () => {
    alive = false;
    cancelAnimationFrame(frame);
    sized.disconnect();
    seen.disconnect();
    document.removeEventListener('visibilitychange', schedule);
    canvas.removeEventListener('webglcontextlost', lose);
    for (const { reader } of colors.values()) reader.dispose();
    for (const name of [...textures.keys()]) release(name);
    colors.clear();
    canvas.remove();
  };

  function lose() {
    teardown();
    report('unavailable');
  }
  canvas.addEventListener('webglcontextlost', lose);

  if (!linked) report('broken');

  return {
    sync,
    dispose() {
      teardown();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
