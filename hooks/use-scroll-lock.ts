'use client';

import { useEffect } from 'react';

// Radix's own variable, so chrome that compensates for its lock follows ours too.
const GAP = '--removed-body-scroll-bar-size';

let holders = 0;
let restore = () => {};

function lock() {
  if (holders++ > 0) return;
  const { body, documentElement } = document;
  const gap = window.innerWidth - documentElement.clientWidth;
  const before = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };

  body.style.overflow = 'hidden';
  // A classic scrollbar leaves with the overflow: pad its width back, or the page shifts.
  // None to give back under Radix's own lock, whose measure must not be overwritten with 0.
  if (gap > 0) {
    body.style.paddingRight = `${gap}px`;
    body.style.setProperty(GAP, `${gap}px`);
  }

  restore = () => {
    Object.assign(body.style, before);
    body.style.removeProperty(GAP);
  };
}

function unlock() {
  if (--holders === 0) restore();
}

/** Holds the page still while `locked`; locks may overlap, the last one out releases. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lock();
    return unlock;
  }, [locked]);
}
