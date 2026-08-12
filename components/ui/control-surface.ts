/**
 * The state machine every toggle control shares: checkbox, radio and switch.
 * Only shape and the mark itself differ, so those stay in each primitive and
 * everything else lives here rather than drifting three ways.
 *
 * Written out in full because Tailwind scans source for complete class strings;
 * a name assembled by interpolation is never seen and never generated.
 */
export const controlSurface =
  "peer relative shrink-0 cursor-pointer border border-border bg-background outline-none [transition:background_.3s,border-color_.3s,box-shadow_.2s] motion-reduce:transition-none enabled:hover:border-primary enabled:hover:shadow-[var(--shadow-control)] focus-visible:border-primary focus-visible:shadow-[var(--shadow-control)] data-checked:border-primary data-checked:bg-primary disabled:cursor-not-allowed disabled:border-input-disabled disabled:bg-input-disabled aria-invalid:border-destructive"

/**
 * Widens the pointer target past the 24px box without moving it, so a control
 * stays comfortable to hit on touch.
 */
export const controlHitArea = "after:absolute after:-inset-x-3 after:-inset-y-2"
