import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getImageDimensions } from './image-utils';

/** Smallest byte sequence image-size can read a PNG's dimensions from. */
function pngHeader(width: number, height: number): Uint8Array {
  const bytes: number[] = [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // signature
    0x00, 0x00, 0x00, 0x0d, // IHDR length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
  ];
  const push32 = (value: number) =>
    bytes.push(
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    );
  push32(width);
  push32(height);
  bytes.push(8, 6, 0, 0, 0, 0, 0, 0, 0);
  return new Uint8Array(bytes);
}

function respondWith(body: Uint8Array, init: Partial<Response> = {}) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    arrayBuffer: async () => body.buffer.slice(0) as ArrayBuffer,
    ...init,
  } as Response;
}

describe('getImageDimensions', () => {
  // `restoreAllMocks` only undoes `vi.spyOn`, and this file stubs a global —
  // so it would look like isolation while doing nothing.
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the dimensions out of the image header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respondWith(pngHeader(960, 731)))
    );

    await expect(getImageDimensions('https://cdn.test/a.png')).resolves.toEqual(
      { width: 960, height: 731 }
    );
  });

  it('downloads only the header rather than the whole file', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      respondWith(pngHeader(100, 50))
    );
    vi.stubGlobal('fetch', fetchMock);

    await getImageDimensions('https://cdn.test/ranged.png');

    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({
      Range: 'bytes=0-65535',
    });
  });

  it('fails loudly when the CDN rejects the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respondWith(new Uint8Array(), {
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
      )
    );

    await expect(
      getImageDimensions('https://cdn.test/missing.png')
    ).rejects.toThrow(/404 Not Found/);
  });

  it('names the escape hatch when the CDN is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      })
    );

    await expect(
      getImageDimensions('https://cdn.test/offline.png')
    ).rejects.toThrow(/explicit width and height/);
  });

  it('rejects a payload it cannot parse', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respondWith(new Uint8Array([1, 2, 3, 4])))
    );

    await expect(
      getImageDimensions('https://cdn.test/garbage.txt')
    ).rejects.toThrow(/supported image format/);
  });
});
