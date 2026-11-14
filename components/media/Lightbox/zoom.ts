// A tween: layout projection ignores `restDelta`, so a spring exit lingers.
export const ZOOM_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] } as const;

export const ZOOM_SIZES = '(max-width: 639px) calc(100vw - 2rem), (max-width: 768px) calc(100vw - 4rem), 80vw';
