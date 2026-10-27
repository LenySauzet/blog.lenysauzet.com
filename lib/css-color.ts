/**
 * A token's colour, read out of CSS on every frame that draws.
 *
 * There is nothing to subscribe to: a theme class, an inline override and an edit to a
 * rule in the stylesheet all change what CSS resolves, and only the first two are DOM
 * mutations. Reading it each frame is the only way to be right in all three, and it is
 * affordable because the conversion is skipped unless the string has moved.
 *
 * Tokens are authored in oklch and `getComputedStyle` hands them back in oklch, so
 * there is nothing to parse. Painting one pixel is the conversion: a 2D canvas is sRGB,
 * so the byte it stores is the colour the page shows.
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
