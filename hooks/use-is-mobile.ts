'use client';

import { useEffect, useState } from 'react';

// Below this, the Sandpack editor + preview can't sit side by side.
const MOBILE_QUERY = '(max-width: 960px)';

export function useIsMobile(query: string = MOBILE_QUERY) {
  // Start false to match SSR; sync after hydration to avoid a mismatch.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return isMobile;
}
