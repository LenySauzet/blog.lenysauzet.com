import { cross, dot3, normalize3, sub3, vec3, type Vec3 } from '@/lib/vec3';

export type Grid = Vec3[][];
export type Edge = readonly [Vec3, Vec3];

export interface Face {
  corners: readonly [Vec3, Vec3, Vec3, Vec3];
  normal: Vec3;
}

export function heightfield(
  height: (x: number, z: number) => number,
  half: number,
  [columns, rows]: readonly [number, number],
): Grid {
  const across = (index: number, count: number) =>
    -half + (2 * half * index) / (count - 1);

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const [x, z] = [across(column, columns), across(row, rows)];
      return vec3(x, height(x, z), z);
    }),
  );
}

export function faces(grid: Grid): Face[][] {
  return grid.slice(0, -1).map((row, i) =>
    row.slice(0, -1).map((a, j) => {
      const b = grid[i][j + 1];
      const c = grid[i + 1][j + 1];
      const d = grid[i + 1][j];

      return {
        corners: [a, b, c, d],
        normal: normalize3(cross(sub3(d, a), sub3(b, a))),
      };
    }),
  );
}

export const lambert = ({ normal }: Face, light: Vec3) =>
  Math.max(0, dot3(normal, light));

export function silhouette(grid: Grid, toward: Vec3): Edge[] {
  const facing = faces(grid).map((row) =>
    row.map(({ normal }) => dot3(normal, toward) > 0),
  );
  const [lastRow, lastColumn] = [grid.length - 1, grid[0].length - 1];
  const edges: Edge[] = [];

  for (let i = 0; i < lastRow; i++) {
    for (let j = 0; j < lastColumn; j++) {
      const right = grid[i][j + 1];
      const below = grid[i + 1][j];
      const corner = grid[i + 1][j + 1];

      if (i === 0) edges.push([grid[0][j], right]);
      if (j === 0) edges.push([grid[i][0], below]);
      if (j === lastColumn - 1 || facing[i][j] !== facing[i][j + 1]) edges.push([right, corner]);
      if (i === lastRow - 1 || facing[i][j] !== facing[i + 1][j]) edges.push([below, corner]);
    }
  }

  return edges;
}
