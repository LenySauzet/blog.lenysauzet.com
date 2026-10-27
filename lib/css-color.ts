/**
 * A token's colour, read every frame: CSS has no change event, and an edit to a rule
 * changes what a token resolves to without any DOM mutation to observe. The read
 * converts only when the string has moved, by painting one sRGB pixel.
 */
export function cssColor(token: `--${string}`) {
  const probe = document.createElement('span');
  probe.style.cssText = `position:fixed;width:0;height:0;opacity:0;color:var(${token})`;
  document.body.appendChild(probe);

  const surface = document.createElement('canvas');
  surface.width = surface.height = 1;
  const ctx = surface.getContext('2d', { willReadFrequently: true });

  let last = '';
  let value: [number, number, number] = [0, 0, 0];

  return {
    read(): [number, number, number] {
      const css = getComputedStyle(probe).color;
      if (css !== last && ctx) {
        last = css;
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        value = [r / 255, g / 255, b / 255];
      }
      return value;
    },
    dispose: () => probe.remove(),
  };
}
