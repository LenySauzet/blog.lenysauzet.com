import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveImageUrl } from '@/lib/cdn';

import { createShader, statusStore, type Scene } from './shader';

const gpu = vi.hoisted(() => ({
  linked: true,
  renders: 0,
  colour: [0, 0, 1] as number[],
  canvas: undefined as HTMLCanvasElement | undefined,
  uniforms: {} as Record<string, { value: unknown }>,
  disposed: 0,
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
        LINEAR_MIPMAP_LINEAR: 2,
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
  cssColor: () => ({ read: () => gpu.colour, dispose: () => gpu.disposed++ }),
}));

const frames = () => new Promise((resolve) => setTimeout(resolve, 80));

const until = async (condition: () => boolean) => {
  for (let i = 0; i < 50 && !condition(); i++) await new Promise((resolve) => setTimeout(resolve, 10));
  expect(condition()).toBe(true);
};

const scene = (overrides: Partial<Scene> = {}): Scene => ({
  uniforms: { uFrequency: 1 },
  colors: { uInk: '--primary' },
  textures: {},
  playing: false,
  ...overrides,
});

describe('a shader', () => {
  let shader: ReturnType<typeof createShader> | undefined;
  const report = vi.fn();

  const start = (first = scene()) => {
    shader = createShader(document.createElement('div'), '#version 300 es', report);
    shader.sync(first);
    return shader;
  };

  beforeEach(() => {
    Object.assign(gpu, { linked: true, renders: 0, colour: [0, 0, 1], disposed: 0 });
    report.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getExtension: () => null,
    } as unknown as RenderingContext);
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
    shader?.dispose();
    vi.unstubAllGlobals();
  });

  it('draws once it is sized, then only when something has moved', async () => {
    const shader = start();
    const settled = gpu.renders;
    expect(settled).toBeGreaterThan(0);

    await frames();
    shader.sync(scene());
    expect(gpu.renders).toBe(settled);

    shader.sync(scene({ uniforms: { uFrequency: 2 } }));
    expect(gpu.renders).toBe(settled + 1);
    expect(gpu.uniforms.uFrequency.value).toBe(2);
  });

  it('compares a vector by its values, not by the array that carries it', () => {
    const shader = start(scene({ uniforms: { uLight: [0, 1, 0] } }));
    const settled = gpu.renders;

    shader.sync(scene({ uniforms: { uLight: [0, 1, 0] } }));

    expect(gpu.renders).toBe(settled);
  });

  it('redraws when a colour token comes to resolve differently, as a theme flip makes it', async () => {
    start();
    const settled = gpu.renders;

    gpu.colour = [1, 0, 0];
    await until(() => gpu.renders === settled + 1);

    expect(gpu.uniforms.uInk.value).toEqual([1, 0, 0]);
  });

  it('follows a colour to another token, letting the first go', () => {
    const shader = start();

    shader.sync(scene({ colors: { uInk: '--foreground' } }));

    expect(gpu.disposed).toBe(1);
  });

  it('takes a uniform it was not given at first', () => {
    const shader = start();

    shader.sync(scene({ uniforms: { uFrequency: 1, uLight: 0.5 } }));

    expect(gpu.uniforms.uLight.value).toBe(0.5);
  });

  it('runs its clock and redraws every frame while playing, and holds both once paused', async () => {
    const shader = start(scene({ playing: true }));
    await until(() => (gpu.uniforms.uTime.value as number) > 0);

    shader.sync(scene({ playing: false }));
    await frames();
    const [time, renders] = [gpu.uniforms.uTime.value, gpu.renders];
    await frames();

    expect(gpu.uniforms.uTime.value).toBe(time);
    expect(gpu.renders).toBe(renders);
  });

  describe('a texture', () => {
    const images: { src: string; crossOrigin: string; onload: (() => void) | null; onerror: (() => void) | null }[] = [];

    beforeEach(() => {
      images.length = 0;
      vi.stubGlobal(
        'Image',
        class {
          src = '';
          crossOrigin = '';
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;
          naturalWidth = 1200;
          naturalHeight = 1000;
          constructor() {
            images.push(this);
          }
        },
      );
    });

    it('is fetched from the CDN, then drawn with its size once it loads', async () => {
      start(scene({ textures: { uImage: 'blog/meadow.jpg' } }));
      const [image] = images;

      expect(image.src).toBe(resolveImageUrl('blog/meadow.jpg'));
      expect(image.crossOrigin).toBe('anonymous');
      expect(gpu.uniforms.uImageSize.value).toEqual([0, 0]);

      const settled = gpu.renders;
      image.onload?.();
      await until(() => gpu.renders === settled + 1);

      expect(gpu.uniforms.uImageSize.value).toEqual([1200, 1000]);
      expect((gpu.uniforms.uImage.value as { image: unknown }).image).toBe(image);
    });

    it('is fetched once, however often the scene is synced', () => {
      const shader = start(scene({ textures: { uImage: 'blog/meadow.jpg' } }));

      shader.sync(scene({ textures: { uImage: 'blog/meadow.jpg' } }));

      expect(images).toHaveLength(1);
    });

    it('reports the image missing when it cannot be loaded', () => {
      start(scene({ textures: { uImage: 'blog/gone.jpg' } }));

      images[0].onerror?.();

      expect(report).toHaveBeenCalledWith('missing');
    });
  });

  it('reports itself broken, and draws nothing, when its shader does not link', () => {
    gpu.linked = false;
    start();

    expect(report).toHaveBeenCalledWith('broken');
    expect(gpu.renders).toBe(0);
  });

  it('reports itself unavailable when the browser takes its context away', () => {
    start();

    gpu.canvas?.dispatchEvent(new Event('webglcontextlost'));

    expect(report).toHaveBeenCalledWith('unavailable');
    expect(gpu.canvas?.isConnected).toBe(false);
  });
});

describe('a status store', () => {
  it('tells its listeners when the status changes, and only then', () => {
    const store = statusStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.set('ready');
    store.set('broken');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBe('broken');
  });
});
