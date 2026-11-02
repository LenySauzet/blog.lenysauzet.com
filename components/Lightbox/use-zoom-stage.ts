'use client';

import { useEffect, useState } from 'react';

import { ZOOM_TRANSITION } from './zoom';

export type ZoomStage = 'closed' | 'opening' | 'open' | 'closing';

const settled = (stage: ZoomStage): ZoomStage =>
  stage === 'opening' ? 'open' : stage === 'closing' ? 'closed' : stage;

/**
 * Where an image travelling into the lightbox and back stands. One image travels, so
 * each end hides by the stage rather than crossfading: `settle` is the morph's own
 * completion, and `lifted` is true from the click until it is home again.
 */
export function useZoomStage() {
  const [stage, setStage] = useState<ZoomStage>('closed');

  // Motion drops a morph's completion when a resize lands during one, or a close comes
  // within 250ms of a resize, which would leave the image hidden: each stage also ends
  // on its own.
  useEffect(() => {
    if (stage !== 'opening' && stage !== 'closing') return;
    const timeout = setTimeout(() => setStage(settled), ZOOM_TRANSITION.duration * 1000 + 100);
    return () => clearTimeout(timeout);
  }, [stage]);

  return {
    stage,
    open: () => setStage('opening'),
    close: () => setStage('closing'),
    settle: () => setStage(settled),
    lifted: stage !== 'closed',
  };
}
