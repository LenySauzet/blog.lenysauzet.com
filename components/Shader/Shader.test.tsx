import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Scene, Status } from '@/lib/shader';

import { Shader } from './Shader';

const engine = vi.hoisted(() => ({
  report: undefined as ((status: Status) => void) | undefined,
  scenes: [] as Scene[],
  created: 0,
}));

vi.mock('@/lib/shader', async (original) => ({
  ...(await original<typeof import('@/lib/shader')>()),
  createShader: (_: HTMLElement, __: string, report: (status: Status) => void) => {
    engine.report = report;
    engine.created++;
    return { sync: (scene: Scene) => engine.scenes.push(scene), dispose: () => {} };
  },
}));

describe('Shader', () => {
  it('stands as one image when it is named, and is hidden when it only decorates', () => {
    const { container } = render(
      <>
        <Shader fragment="a" label="A lit surface" />
        <Shader fragment="b" />
      </>,
    );

    expect(screen.getByRole('img', { name: 'A lit surface' })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('hands the engine the props it is given, on every render', () => {
    engine.scenes.length = 0;
    const { rerender } = render(<Shader fragment="a" uniforms={{ uFrequency: 1 }} />);
    rerender(<Shader fragment="a" uniforms={{ uFrequency: 2 }} playing />);

    expect(engine.scenes.at(-1)).toMatchObject({ uniforms: { uFrequency: 2 }, playing: true });
  });

  it('builds a new engine for a new fragment, and only then', () => {
    engine.created = 0;
    const { rerender } = render(<Shader fragment="a" />);
    rerender(<Shader fragment="a" uniforms={{ uFrequency: 2 }} />);
    rerender(<Shader fragment="b" />);

    expect(engine.created).toBe(2);
  });

  it.each([
    ['unavailable', /needs WebGL 2/],
    ['broken', /could not be drawn/],
    ['missing', /image this figure draws on could not be loaded/],
  ] as const)('says what went wrong when the engine reports itself %s', (status, message) => {
    render(<Shader fragment="a" label="A lit surface" />);

    act(() => engine.report?.(status));

    expect(screen.getByRole('img', { name: 'A lit surface' })).toHaveTextContent(message);
  });

  it('keeps a decorative failure silent', () => {
    const { container } = render(<Shader fragment="a" />);

    act(() => engine.report?.('broken'));

    expect(container).toHaveTextContent('');
  });
});
