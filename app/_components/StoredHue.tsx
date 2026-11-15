'use client';

import { useLayoutEffect } from 'react';

import { paintStoredHue } from '@/hooks/use-hue';

// React strips <html> when this layout remounts after retry(); the inline script won't rerun.
export function StoredHue() {
  useLayoutEffect(paintStoredHue, []);
  return null;
}
