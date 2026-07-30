'use client';

import { useReducedMotion } from 'motion/react';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
} from 'react';

export type BlurPosition = 'top' | 'bottom' | 'left' | 'right';
export type BlurCurve = 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type BlurTarget = 'parent' | 'page';
export type BlurPreset = keyof typeof PRESETS;

export type GradualBlurProps = PropsWithChildren<{
  position?: BlurPosition;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | 'scroll';
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: BlurCurve;
  responsive?: boolean;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  preset?: BlurPreset;
  hoverIntensity?: number;
  target?: BlurTarget;
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}>;

type ResolvedConfig = Omit<GradualBlurProps, 'children'> &
  Required<
    Pick<
      GradualBlurProps,
      | 'position'
      | 'strength'
      | 'height'
      | 'divCount'
      | 'exponential'
      | 'zIndex'
      | 'animated'
      | 'duration'
      | 'easing'
      | 'opacity'
      | 'curve'
      | 'responsive'
      | 'target'
    >
  >;

const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  // The repo's scale tops out at z-100 (Lightbox) with the Dock at z-50. The
  // upstream default of 1000, raised to 1100 for a page target, painted over
  // both. 40 keeps the blur under the Dock and well under the Lightbox.
  zIndex: 40,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
} satisfies Partial<GradualBlurProps>;

export const PRESETS = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
} as const satisfies Record<string, Partial<GradualBlurProps>>;

export const CURVE_FUNCTIONS: Record<BlurCurve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out': (p) => 1 - Math.pow(1 - p, 2),
  'ease-in-out': (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const GRADIENT_DIRECTION: Record<BlurPosition, string> = {
  top: 'to top',
  bottom: 'to bottom',
  left: 'to left',
  right: 'to right',
};

/**
 * Picks the breakpoint override for one dimension. Upstream depended on the
 * whole config object, which is rebuilt every render, so it re-subscribed to
 * `resize` on each one; these deps are the values themselves.
 */
function useResponsiveValue(
  enabled: boolean,
  base: string | undefined,
  mobile: string | undefined,
  tablet: string | undefined,
  desktop: string | undefined
) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const pick = () => {
      const w = window.innerWidth;
      if (w <= 480 && mobile) return mobile;
      if (w <= 768 && tablet) return tablet;
      if (w <= 1024 && desktop) return desktop;
      return base;
    };
    const apply = () => setValue(pick());
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [enabled, base, mobile, tablet, desktop]);

  return enabled ? value : base;
}

function useIsVisible(ref: RefObject<HTMLDivElement | null>, observe: boolean) {
  const [isVisible, setIsVisible] = useState(!observe);

  useEffect(() => {
    const el = ref.current;
    if (!observe || !el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, observe]);

  return isVisible;
}

function GradualBlur({ children, ...props }: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const config: ResolvedConfig = {
    ...DEFAULT_CONFIG,
    ...(props.preset ? PRESETS[props.preset] : undefined),
    ...props,
  };

  const {
    position,
    strength,
    divCount,
    exponential,
    curve,
    opacity,
    animated,
    duration,
    easing,
    zIndex,
    target,
    hoverIntensity,
    responsive,
    onAnimationComplete,
  } = config;

  const height = useResponsiveValue(
    responsive,
    config.height,
    config.mobileHeight,
    config.tabletHeight,
    config.desktopHeight
  );
  const width = useResponsiveValue(
    responsive,
    config.width,
    config.mobileWidth,
    config.tabletWidth,
    config.desktopWidth
  );

  const isVisible = useIsVisible(containerRef, animated === 'scroll');
  const transitionsOn = Boolean(animated) && !prefersReducedMotion;

  const layers = useMemo(() => {
    const step = 100 / divCount;
    const activeStrength =
      isHovered && hoverIntensity ? strength * hoverIntensity : strength;
    const shape = CURVE_FUNCTIONS[curve] ?? CURVE_FUNCTIONS.linear;
    const direction = GRADIENT_DIRECTION[position];
    const built: ReactNode[] = [];

    for (let i = 1; i <= divCount; i++) {
      const progress = shape(i / divCount);
      const blur = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * activeStrength
        : 0.0625 * (progress * divCount + 1) * activeStrength;

      const p1 = Math.round((step * i - step) * 10) / 10;
      const p2 = Math.round(step * i * 10) / 10;
      const p3 = Math.round((step * i + step) * 10) / 10;
      const p4 = Math.round((step * i + step * 2) * 10) / 10;

      let stops = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) stops += `, black ${p3}%`;
      if (p4 <= 100) stops += `, transparent ${p4}%`;

      const mask = `linear-gradient(${direction}, ${stops})`;

      built.push(
        <div
          key={i}
          data-slot="gradual-blur-layer"
          className="absolute inset-0"
          style={{
            maskImage: mask,
            WebkitMaskImage: mask,
            backdropFilter: `blur(${blur.toFixed(3)}rem)`,
            opacity,
            transition:
              transitionsOn && animated !== 'scroll'
                ? `backdrop-filter ${duration} ${easing}`
                : undefined,
          }}
        />
      );
    }

    return built;
  }, [
    divCount,
    strength,
    exponential,
    curve,
    position,
    opacity,
    isHovered,
    hoverIntensity,
    transitionsOn,
    animated,
    duration,
    easing,
  ]);

  const isVertical = position === 'top' || position === 'bottom';
  const containerStyle: CSSProperties = {
    position: target === 'page' ? 'fixed' : 'absolute',
    pointerEvents: hoverIntensity ? 'auto' : 'none',
    opacity: isVisible ? 1 : 0,
    transition: transitionsOn ? `opacity ${duration} ${easing}` : undefined,
    zIndex,
    ...(isVertical
      ? { height, width: width ?? '100%', [position]: 0, left: 0, right: 0 }
      : { width: width ?? height, height: '100%', [position]: 0, top: 0, bottom: 0 }),
    ...config.style,
  };

  useEffect(() => {
    if (!isVisible || animated !== 'scroll' || !onAnimationComplete) return;
    const timer = setTimeout(onAnimationComplete, parseFloat(duration) * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, animated, onAnimationComplete, duration]);

  return (
    <div
      ref={containerRef}
      data-slot="gradual-blur"
      data-target={target}
      aria-hidden="true"
      className={config.className}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className="relative h-full w-full">{layers}</div>
      {children ? <div className="relative">{children}</div> : null}
    </div>
  );
}

export default memo(GradualBlur);
