import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveImageUrl, resolveVideoUrl } from '@/lib/cdn';

import { createShader, statusStore, type Scene } from './shader';

const gpu = vi.hoisted(() => ({
  linked: true,
  renders: 0,
  colour: [0, 0, 1] as number[],
  canvas: undefined as HTMLCanvasElement | undefined,
  uniforms: {} as Record<string, { value: unknown }>,
  disposed: 0,
  deleted: [] as unknown[],
  targets: [] as unknown[],
  made: [] as { type?: number; width: number }[],
  extensions: ['EXT_color_buffer_float'] as string[],
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
        LINEAR: 3,
        getExtension: () => ({ loseContext: () => canvas.dispatchEvent(new Event('webglcontextlost')) }),
        deleteTexture: (texture: unknown) => gpu.deleted.push(texture),
      };
    }
    setSize(width: number, height: number) {
      Object.assign(gpu.canvas!.style, { width: `${width}px`, height: `${height}px` });
    }
    render({ target }: { target?: unknown }) {
      if (target) gpu.targets.push(target);
      else gpu.renders++;
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
    needsUpdate = false;
    texture = {};
  },
  RenderTarget: class {
    texture = {};
    width = 0;
    type;
    constructor(_: unknown, { type }: { type?: number }) {
      this.type = type;
      gpu.made.push(this);
    }
    setSize(width: number) {
      this.width = width;
    }
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
    Object.assign(gpu, { linked: true, renders: 0, colour: [0, 0, 1], disposed: 0, deleted: [], targets: [], made: [], extensions: ['EXT_color_buffer_float'] });
    frames = [];
    images.length = 0;
    report.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      HALF_FLOAT: 4,
      RGBA16F: 5,
      getExtension: (name: string) => (gpu.extensions.includes(name) ? {} : null),
    } as unknown as RenderingContext);
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

  describe('a video', () => {
    const filmed = (src = 'blog/Clouds.mp4') => scene({ colors: {}, textures: { uVideo: src } });
    let presented: Map<HTMLVideoElement, () => void>;
    let video: () => HTMLVideoElement;

    beforeEach(() => {
      presented = new Map();
      video = () => [...presented.keys()][0];
      Object.defineProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback', {
        configurable: true,
        value(this: HTMLVideoElement, callback: () => void) {
          presented.set(this, callback);
        },
      });
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
      vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue();
      vi.spyOn(HTMLMediaElement.prototype, 'load').mockReturnValue();
    });

    afterEach(() => {
      Reflect.deleteProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback');
    });

    it('is fetched from the videos on the CDN, muted, and drawn with its size once it has a frame', () => {
      start(filmed());
      const media = video();
      Object.defineProperties(media, { videoWidth: { value: 1280 }, videoHeight: { value: 720 } });

      expect(media.src).toBe(resolveVideoUrl('blog/Clouds.mp4'));
      expect(media.muted && media.loop && media.playsInline).toBe(true);
      expect(images).toHaveLength(0);

      media.dispatchEvent(new Event('loadeddata'));

      expect(gpu.uniforms.uVideoSize.value).toEqual([1280, 720]);
      expect((gpu.uniforms.uVideo.value as { image: unknown }).image).toBe(media);
    });

    it('is uploaded again for each frame it presents, and only then', () => {
      start({ ...filmed(), playing: true });
      const texture = gpu.uniforms.uVideo.value as { needsUpdate: boolean };

      tick(1000);
      tick(1016);
      expect(texture.needsUpdate).toBe(false);

      presented.get(video())?.();
      expect(texture.needsUpdate).toBe(true);
    });

    it('lets a frame presented by a video it has let go of change nothing', () => {
      const shader = start(filmed());
      const old = video();
      const callback = presented.get(old);
      shader.sync(filmed('blog/Rain.mp4'));
      presented.delete(old);
      const texture = gpu.uniforms.uVideo.value as { needsUpdate: boolean };

      callback?.();

      expect(texture.needsUpdate).toBe(false);
      expect(presented.has(old)).toBe(false);
    });

    it('is uploaded on every frame while it plays, where the browser cannot say when it presents', () => {
      Reflect.deleteProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback');
      vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);
      start({ ...filmed(), playing: true });
      const texture = gpu.uniforms.uVideo.value as { needsUpdate: boolean };

      tick(1000);

      expect(texture.needsUpdate).toBe(true);
    });

    it('is left alone while paused, though a colour keeps the loop running', () => {
      Reflect.deleteProperty(HTMLVideoElement.prototype, 'requestVideoFrameCallback');
      start({ ...filmed(), colors: { uInk: '--primary' } });
      const texture = gpu.uniforms.uVideo.value as { needsUpdate: boolean };

      tick(1000);

      expect(frames.length).toBeGreaterThan(0);
      expect(texture.needsUpdate).toBe(false);
    });

    it('plays while the shader plays, and pauses with it', () => {
      const shader = start({ ...filmed(), playing: true });
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

      shader.sync(filmed());

      expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it('stops downloading once its source changes', () => {
      const shader = start(filmed());
      const media = video();

      shader.sync(filmed('blog/Rain.mp4'));

      expect(media.hasAttribute('src')).toBe(false);
      expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
    });
  });

  describe('a feedback pass', () => {
    const looping = (first = scene({ colors: {} })) => {
      shader = createShader(document.createElement('div'), '#version 300 es', report, '#version 300 es');
      shader.sync(first);
      return shader;
    };

    it('draws into one target while reading the other, and swaps them each step', () => {
      looping(scene({ colors: {}, playing: true }));
      tick(1000);
      tick(1016);
      tick(1032);

      const [first, second] = gpu.targets;
      expect(first).not.toBe(second);
      expect(gpu.uniforms.uFeedback.value).toBe((second as { texture: unknown }).texture);
    });

    it('holds still while paused', () => {
      looping();
      tick(1000);
      tick(1016);

      expect(gpu.targets).toHaveLength(0);
    });

    it('steps at the pace of the clock it is handed', () => {
      looping(scene({ colors: {}, playing: true }));
      tick(1000);
      tick(1008);

      expect(gpu.uniforms.uDelta.value).toBeCloseTo(0.008);
    });

    it.each([
      ['float', ['EXT_color_buffer_float'], 4],
      ['half float', ['EXT_color_buffer_half_float'], 4],
      ['neither', [], undefined],
    ])('draws in half floats where the GPU can render %s, and in eight bits otherwise', (_, extensions, type) => {
      gpu.extensions = extensions;
      looping();

      expect(gpu.made.map((target) => target.type)).toEqual([type, type]);
    });

    it('keeps its targets the size of the canvas, in half floats', () => {
      looping();

      expect(gpu.made.map(({ type, width }) => [type, width])).toEqual([
        [4, gpu.canvas?.width],
        [4, gpu.canvas?.width],
      ]);
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
