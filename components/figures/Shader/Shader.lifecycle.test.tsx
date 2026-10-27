import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveImageUrl } from '@/lib/cdn';

import { Shader } from './Shader';

const gpu = vi.hoisted(() => ({
  linked: true,
  renders: 0,
  colour: [0, 0, 1] as number[],
  canvas: undefined as HTMLCanvasElement | undefined,
  uniforms: {} as Record<string, { value: unknown }>,
}));

vi.mock('ogl', () => ({
  Renderer: class {
    gl;
    constructor() {
      const canvas = document.createElement('canvas');
      gpu.canvas = canvas;
      this.gl = {
        canvas,
        LINK_STATUS: 1,
        getProgramParameter: () => gpu.linked,
        getExtension: () => ({ loseContext: () => canvas.dispatchEvent(new Event('webglcontextlost')) }),
      };
    }
    setSize() {}
    render() {
      gpu.renders++;
    }
  },
  Program: class {
    program = {};
    uniforms;
    constructor(_: unknown, { uniforms }: { uniforms: Record<string, { value: unknown }> }) {
      this.uniforms = uniforms;
      gpu.uniforms = uniforms;
    }
  },
  Mesh: class {},
  Triangle: class {},
  Texture: class {
    image: unknown;
  },
}));

vi.mock('@/lib/css-color', () => ({
  cssColor: () => ({ read: () => gpu.colour, dispose: () => {} }),
}));

const frames = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));

describe('Shader, once it has a GPU', () => {
  beforeEach(() => {
    Object.assign(gpu, { linked: true, renders: 0, colour: [0, 0, 1] });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ getExtension: () => null } as unknown as RenderingContext);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly report: () => void) {}
        observe() {
          this.report();
        }
        disconnect() {}
      },
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: IntersectionObserverCallback) {}
        observe() {
          this.report([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
        }
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a texture from the CDN, then hands the shader the image and its size', async () => {
    const images: { src: string; crossOrigin: string; onload: (() => void) | null }[] = [];
    vi.stubGlobal(
      'Image',
      class {
        src = '';
        crossOrigin = '';
        onload: (() => void) | null = null;
        naturalWidth = 1200;
        naturalHeight = 1000;
        constructor() {
          images.push(this);
        }
      },
    );
    render(
      <Shader fragment="void main() {}" label="A surface" uniforms={{}} textures={{ uImage: 'blog/meadow.jpg' }} />,
    );
    await waitFor(() => expect(gpu.renders).toBeGreaterThan(0));
    const [image] = images;

    expect(image.src).toBe(resolveImageUrl('blog/meadow.jpg'));
    expect(image.crossOrigin).toBe('anonymous');
    expect(gpu.uniforms.uImageSize.value).toEqual([0, 0]);

    const settled = gpu.renders;
    act(() => image.onload?.());
    await waitFor(() => expect(gpu.renders).toBe(settled + 1));

    expect(gpu.uniforms.uImageSize.value).toEqual([1200, 1000]);
    expect((gpu.uniforms.uImage.value as { image: unknown }).image).toBe(image);
  });

  const shader = (uniforms: Record<string, number>, playing = false) => (
    <Shader
      fragment="void main() {}"
      label="A surface"
      uniforms={uniforms}
      colors={{ uInk: '--primary' }}
      playing={playing}
    />
  );

  it('draws once it is sized, then only when something has moved', async () => {
    const { rerender } = render(shader({ uFrequency: 1 }));
    await waitFor(() => expect(gpu.renders).toBeGreaterThan(0));
    const settled = gpu.renders;

    await frames();
    expect(gpu.renders).toBe(settled);

    rerender(shader({ uFrequency: 2 }));
    await waitFor(() => {
      expect(gpu.renders).toBe(settled + 1);
      expect(gpu.uniforms.uFrequency.value).toBe(2);
    });
  });

  it('redraws when a colour token comes to resolve differently, as a theme flip makes it', async () => {
    render(shader({ uFrequency: 1 }));
    await waitFor(() => expect(gpu.renders).toBeGreaterThan(0));
    const settled = gpu.renders;

    gpu.colour = [1, 0, 0];
    await waitFor(() => {
      expect(gpu.renders).toBe(settled + 1);
      expect(gpu.uniforms.uInk.value).toEqual([1, 0, 0]);
    });
  });

  it('takes a uniform it was not given at first', async () => {
    const { rerender } = render(shader({ uFrequency: 1 }));
    await frames();

    rerender(shader({ uFrequency: 1, uLight: 0.5 }));
    await waitFor(() => expect(gpu.uniforms.uLight.value).toBe(0.5));
  });

  it('runs its clock and redraws every frame while playing, and holds both once paused', async () => {
    const { rerender } = render(shader({ uFrequency: 1 }, true));
    await waitFor(() => expect(gpu.uniforms.uTime.value).toBeGreaterThan(0));

    rerender(shader({ uFrequency: 1 }, false));
    await frames();
    const [time, renders] = [gpu.uniforms.uTime.value, gpu.renders];
    await frames();

    expect(gpu.uniforms.uTime.value).toBe(time);
    expect(gpu.renders).toBe(renders);
  });

  it('says so, rather than showing an empty panel, when its shader does not link', async () => {
    gpu.linked = false;
    render(shader({ uFrequency: 1 }));
    await frames();

    expect(screen.getByRole('img', { name: 'A surface' })).toHaveTextContent(/needs WebGL/);
    expect(gpu.renders).toBe(0);
  });

  it('says so when the browser takes its context away', async () => {
    render(shader({ uFrequency: 1 }));
    await frames();

    act(() => {
      gpu.canvas?.dispatchEvent(new Event('webglcontextlost'));
    });

    expect(screen.getByRole('img', { name: 'A surface' })).toHaveTextContent(/needs WebGL/);
    expect(gpu.canvas?.isConnected).toBe(false);
  });
});
