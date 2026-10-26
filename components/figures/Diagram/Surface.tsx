import type { Grid } from '@/lib/mesh';
import type { Camera } from '@/lib/vec3';

import { Arrow, Label, Line, Point, Polygon } from './primitives';
import { scene, type Axis } from './scene';

export interface SurfaceProps {
  grid: Grid;
  camera: Camera;
  axes?: readonly Axis[];
  occlusion?: number;
}

export function Surface({ grid, camera, axes, occlusion = 0.8 }: SurfaceProps) {
  const { pieces, names } = scene(grid, camera, axes);

  return (
    <>
      {pieces.map((piece) => {
        switch (piece.kind) {
          case 'face':
            return (
              <Polygon
                key={piece.id}
                corners={piece.corners}
                tone="page"
                outline="ink-soft"
                fill={occlusion}
                width={1}
              />
            );
          case 'silhouette':
            return <Line key={piece.id} from={piece.from} to={piece.to} tone="ink" width={2} />;
          case 'vertex':
            return <Point key={piece.id} at={piece.at} r={1.8} />;
          case 'axis':
            return <Line key={piece.id} from={piece.from} to={piece.to} width={1.5} />;
          case 'arrow':
            return <Arrow key={piece.id} from={piece.from} to={piece.to} width={1.5} />;
        }
      })}
      {names.map(({ name, label }) => (
        <Label key={name} {...label}>
          {name}
        </Label>
      ))}
    </>
  );
}
