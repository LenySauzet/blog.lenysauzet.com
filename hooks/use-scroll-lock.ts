'use client';

import { useEffect } from 'react';

/** Holds the page still while `locked`; released on unmount too. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [locked]);
}
