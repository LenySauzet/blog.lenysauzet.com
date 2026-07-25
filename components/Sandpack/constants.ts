// Shared so the dynamic-import skeleton in index.tsx reserves the exact same
// height as the mounted editor — otherwise the two drift and reintroduce CLS.
export const EDITOR_HEIGHT = 560;
export const TOOLBAR_HEIGHT = 48;
// Scroll distance over which an edge fade ramps from clear to full.
export const FADE = 40;
