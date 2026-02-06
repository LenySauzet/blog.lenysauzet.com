'use client';
import { motion, useReducedMotion } from 'motion/react';
import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import useInterval from '@/hook/useInterval';

export const alphanumericChars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_-+=[]{}|\\:;,.<>?'.split(
    ''
  );

const scrambleText = (text: string) => {
  const chars = text.split('');
  const scrambledChars = chars.map((char) => {
    if (/^\s$/.test(char)) {
      return char;
    }
    const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    return alphanumericChars[randomIndex];
  });
  return scrambledChars.join('');
};

const getParts = (text: string, windowSize: number, windowStart: number) => {
  const done = text.slice(0, windowStart);
  const scrambled = scrambleText(
    text.slice(windowStart, windowStart + windowSize)
  );
  const todo = text.slice(windowStart + windowSize);
  return [done, scrambled, todo];
};

const ScrambledTextAnimation = ({
  children,
  className,
  windowSize = 10,
  speed = 1,
  delay = 0,
  ...rest
}: {
  children: string;
  className?: string;
  windowSize?: number;
  speed?: number;
  delay?: number;
}) => {
  const [dimensions, setDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const [[done, scrambled], setScrambledText] = useState(
    getParts(children, windowSize, 0)
  );
  const [windowStart, increment] = useReducer((state) => state + 1, 1);
  const finished = windowStart > children.length;
  const [hasDelayPassed, setHasDelayPassed] = useState(false);

  useInterval(
    () => {
      increment();
      setScrambledText(getParts(children, windowSize, windowStart));
    },
    !hasDelayPassed ? null : finished ? null : 30 / speed
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasDelayPassed(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  useLayoutEffect(() => {
    if (measureRef.current) {
      const rect = measureRef.current.getBoundingClientRect();
      setDimensions({
        height: Math.max(rect.height, 1),
        width: Math.max(rect.width, 1),
      });
    }
  }, [children]);

  if (!dimensions) {
    return (
      <div
        ref={measureRef}
        className={className}
        style={{ visibility: 'hidden' }}
        aria-hidden
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut', delay: delay * 0.95 }}
      style={{
        display: 'inline-block',
        height: finished ? 'auto' : dimensions?.height,
      }}
    >
      <div
        aria-hidden
        suppressHydrationWarning
        className={className}
        style={{ display: 'inline' }}
        {...rest}
      >
        {finished ? children : done}
        <span
          aria-hidden
          suppressHydrationWarning
          className="text-foreground"
          style={{ display: 'inline' }}
        >
          {finished ? '' : scrambled}
        </span>
      </div>
    </motion.div>
  );
};

export const ScrambledText = ({
  children,
  className,
  disabled = false,
  windowSize = 10,
  speed = 1,
  delay = 0,
  ...props
}: {
  children: string;
  className?: string;
  disabled?: boolean;
  windowSize?: number;
  speed?: number;
  delay?: number;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <div suppressHydrationWarning className="sr-only">
        {children}
      </div>
      {disabled ? (
        <div
          {...props}
          className={className}
          suppressHydrationWarning
          style={{ opacity: 0 }}
        >
          {children}
        </div>
      ) : (
        <>
          {shouldReduceMotion ? (
            <div className={className} suppressHydrationWarning {...props}>
              {children}
            </div>
          ) : (
            <ScrambledTextAnimation
              className={className}
              windowSize={windowSize}
              speed={speed}
              delay={delay}
              {...props}
            >
              {children}
            </ScrambledTextAnimation>
          )}
        </>
      )}
    </>
  );
};
