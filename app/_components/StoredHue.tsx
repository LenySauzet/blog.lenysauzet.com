'use client';

import { useLayoutEffect } from 'react';

import { paintStoredHue } from '@/hooks/use-hue';

// React strips <html> when the root layout remounts after `retry()`, and the inline
// script that paints the accent on load never runs on the client.
export function StoredHue() {
  useLayoutEffect(paintStoredHue, []);
  return null;
}
