'use client';

import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

import { cssColor } from '@/lib/css-color';
import { MAX_DPR, VERTEX } from '@/lib/gl';

import type { Visual } from './types';

// Per edge, not radial: the frame is a rectangle and the visual has to leave by its
// sides. Two gradients, one per axis, each fading its own pair.
const EDGE_FADE = [
  'linear-gradient(to right, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
  'linear-gradient(to bottom, var(--background) 0%, transparent 16%, transparent 84%, var(--background) 100%)',
].join(', ');

// Darkens the corner the type sits in, so the visual never has to be quiet everywhere.
const CENTRE_WASH =
  'radial-gradient(105% 62% at 30% 100%, var(--background) 0%, oklch(from var(--background) l c h / 0.92) 42%, oklch(from var(--background) l c h / 0.5) 70%, transparent 95%)';

interface BackdropProps {
  visual: Visual;
}

export function Backdrop({ visual }: BackdropProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, MAX_DPR),
      // The page shows through, so the theme's background is never copied into the
      // frame and cannot go stale there when the theme flips.
      alpha: true,
    });
    const gl = renderer.gl;
    gl.canvas.className = 'block h-full w-full';
    host.appendChild(gl.canvas);

    const accent = cssColor('--primary');
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
    const sized = new ResizeObserver(resize);
    sized.observe(host);
    resize();

    let frame = 0;
    let last = 0;
    let elapsed = 0;
    const loop = (now: number) => {
      elapsed += (now - last) / 1000;
      last = now;
      draw(elapsed);
      frame = requestAnimationFrame(loop);
    };

    // Every reason to stop resolved in one place. Held apart, returning to the tab
    // started the loop even where the column is display:none and the canvas has never
    // been on screen. Reduced motion keeps the field and never enters the loop, so it
    // shows the single frame `resize` drew.
    let onScreen = false;
    const sync = () => {
      const running = onScreen && !document.hidden && !reduced;
      if (running && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      } else if (!running && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 }
    );
    seen.observe(host);
    document.addEventListener('visibilitychange', sync);

    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      document.removeEventListener('visibilitychange', sync);
      accent.dispose();
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [visual]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div ref={hostRef} className="absolute inset-0" />

      {/* Framing, held here so a visual never draws its own, and in CSS so it follows
          the theme with nothing to read. No backdrop-filter: over a canvas redrawing
          every frame the compositor re-blurs it every frame too, which costs whole
          frames. Softness belongs in the shader. */}
      <div className="absolute inset-0" style={{ background: EDGE_FADE }} />
      <div className="absolute inset-0" style={{ background: CENTRE_WASH }} />
    </div>
  );
}
