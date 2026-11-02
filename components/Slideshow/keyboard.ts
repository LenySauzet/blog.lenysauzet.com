export type SlideshowKey = 'previous' | 'next' | 'first' | 'last' | 'toggle' | 'open';

interface KeyPress {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

/**
 * What a key asks of a slideshow. The arrows reach one from anywhere on the page;
 * Home, End, Space and Enter only one that holds focus itself, since elsewhere they
 * scroll the page or belong to what has focus.
 */
export function keyFor(press: KeyPress, focused: boolean): SlideshowKey | null {
  if (press.altKey || press.ctrlKey || press.metaKey || press.shiftKey) return null;
  if (press.key === 'ArrowLeft') return 'previous';
  if (press.key === 'ArrowRight') return 'next';
  if (!focused) return null;
  if (press.key === 'Home') return 'first';
  if (press.key === 'End') return 'last';
  if (press.key === ' ') return 'toggle';
  if (press.key === 'Enter') return 'open';
  return null;
}

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** The box on screen whose middle is nearest the viewport's, or -1 when none shows. */
export function nearestToCentre(boxes: Box[], width: number, height: number) {
  let nearest = -1;
  let distance = Infinity;
  boxes.forEach((box, index) => {
    const onScreen = box.bottom > 0 && box.top < height && box.right > 0 && box.left < width;
    const offset = Math.abs((box.top + box.bottom) / 2 - height / 2);
    if (onScreen && offset < distance) {
      nearest = index;
      distance = offset;
    }
  });
  return nearest;
}

/** Whether the key moved anything, which is what decides `preventDefault`. */
export type SlideshowHandler = (key: SlideshowKey) => boolean;

// Anything that answers the arrows itself keeps them.
const OWNS_KEYS = [
  'input',
  'textarea',
  'select',
  'button',
  'a[href]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="textbox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="tablist"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[role="combobox"]',
  '[role="grid"]',
  '[role="dialog"]',
].join(',');

interface Entry {
  handle: SlideshowHandler;
  /** Whether it has anywhere to go, which alone earns it the page's bare arrows. */
  roams: boolean;
}

const entries = new Map<HTMLElement, Entry>();

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing) return;
  const focus = document.activeElement;
  const focusedRoot = focus?.closest<HTMLElement>('[data-slideshow]') ?? null;

  let handle: SlideshowHandler | undefined;
  let key: SlideshowKey | null;
  if (focusedRoot) {
    handle = entries.get(focusedRoot)?.handle;
    key = keyFor(event, focus === focusedRoot);
  } else {
    if (event.target instanceof Element && event.target.closest(OWNS_KEYS)) return;
    key = keyFor(event, false);
    if (!key) return;
    const roots = [...entries].filter(([, entry]) => entry.roams).map(([root]) => root);
    handle = entries.get(roots[nearestToCentre(roots.map((root) => root.getBoundingClientRect()), innerWidth, innerHeight)])?.handle;
  }

  if (!key || !handle) return;
  // A held Space would flip playback thirty times a second; it still must not scroll.
  if (key === 'toggle' && event.repeat) event.preventDefault();
  else if (handle(key)) event.preventDefault();
}

/** One listener for the page, however many slideshows it holds. */
export function registerSlideshow(root: HTMLElement, handle: SlideshowHandler, roams: boolean) {
  if (entries.size === 0) document.addEventListener('keydown', onKeyDown);
  entries.set(root, { handle, roams });
  return () => {
    entries.delete(root);
    if (entries.size === 0) document.removeEventListener('keydown', onKeyDown);
  };
}
