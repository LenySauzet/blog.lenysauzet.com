/**
 * Reflectance curves, as measured points rather than as formulas. A pigment
 * does not reflect a tidy gaussian, and three curves fitted to look right
 * individually sum to a flat line: each one has to be the shape it actually
 * is for their sum to mean anything.
 *
 * Illustrative values for an additive RGB primary, in the shape a reflectance
 * spectrum takes: a band where the channel reflects, a floor where it does
 * not, and a shoulder between them.
 */
export type Point = readonly [wavelength: number, reflectance: number];

export const CHANNELS = {
  red: [
    [400, 0.02], [420, 0.02], [440, 0.02], [460, 0.02], [480, 0.02], [500, 0.03],
    [520, 0.05], [540, 0.1], [560, 0.25], [580, 0.55], [600, 0.8], [620, 0.9],
    [640, 0.95], [660, 0.97], [680, 0.97], [700, 0.97],
  ],
  green: [
    [400, 0.02], [420, 0.03], [440, 0.05], [460, 0.1], [480, 0.25], [500, 0.55],
    [520, 0.87], [540, 0.95], [560, 0.87], [580, 0.55], [600, 0.25], [620, 0.1],
    [640, 0.05], [660, 0.03], [680, 0.02], [700, 0.02],
  ],
  blue: [
    [400, 0.97], [420, 0.97], [440, 0.97], [460, 0.95], [480, 0.85], [500, 0.5],
    [520, 0.2], [540, 0.08], [560, 0.03], [580, 0.02], [600, 0.02], [620, 0.02],
    [640, 0.02], [660, 0.02], [680, 0.02], [700, 0.02],
  ],
} as const satisfies Record<string, readonly Point[]>;

export type Channel = keyof typeof CHANNELS;

/**
 * Catmull-Rom, because it passes through every point it is given: a spline
 * that merely approaches them would quietly move a measurement, which is the
 * one thing a chart of measurements must not do.
 */
const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
};

export const reflectanceAt = (points: readonly Point[], wavelength: number): number => {
  if (wavelength <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (wavelength >= last[0]) return last[1];

  const segment = points.findIndex(
    ([at], index) => index < points.length - 1 && wavelength >= at && wavelength <= points[index + 1][0]
  );

  const before = points[Math.max(0, segment - 1)];
  const from = points[segment];
  const to = points[Math.min(points.length - 1, segment + 1)];
  const after = points[Math.min(points.length - 1, segment + 2)];

  const t = (wavelength - from[0]) / (to[0] - from[0]);
  // The spline can overshoot between two close points, and a reflectance
  // above one or below zero is not a reading.
  return Math.max(0, Math.min(1, catmullRom(before[1], from[1], to[1], after[1], t)));
};

/** Sampled as percentages, which is what the axis is labelled in. */
export const spectrum = (step = 5) => {
  const rows = [];
  for (let nm = 400; nm <= 700; nm += step) {
    rows.push({
      nm,
      red: +(reflectanceAt(CHANNELS.red, nm) * 100).toFixed(2),
      green: +(reflectanceAt(CHANNELS.green, nm) * 100).toFixed(2),
      blue: +(reflectanceAt(CHANNELS.blue, nm) * 100).toFixed(2),
    });
  }
  return rows;
};
