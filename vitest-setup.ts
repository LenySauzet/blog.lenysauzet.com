import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

// Report reduced motion so Motion skips transform/layout animations, which
// never settle under jsdom's zero-sized boxes. Assigned unconditionally: jsdom
// ships a matchMedia that always reports `matches: false`, so a guard would
// silently do nothing.
window.matchMedia = (query: string) =>
  ({
    matches: /prefers-reduced-motion/.test(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

// Motion's press gesture constructs PointerEvents, which jsdom lacks.
if (!window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }

  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
  } as unknown as typeof IntersectionObserver;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  vi.restoreAllMocks();
});
