import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';

import Diagram from './Diagram';
import { Arrow, Circle, Polygon } from './primitives';

const TRIANGLE = [vec2(0, 0), vec2(10, 0), vec2(0, 10)];

const draw = (children: React.ReactNode) =>
  render(
    <Diagram height={100} title="Test" className="custom-plane">
      {children}
    </Diagram>,
  ).container;

describe('hatched fills', () => {
  it('paint with a pattern of their own', () => {
    const svg = draw(<Polygon corners={TRIANGLE} fill="hatched" />);
    const pattern = svg.querySelector('pattern');

    expect(svg.querySelector('polygon')?.getAttribute('fill')).toBe(`url(#${pattern?.id})`);
  });

  it('never share a pattern between two shapes', () => {
    const svg = draw(
      <>
        <Polygon corners={TRIANGLE} fill="hatched" />
        <Circle at={vec2(50, 50)} r={10} fill="hatched" />
      </>,
    );
    const ids = [...svg.querySelectorAll('pattern')].map(({ id }) => id);

    expect(new Set(ids).size).toBe(2);
  });
});

describe('a share of the tone', () => {
  it('fills at that opacity', () => {
    const svg = draw(<Polygon corners={TRIANGLE} fill={0.4} />);

    expect(svg.querySelector('polygon')?.getAttribute('fill-opacity')).toBe('0.4');
  });
});

describe('className', () => {
  it('reaches the plane and the shapes drawn on it', () => {
    const svg = draw(
      <>
        <Arrow from={vec2(0, 0)} to={vec2(50, 0)} className="custom-arrow" />
        <Circle at={vec2(50, 50)} r={10} className="custom-circle" />
      </>,
    );

    expect(svg.querySelector('svg')).toHaveClass('custom-plane');
    expect(svg.querySelector('.custom-arrow')).not.toBeNull();
    expect(svg.querySelector('circle')).toHaveClass('custom-circle');
  });
});
