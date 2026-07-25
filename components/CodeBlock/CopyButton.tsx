'use client';

import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

const DURATION = 0.275;

// The two clipboard paths fade+blur out while the checkmark draws itself in via
// pathLength — ported from Maxime Heckel's CopyToClipboardButton.
const boxVariants = {
  checked: { opacity: 0, filter: 'blur(2px)' },
  unchecked: { opacity: 1, filter: 'blur(0px)' },
};
const tickVariants = {
  checked: { pathLength: 1, filter: 'blur(0px)', scale: 1.05 },
  unchecked: { pathLength: 0, filter: 'blur(2px)', scale: 0.97 },
};

export function CopyButton({
  getText,
  className,
}: {
  getText: () => string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  const pathLength = useMotionValue(0);
  const opacity = useTransform(pathLength, [0.05, 0.15], [0, 1]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    const text = getText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be unavailable (insecure context, denied permission);
      // still confirm the gesture so the feedback never silently stalls.
    }
    setCopied(true);
  };

  const transition = { duration: reduce ? 0 : DURATION };

  return (
    <motion.button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      initial="idle"
      whileHover={reduce ? undefined : 'hover'}
      whileTap={reduce ? undefined : 'pressed'}
      variants={{ idle: { scale: 1 }, hover: { scale: 1.05 }, pressed: { scale: 0.95 } }}
      transition={transition}
      className={cn(
        'grid size-[30px] place-items-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:bg-foreground/[0.08] focus-visible:text-foreground focus-visible:outline-none',
        className
      )}
    >
      <svg width="16" height="16" viewBox="0 0 25 25" fill="none">
        <motion.path
          d="M20.8511 9.46338H11.8511C10.7465 9.46338 9.85107 10.3588 9.85107 11.4634V20.4634C9.85107 21.5679 10.7465 22.4634 11.8511 22.4634H20.8511C21.9556 22.4634 22.8511 21.5679 22.8511 20.4634V11.4634C22.8511 10.3588 21.9556 9.46338 20.8511 9.46338Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={copied ? 'checked' : 'unchecked'}
          variants={boxVariants}
          transition={transition}
        />
        <motion.path
          d="M5.85107 15.4634H4.85107C4.32064 15.4634 3.81193 15.2527 3.43686 14.8776C3.06179 14.5025 2.85107 13.9938 2.85107 13.4634V4.46338C2.85107 3.93295 3.06179 3.42424 3.43686 3.04917C3.81193 2.67409 4.32064 2.46338 4.85107 2.46338H13.8511C14.3815 2.46338 14.8902 2.67409 15.2653 3.04917C15.6404 3.42424 15.8511 3.93295 15.8511 4.46338V5.46338"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={copied ? 'checked' : 'unchecked'}
          variants={boxVariants}
          transition={transition}
        />
        <motion.path
          d="M20 6L9 17L4 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={copied ? 'checked' : 'unchecked'}
          variants={tickVariants}
          style={{ pathLength, opacity }}
          transition={transition}
        />
      </svg>
    </motion.button>
  );
}
