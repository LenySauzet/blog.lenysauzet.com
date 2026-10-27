'use client';

import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { cssColor } from '@/lib/css-color';
import { MAX_DPR, VERTEX } from '@/lib/gl';
import { cn } from '@/lib/utils';

type Uniform = number | readonly number[];

let webgl: boolean | undefined;
const probe = () => {
  if (webgl === undefined) {
    const context = document.createElement('canvas').getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    webgl = context !== null;
  }
  return webgl;
};
const unchanging = () => () => {};

export interface ShaderProps {
  fragment: string;
  label: string;
  uniforms: Record<string, Uniform>;
  colors?: Record<string, `--${string}`>;
  className?: string;
}

export function Shader({
  fragment,
  label,
  uniforms,
  colors = {},
  className,
}: ShaderProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef({ uniforms, colors, dirty: true });
  const supported = useSyncExternalStore(unchanging, probe, () => true);

  useEffect(() => {
    live.current.uniforms = uniforms;
    live.current.dirty = true;
  }, [uniforms]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supported) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, MAX_DPR),
      alpha: true,
    });
    const gl = renderer.gl;
    gl.canvas.className = 'block h-full w-full';
    host.appendChild(gl.canvas);

    const state = live.current;
    const tokens = Object.entries(state.colors).map(
      ([name, token]) => [name, cssColor(token)] as const,
    );
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment,
      uniforms: Object.fromEntries([
        ['uResolution', { value: [1, 1] }],
        ...Object.entries(state.uniforms).map(([name, value]) => [name, { value }]),
        ...tokens.map(([name, color]) => [name, { value: color.read() }]),
      ]),
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const draw = () => {
      for (const [name, color] of tokens) {
        const value = color.read();
        if (program.uniforms[name].value === value) continue;
        program.uniforms[name].value = value;
        state.dirty = true;
      }
      if (!state.dirty) return;

      for (const [name, value] of Object.entries(state.uniforms))
        program.uniforms[name].value = value;
      renderer.render({ scene: mesh });
      state.dirty = false;
    };

    const sized = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
      state.dirty = true;
      draw();
    });
    sized.observe(host);

    let frame = 0;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };

    let onScreen = false;
    const sync = () => {
      const running = onScreen && !document.hidden;
      if (running && !frame) frame = requestAnimationFrame(loop);
      else if (!running && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    seen.observe(host);
    document.addEventListener('visibilitychange', sync);

    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      document.removeEventListener('visibilitychange', sync);
      for (const [, color] of tokens) color.dispose();
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [fragment, supported]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className={cn('grid place-items-center', className)}
    >
      {!supported && (
        <p className="text-sm text-subtle-foreground">
          This figure needs WebGL, which this browser does not offer.
        </p>
      )}
    </div>
  );
}
