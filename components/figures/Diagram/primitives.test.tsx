import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { rect } from '@/lib/rect';
import { vec2 } from '@/lib/vec2';

import Diagram from './Diagram';
import { Arrow, Box, Circle, Detail, Frame, Magnifier, Polygon, Readout } from './primitives';

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

describe('what reaches the page', () => {
  it('is rounded, so the server and the browser write the same digits', () => {
    const svg = draw(
      <Polygon corners={[vec2(1 / 3, 2 / 3), vec2(10.123456, 0), vec2(0, 7.98765)]} fill={0.123456789} />,
    );
    const polygon = svg.querySelector('polygon');

    expect(polygon?.getAttribute('points')).toBe('0.33,0.67 10.12,0 0,7.99');
    expect(polygon?.getAttribute('fill-opacity')).toBe('0.123');
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

describe('a lens', () => {
  const source = { at: vec2(20, 20), r: 10 };
  const lens = { at: vec2(80, 50), r: 40 };

  it('magnifies by the ratio of its two circles, about the source', () => {
    const svg = draw(
      <Magnifier source={source} lens={lens}>
        <Circle at={source.at} r={2} className="scene" />
      </Magnifier>,
    );

    expect(svg.querySelector('.scene')?.parentElement?.getAttribute('transform')).toBe(
      'translate(80 50) scale(4) translate(-20 -20)',
    );
  });

  it('draws a detail around its own centre, at its own size', () => {
    const svg = draw(
      <Detail source={source} lens={lens}>
        <Circle at={vec2(0, 0)} r={2} className="detail" />
      </Detail>,
    );

    expect(svg.querySelector('.detail')?.parentElement?.getAttribute('transform')).toBe(
      'translate(80 50)',
    );
  });

  it('shows its content only inside the lens', () => {
    const svg = draw(
      <Detail source={source} lens={lens}>
        <Circle at={vec2(0, 0)} r={2} className="detail" />
      </Detail>,
    );
    const clipped = svg.querySelector('.detail')?.closest('[clip-path]');
    const clip = svg.querySelector(`clipPath[id="${clipped?.getAttribute('clip-path')?.slice(5, -1)}"] circle`);

    expect(clip?.getAttribute('r')).toBe('40');
  });
});

describe('a readout', () => {
  it('names its value and writes it at a fixed number of places', () => {
    const svg = draw(<Readout at={vec2(90, 90)} name="t" value={0.7} />);

    expect(svg.querySelector('text')).toHaveTextContent('t = 0.70');
  });

  it('grows leftward from its corner, so it never runs off the figure', () => {
    const svg = draw(<Readout at={vec2(90, 90)} name="t" value={0.7} />);

    expect(svg.querySelector('text')?.getAttribute('text-anchor')).toBe('end');
  });
});

describe('a system diagram', () => {
  const box = rect(vec2(10, 30), 80, 40);

  it('draws a box with square corners, its name at its centre', () => {
    const svg = draw(<Box box={box}>Rasterizer</Box>);

    expect(svg.querySelector('rect')?.hasAttribute('rx')).toBe(false);
    expect(svg.querySelector('rect')).not.toHaveClass('[stroke-dasharray:4_6]');
    expect(svg.querySelector('text')?.getAttribute('x')).toBe('50');
  });

  it('draws a frame dashed, square and tinted, which groups rather than names a stage', () => {
    const svg = draw(<Frame box={box} title="GPU" />);
    const outline = svg.querySelector('rect');

    expect(outline).toHaveClass('[stroke-dasharray:4_6]');
    expect(outline?.hasAttribute('rx')).toBe(false);
    expect(outline?.getAttribute('fill-opacity')).toBe('1');
  });

  it('titles a frame above it, from its left corner or over its middle', () => {
    const start = draw(<Frame box={box} title="GPU" />).querySelector('text');
    const middle = draw(<Frame box={box} title="GPU" align="middle" />).querySelector('text');

    expect(start?.getAttribute('x')).toBe('10');
    expect(start?.getAttribute('text-anchor')).toBe('start');
    expect(middle?.getAttribute('x')).toBe('50');
    expect(middle?.getAttribute('text-anchor')).toBe('middle');
    for (const title of [start, middle]) {
      expect(title?.getAttribute('y')).toBe('30');
      expect(title?.getAttribute('dy')).toBe('-1em');
    }
  });
});
