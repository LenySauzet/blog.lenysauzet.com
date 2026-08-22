'use client';

import { useTheme } from 'next-themes';
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
  'radial-gradient(75% 55% at 38% 78%, oklch(from var(--background) l c h / 0.88) 0%, oklch(from var(--background) l c h / 0.45) 50%, transparent 85%)';

const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Tokens are authored in oklch and `getComputedStyle` hands them back in oklch, so
// there is nothing to parse. Painting one pixel is the conversion: a 2D canvas is
// sRGB, so the byte it stores is the colour the page shows.
function readColor(token: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.cssText = `position:fixed;width:0;height:0;opacity:0;color:var(${token})`;
  document.body.appendChild(probe);
  const css = getComputedStyle(probe).color;
  probe.remove();

  const surface = document.createElement('canvas');
  surface.width = surface.height = 1;
  const ctx = surface.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

export interface BackdropProps {
  visual: Visual;
  className?: string;
}

export function Backdrop({ visual, className }: BackdropProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const colors = useRef<Program | null>(null);
  const { resolvedTheme } = useTheme();

  // A theme change is two numbers, not a reason to throw the context away.
  useEffect(() => {
    const program = colors.current;
    if (!program) return;
    program.uniforms.uColor.value = readColor('--primary');
    program.uniforms.uBackground.value = readColor('--background');
  }, [resolvedTheme]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, MAX_DPR),
      alpha: false,
    });
    const gl = renderer.gl;
    host.appendChild(gl.canvas);
    gl.canvas.className = 'block h-full w-full';

    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: visual.fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1] },
        uColor: { value: readColor('--primary') },
        uBackground: { value: readColor('--background') },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    colors.current = program;

    const draw = (seconds: number) => {
      program.uniforms.uTime.value = seconds;
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

    // Reduced motion gets the field, just not its movement.
    if (reduced) return () => { observer.disconnect(); gl.canvas.remove(); };

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
      onScreen.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      colors.current = null;
    };
  }, [visual]);

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div ref={hostRef} className="absolute inset-0" />

      {/* Framing, held here so a visual never draws its own. No backdrop-filter:
          over a canvas that redraws every frame the compositor re-blurs it every
          frame too, which costs whole frames. Softness belongs in the shader. */}
      <div className="absolute inset-0" style={{ background: EDGE_FADE }} />
      <div className="absolute inset-0" style={{ background: CENTRE_WASH }} />
    </div>
  );
}
