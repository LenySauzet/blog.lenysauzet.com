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
  deleted: [] as unknown[],
}));

vi.mock('ogl', () => ({
  Renderer: class {
    gl;
    constructor({ canvas }: { canvas: HTMLCanvasElement }) {
      gpu.canvas = canvas;
      this.gl = {
        canvas,
        LINK_STATUS: 1,
        LINEAR_MIPMAP_LINEAR: 2,
        getProgramParameter: () => gpu.linked,
        getExtension: () => ({ loseContext: () => canvas.dispatchEvent(new Event('webglcontextlost')) }),
        deleteTexture: (texture: unknown) => gpu.deleted.push(texture),
      };
    }
    setSize(width: number, height: number) {
      Object.assign(gpu.canvas!.style, { width: `${width}px`, height: `${height}px` });
    }
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
    texture = {};
  },
}));

vi.mock('@/lib/css-color', () => ({
  cssColor: () => ({ read: () => gpu.colour, dispose: () => gpu.disposed++ }),
}));

interface FakeImage {
  src: string;
  crossOrigin: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const scene = (overrides: Partial<Scene> = {}): Scene => ({
  uniforms: { uFrequency: 1 },
  colors: { uInk: '--primary' },
  textures: {},
  playing: false,
  ...overrides,
});

describe('a shader', () => {
  let shader: ReturnType<typeof createShader> | undefined;
  let frames: FrameRequestCallback[];
  const images: FakeImage[] = [];
  const report = vi.fn();

  const start = (first = scene()) => {
    shader = createShader(document.createElement('div'), '#version 300 es', report);
    shader.sync(first);
    return shader;
  };

  const tick = (now: number) => {
    const pending = frames;
    frames = [];
    for (const frame of pending) frame(now);
  };

  beforeEach(() => {
    Object.assign(gpu, { linked: true, renders: 0, colour: [0, 0, 1], disposed: 0, deleted: [] });
    frames = [];
    images.length = 0;
    report.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as RenderingContext);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
    vi.stubGlobal('cancelAnimationFrame', () => (frames = []));
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
    vi.stubGlobal(
      'Image',
      class implements FakeImage {
        src = '';
        crossOrigin = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 1200;
        naturalHeight = 1000;
        constructor() {
          images.push(this);
        }
        decode() {
          return Promise.resolve();
        }
      },
    );
  });

  afterEach(() => {
    shader?.dispose();
    shader = undefined;
    vi.unstubAllGlobals();
  });

  it('says it is unavailable, and builds nothing, where there is no WebGL 2', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    start();

    expect(report).toHaveBeenCalledWith('unavailable');
    expect(gpu.renders).toBe(0);
  });

  it('draws once it is sized, then only when something has moved', () => {
    const shader = start();
    const settled = gpu.renders;
    expect(settled).toBeGreaterThan(0);

    tick(16);
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

  it('redraws when a colour token comes to resolve differently, as a theme flip makes it', () => {
    start();
    const settled = gpu.renders;

    gpu.colour = [1, 0, 0];
    tick(16);

    expect(gpu.renders).toBe(settled + 1);
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

  it('runs no loop at all while still, with no colour to watch', () => {
    start(scene({ colors: {} }));

    expect(frames).toHaveLength(0);
  });

  it("starts its clock from the first frame's own timestamp, then advances by each step", () => {
    start(scene({ playing: true }));

    tick(1000);
    expect(gpu.uniforms.uTime.value).toBe(0);

    tick(1016);
    expect(gpu.uniforms.uTime.value).toBeCloseTo(0.016);
  });

  it('holds its time, and stops drawing, once paused', () => {
    const shader = start(scene({ playing: true }));
    tick(1000);
    tick(1016);

    shader.sync(scene({ playing: false }));
    const [time, renders] = [gpu.uniforms.uTime.value, gpu.renders];
    tick(1032);
    tick(1048);

    expect(gpu.uniforms.uTime.value).toBe(time);
    expect(gpu.renders).toBe(renders);
  });

  describe('a texture', () => {
    const textured = (src = 'blog/meadow.jpg') => scene({ colors: {}, textures: { uImage: src } });

    it('is fetched from the CDN, then drawn with its size once it loads', async () => {
      start(textured());
      const [image] = images;

      expect(image.src).toBe(resolveImageUrl('blog/meadow.jpg'));
      expect(image.crossOrigin).toBe('anonymous');
      expect(gpu.uniforms.uImageSize.value).toEqual([0, 0]);

      const settled = gpu.renders;
      image.onload?.();
      await settle();

      expect(gpu.uniforms.uImageSize.value).toEqual([1200, 1000]);
      expect((gpu.uniforms.uImage.value as { image: unknown }).image).toBe(image);
      expect(gpu.renders).toBe(settled + 1);
    });

    it('is fetched once, however often the scene is synced', () => {
      const shader = start(textured());

      shader.sync(textured());

      expect(images).toHaveLength(1);
    });

    it('lets the first image go, on the GPU too, when its source changes', async () => {
      const shader = start(textured());
      const [first] = images;
      const old = gpu.uniforms.uImage.value as { texture: unknown };

      shader.sync(textured('blog/poplars.jpg'));
      first.onload?.();
      await settle();

      expect(first.onload).toBeNull();
      expect(first.src).toBe('');
      expect(gpu.deleted).toContain(old.texture);
      expect(images[1].src).toBe(resolveImageUrl('blog/poplars.jpg'));
      expect(gpu.uniforms.uImageSize.value).toEqual([0, 0]);
    });

    it('reports the image missing when it cannot be loaded', () => {
      start(textured('blog/gone.jpg'));

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

  it('tears itself down when the browser takes its context away', () => {
    start(scene({ playing: true }));

    gpu.canvas?.dispatchEvent(new Event('webglcontextlost'));
    const renders = gpu.renders;
    tick(1000);
    tick(1016);

    expect(report).toHaveBeenCalledWith('unavailable');
    expect(gpu.canvas?.isConnected).toBe(false);
    expect(gpu.disposed).toBe(1);
    expect(gpu.renders).toBe(renders);
  });

  it('ignores the scene React keeps handing it once its context is gone', () => {
    const shader = start(scene({ playing: true }));
    gpu.canvas?.dispatchEvent(new Event('webglcontextlost'));

    shader.sync(scene({ playing: true, textures: { uImage: 'blog/meadow.jpg' } }));

    expect(frames).toHaveLength(0);
    expect(images).toHaveLength(0);
  });

  it('keeps its canvas sized by the host, though OGL writes pixels into its style', () => {
    start();

    expect(gpu.canvas?.style.width).toBe('100%');
    expect(gpu.canvas?.style.position).toBe('absolute');
  });

  it('reads the latest visibility when the browser reports several at once', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: IntersectionObserverCallback) {}
        observe() {
          this.report(
            [{ isIntersecting: false }, { isIntersecting: true }] as IntersectionObserverEntry[],
            this as never,
          );
        }
        disconnect() {}
      },
    );
    start(scene({ playing: true }));

    expect(frames.length).toBeGreaterThan(0);
  });

  it('lets every colour and image go once disposed', () => {
    const shader = start(scene({ textures: { uImage: 'blog/meadow.jpg' } }));

    shader.dispose();

    expect(gpu.disposed).toBe(1);
    expect(images[0].onload).toBeNull();
    expect(gpu.deleted).toHaveLength(1);
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
