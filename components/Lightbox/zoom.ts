/**
 * A tween, not a spring: layout projection ignores `restDelta`, so a spring exit
 * lingers past its last visible frame.
 */
export const ZOOM_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] } as const;

/**
 * The sizes an image that opens in the lightbox loads at, the lightbox's own, so it
 * opens on the image already loaded rather than a second request.
 */
export const ZOOM_SIZES = '(max-width: 640px) calc(100vw - 2rem), (max-width: 768px) calc(100vw - 4rem), 80vw';
