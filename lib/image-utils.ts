import 'server-only';

import { imageSize } from 'image-size';
import { cache } from 'react';

// Enough header bytes for PNG/JPEG/WebP/AVIF metadata.
const PROBE_BYTE_LENGTH = 65_535;

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * What a figure falls back to when the asset cannot be measured. A wrong ratio is
 * layout shift, but an asset that no longer answers has no right ratio to keep: the
 * choice is between reserving something and reserving nothing.
 */
const UNKNOWN_RATIO: ImageDimensions = { width: 1600, height: 900 };

// Throws rather than guessing. `measureImage` is what callers use when a missing
// asset should not take the build down with it.
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

/**
 * The same lookup, but a CDN that has stopped answering is reported rather than
 * fatal. An asset can disappear years after a post shipped, and taking every later
 * deploy down with it punishes work that has nothing to do with the breakage.
 *
 * Loud on purpose: the warning names the file, so a broken image is something the
 * build tells you about rather than something a reader finds.
 */
export const measureImage = cache(
  async (url: string): Promise<ImageDimensions & { measured: boolean }> => {
    try {
      return { ...(await getImageDimensions(url)), measured: true }
    } catch (error) {
      console.warn(
        `[image] ${url} could not be measured, falling back to ${UNKNOWN_RATIO.width}x${UNKNOWN_RATIO.height}.`,
        error instanceof Error ? error.message : error
      )
      return { ...UNKNOWN_RATIO, measured: false }
    }
  }
)
