'use client';

import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { LONGEST_STEP } from '@/components/figures/Playback';
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
  aspect?: number;
  playing?: boolean;
  className?: string;
}

export function Shader({
  fragment,
  label,
  uniforms,
  colors = {},
  aspect = 1,
  playing = false,
  className,
}: ShaderProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef({ uniforms, playing, dirty: true });
  const supported = useSyncExternalStore(unchanging, probe, () => true);
  const [lost, setLost] = useState(false);
  const palette = JSON.stringify(colors);

  useEffect(() => {
    live.current.uniforms = uniforms;
    live.current.dirty = true;
  }, [uniforms]);

  useEffect(() => {
    live.current.playing = playing;
  }, [playing]);

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

    const lose = () => {
      gl.canvas.remove();
      setLost(true);
    };
    gl.canvas.addEventListener('webglcontextlost', lose);

    const state = live.current;
    const named: Record<string, `--${string}`> = JSON.parse(palette);
    const tokens = Object.entries(named).map(
      ([name, token]) => [name, cssColor(token)] as const,
    );
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment,
      uniforms: Object.fromEntries([
        ['uResolution', { value: [1, 1] }],
        ['uTime', { value: 0 }],
        ...Object.entries(state.uniforms).map(([name, value]) => [name, { value }]),
        ...tokens.map(([name, color]) => [name, { value: color.read() }]),
      ]),
    });
    if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
      for (const [, color] of tokens) color.dispose();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return () => gl.canvas.removeEventListener('webglcontextlost', lose);
    }
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
        (program.uniforms[name] ??= { value }).value = value;
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
    let last = 0;
    const loop = (now: number) => {
      if (state.playing) {
        program.uniforms.uTime.value += Math.min((now - last) / 1000, LONGEST_STEP);
        state.dirty = true;
      }
      last = now;
      draw();
      frame = requestAnimationFrame(loop);
    };

    let onScreen = false;
    const sync = () => {
      const running = onScreen && !document.hidden;
      if (running && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
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
      gl.canvas.removeEventListener('webglcontextlost', lose);
      for (const [, color] of tokens) color.dispose();
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [fragment, supported, palette]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      style={{ aspectRatio: aspect }}
      className={cn('grid place-items-center', className)}
    >
      {(!supported || lost) && (
        <p className="text-sm text-subtle-foreground">
          This figure needs WebGL, which is not available here.
        </p>
      )}
    </div>
  );
}
