const LINEAR = [1, 0];
export const EASED = [1, 0.92, 0.74, 0.46, 0.2, 0.06, 0];

const ramp = (hold: number, curve: number[], at: (alpha: number) => string) =>
  curve
    .map((alpha, index) => {
      const through = index / (curve.length - 1);

      return `${at(alpha)} ${(hold + (100 - hold) * through).toFixed(2)}%`;
    })
    .join(', ');

/** `hold`: the percentage held at full before the ramp begins. */
export const blurRamp = (direction: string, hold = 0, curve = LINEAR) =>
  `linear-gradient(${direction}, black 0%, ${ramp(hold, curve, (alpha) => `rgb(0 0 0 / ${alpha})`)})`;
