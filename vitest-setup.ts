import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

/**
 * jsdom gives every element a zero-sized box, so Motion's layout projection
 * never settles and an exiting subtree would stay mounted forever. Reporting
 * reduced motion makes Motion skip transform and layout animations, which keeps
 * behavioural assertions deterministic.
 *
 * Animation fidelity is not a jsdom concern: it is verified in a real browser.
 */
// Assigned unconditionally: jsdom ships its own matchMedia that always reports
// `matches: false`, so a truthiness guard here would silently do nothing.
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

// Motion's press gesture constructs PointerEvents, which jsdom does not ship.
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

afterEach(() => {
  vi.restoreAllMocks();
});
