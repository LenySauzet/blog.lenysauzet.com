'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { createShader, statusStore, type Scene, type Status, type Uniform } from '@/lib/shader';
import { cn } from '@/lib/utils';

const FAILURES: Record<Exclude<Status, 'ready'>, string> = {
  unavailable: 'This figure needs WebGL 2, which is not available here.',
  broken: 'This figure could not be drawn.',
  missing: 'The image this figure draws on could not be loaded.',
};

const NONE = {};

export interface ShaderProps {
  fragment: string;
  label?: string;
  uniforms?: Record<string, Uniform>;
  colors?: Scene['colors'];
  textures?: Scene['textures'];
  playing?: boolean;
  aspect?: number;
  className?: string;
}

export function Shader({
  fragment,
  label,
  uniforms = NONE,
  colors = NONE,
  textures = NONE,
  playing = false,
  aspect,
  className,
}: ShaderProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof createShader>>(null);
  const [store] = useState(statusStore);
  const status = useSyncExternalStore(store.subscribe, store.get, store.get);

  useEffect(() => {
    if (!hostRef.current) return;
    const shader = createShader(hostRef.current, fragment, store.set);
    engine.current = shader;
    return () => {
      shader.dispose();
      engine.current = null;
    };
  }, [fragment, store]);

  useEffect(() => {
    engine.current?.sync({ uniforms, colors, textures, playing });
  });

  return (
    <div
      ref={hostRef}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      style={aspect ? { aspectRatio: aspect } : undefined}
      className={cn('grid place-items-center [&>*]:[grid-area:1/1]', className)}
    >
      {label && status !== 'ready' && (
        <p className="px-6 text-center text-sm text-subtle-foreground">{FAILURES[status]}</p>
      )}
    </div>
  );
}
