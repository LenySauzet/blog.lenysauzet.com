import 'server-only';

import { imageSize } from 'image-size';
import { cache } from 'react';

// Enough header bytes for PNG/JPEG/WebP/AVIF metadata.
const PROBE_BYTE_LENGTH = 65_535;

interface ImageDimensions {
  width: number;
  height: number;
}

// Reads an image's intrinsic dimensions from its header bytes via a ranged
// request, at build time only. Throws rather than guessing: a wrong dimension
// ships as layout shift on every visit, which is worse than a failed build.
export const getImageDimensions = cache(
  async (url: string): Promise<ImageDimensions> => {
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { Range: `bytes=0-${PROBE_BYTE_LENGTH}` },
      });
    } catch (error) {
      throw new Error(
        `Could not reach "${url}" to read its dimensions. Pass explicit width and height to skip this lookup.`,
        { cause: error }
      );
    }

    if (!response.ok) {
      throw new Error(
        `Could not read dimensions for "${url}": the CDN answered ${response.status} ${response.statusText}.`
      );
    }

    const buffer = new Uint8Array(await response.arrayBuffer());

    let dimensions: ReturnType<typeof imageSize>;
    try {
      dimensions = imageSize(buffer);
    } catch (error) {
      throw new Error(
        `Could not parse the image header of "${url}". Is it a supported image format?`,
        { cause: error }
      );
    }

    const { width, height } = dimensions;
    if (!width || !height) {
      throw new Error(`The image header of "${url}" declares no dimensions.`);
    }

    return { width, height };
  }
);
