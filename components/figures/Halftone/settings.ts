export const TEXTURES = { uImage: 'blog/Meisje_met_de_parel.jpg' };
export const ASPECT = 1;
export const RADIUS = { min: 0, max: 0.5, initial: 0.4 };
export const CELLS = { min: 8, max: 64, initial: 32 };

export interface Settings {
  radius: number;
  cells: number;
  dots: boolean;
  pixelate: boolean;
  luma: boolean;
}

export const INITIAL: Settings = {
  radius: RADIUS.initial,
  cells: CELLS.initial,
  dots: true,
  pixelate: true,
  luma: false,
};

const flag = (on: boolean) => (on ? 1 : 0);

export const uniforms = ({ radius, cells, dots, pixelate, luma }: Settings) => ({
  uRadius: radius,
  uCells: cells,
  uDots: flag(dots),
  uPixelate: flag(pixelate),
  uLuma: flag(luma),
});
