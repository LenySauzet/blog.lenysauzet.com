'use client';

import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import type { Visual } from './types';

// A full-frame fragment shader costs every pixel it is given, and past two the
// extra ones are not visible enough to pay for.
const MAX_DPR = 2;

// Per edge, not radial: the frame is a rectangle and the visual has to leave by its
// sides. Two gradients, one per axis, each fading its own pair.
const EDGE_FADE = [
  'linear-gradient(to right, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
  'linear-gradient(to bottom, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
].join(', ');

// What sits the type on something quiet.
const CENTRE_WASH =
  'radial-gradient(105% 62% at 30% 100%, var(--background) 0%, oklch(from var(--background) l c h / 0.92) 42%, oklch(from var(--background) l c h / 0.5) 70%, transparent 95%)';

const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * The accent, read out of CSS on every frame that draws.
 *
 * There is nothing to subscribe to: a theme class, an inline override and an edit to
 * a rule in the stylesheet all change what CSS resolves, and only the first two are
 * DOM mutations. Reading it each frame is the only way to be right in all three, and
 * it is affordable because the conversion is skipped unless the string has moved.
 *
 * Tokens are authored in oklch and `getComputedStyle` hands them back in oklch, so
 * there is nothing to parse. Painting one pixel is the conversion: a 2D canvas is
 * sRGB, so the byte it stores is the colour the page shows.
 */
function accentReader(token: string) {
  const probe = document.createElement('span');
  probe.style.cssText = `position:fixed;width:0;height:0;opacity:0;color:var(${token})`;
  document.body.appendChild(probe);

  const surface = document.createElement('canvas');
  surface.width = surface.height = 1;
  const ctx = surface.getContext('2d', { willReadFrequently: true });

  let last = '';
  let value: [number, number, number] = [0, 0, 0];

  return {
    read(): [number, number, number] {
      const css = getComputedStyle(probe).color;
      if (css !== last && ctx) {
        last = css;
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        value = [r / 255, g / 255, b / 255];
      }
      return value;
    },
    dispose: () => probe.remove(),
  };
}

export interface BackdropProps {
  visual: Visual;
  className?: string;
}

export function Backdrop({ visual, className }: BackdropProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, MAX_DPR),
      // The page shows through, so the theme's background is never copied into the
      // frame and can never go stale there. Costs one composite blend per pixel.
      alpha: true,
    });
    const gl = renderer.gl;
    host.appendChild(gl.canvas);
    gl.canvas.className = 'block h-full w-full';

    const accent = accentReader('--primary');

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: visual.fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uColor: { value: accent.read() },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const draw = (seconds: number) => {
      program.uniforms.uTime.value = seconds;
      program.uniforms.uColor.value = accent.read();
      renderer.render({ scene: mesh });
    };

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
      draw(program.uniforms.uTime.value);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    // Reduced motion gets one frame, so the accent it reads is the one at mount.
    if (reduced)
      return () => {
        observer.disconnect();
        accent.dispose();
        gl.canvas.remove();
      };

    let frame = 0;
    let start = performance.now();
    let elapsed = 0;
    const loop = (now: number) => {
      elapsed += (now - start) / 1000;
      start = now;
      draw(elapsed);
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (frame) return;
      start = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const pause = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Off-screen covers the small viewports, where the column is display:none and
    // would otherwise render a canvas nobody sees.
    const onScreen = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? play() : pause()),
      { threshold: 0 }
    );
    onScreen.observe(host);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      pause();
      observer.disconnect();
      accent.dispose();
      onScreen.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [visual]);

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div ref={hostRef} className="absolute inset-0" />

      {/* Framing, held here so a visual never draws its own, and in CSS so it
          follows the theme without anyone reading a token. No backdrop-filter: over
          a canvas that redraws every frame the compositor re-blurs it every frame
          too, which costs whole frames. Softness belongs in the shader. */}
      <div className="absolute inset-0" style={{ background: EDGE_FADE }} />
      <div className="absolute inset-0" style={{ background: CENTRE_WASH }} />
    </div>
  );
}
