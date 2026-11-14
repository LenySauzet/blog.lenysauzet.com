import { fireEvent } from '@testing-library/react';

const page = document.documentElement;

/** jsdom lays nothing out, so the page has to be told how tall it is and where it sits. */
export function scrollPage(fraction: number, height = 1000, view = 500) {
  Object.defineProperty(page, 'scrollHeight', { value: height, configurable: true });
  Object.defineProperty(page, 'clientHeight', { value: view, configurable: true });
  Object.defineProperty(window, 'scrollY', {
    value: Math.round((height - view) * fraction),
    configurable: true,
  });
  fireEvent.scroll(window);
}

export function resetPageScroll() {
  for (const key of ['scrollHeight', 'clientHeight']) Reflect.deleteProperty(page, key);
  Reflect.deleteProperty(window, 'scrollY');
}
