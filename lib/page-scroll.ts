/** How far the page can scroll, in pixels. */
export const travel = () =>
  document.documentElement.scrollHeight - document.documentElement.clientHeight;

export const headings = () => [
  ...document.querySelectorAll<HTMLElement>('[data-prose] > h2, [data-prose] > h3'),
];
