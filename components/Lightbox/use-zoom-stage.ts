'use client';

import { useEffect, useState } from 'react';

import { ZOOM_TRANSITION } from './zoom';

export type ZoomStage = 'closed' | 'opening' | 'open' | 'closing';

const settled = (stage: ZoomStage): ZoomStage =>
  stage === 'opening' ? 'open' : stage === 'closing' ? 'closed' : stage;

export function useZoomStage() {
  const [stage, setStage] = useState<ZoomStage>('closed');

  // Motion drops the completion around a resize, which would leave the image hidden.
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
