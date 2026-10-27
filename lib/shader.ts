import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';

import { resolveImageUrl } from '@/lib/cdn';
import { step } from '@/lib/clock';
import { cssColor } from '@/lib/css-color';

export type Uniform = number | readonly number[];

export type Status = 'ready' | 'unavailable' | 'broken' | 'missing';

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

const VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

let webgl2: boolean | undefined;

export function supportsWebGL2() {
  if (webgl2 === undefined) {
    const context = document.createElement('canvas').getContext('webgl2');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    webgl2 = context !== null;
  }
  return webgl2;
}

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

const same = (a: Uniform | undefined, b: Uniform) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((value, index) => value === b[index])
    : a === b;

export function createShader(host: HTMLElement, fragment: string, report: (status: Status) => void) {
  if (!supportsWebGL2()) {
    report('unavailable');
    return { sync: () => {}, dispose: () => {} };
  }

  const renderer = new Renderer({ webgl: 2, dpr: Math.min(window.devicePixelRatio, MAX_DPR), alpha: true });
  const gl = renderer.gl;
  gl.canvas.className = 'block h-full w-full';
  host.appendChild(gl.canvas);

  const program = new Program(gl, {
    vertex: VERTEX,
    fragment,
    uniforms: { uResolution: { value: [1, 1] }, uTime: { value: 0 } },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const linked = gl.getProgramParameter(program.program, gl.LINK_STATUS);

  const colors = new Map<string, { token: string; reader: ReturnType<typeof cssColor> }>();
  const textures = new Map<string, { src: string; image: HTMLImageElement }>();
  let playing = false;
  let dirty = true;

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

  const sync = (scene: Scene) => {
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

    for (const [name, { src, image }] of textures)
      if (scene.textures[name] !== src) {
        image.onload = image.onerror = null;
        textures.delete(name);
      }
    for (const [name, src] of Object.entries(scene.textures))
      if (!textures.has(name)) {
        const texture = new Texture(gl, { minFilter: gl.LINEAR_MIPMAP_LINEAR, anisotropy: ANISOTROPY });
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          texture.image = image;
          set(`${name}Size`, [image.naturalWidth, image.naturalHeight]);
        };
        image.onerror = () => report('missing');
        image.src = resolveImageUrl(src);
        textures.set(name, { src, image });
        set(name, texture);
        set(`${name}Size`, [0, 0]);
      }

    playing = scene.playing;
    draw();
  };

  const sized = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = host;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight);
    set('uResolution', [gl.canvas.width, gl.canvas.height]);
    draw();
  });
  sized.observe(host);

  let frame = 0;
  let last: number | undefined;
  const loop = (now: number) => {
    if (playing && last !== undefined) set('uTime', program.uniforms.uTime.value + step((now - last) / 1000));
    last = now;
    draw();
    frame = requestAnimationFrame(loop);
  };

  let onScreen = false;
  const schedule = () => {
    const running = onScreen && !document.hidden;
    if (running && !frame) {
      last = undefined;
      frame = requestAnimationFrame(loop);
    } else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  const seen = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    schedule();
  });
  seen.observe(host);
  document.addEventListener('visibilitychange', schedule);

  const lose = () => {
    gl.canvas.remove();
    report('unavailable');
  };
  gl.canvas.addEventListener('webglcontextlost', lose);

  if (!linked) report('broken');

  return {
    sync,
    dispose() {
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      gl.canvas.removeEventListener('webglcontextlost', lose);
      for (const { reader } of colors.values()) reader.dispose();
      for (const { image } of textures.values()) image.onload = image.onerror = null;
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
