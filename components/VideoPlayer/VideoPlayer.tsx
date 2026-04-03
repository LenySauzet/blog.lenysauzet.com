'use client';
import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { MediaPlayer } from './MediaPlayer';

interface VideoPlayerProps {
  src: string;
  alt?: string;
  type?: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  title?: string;
  glow?: boolean;
}

const VideoPlayer = ({
  src,
  alt,
  type = 'video/mp4',
  width,
  height,
  autoPlay,
  loop,
  muted,
  title,
  glow = false,
}: VideoPlayerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.1 });
  const isReducedMotion = useReducedMotion();

  // Debounce visibility to avoid mounting/unmounting on small scroll jitter
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, [isInView]);

  const shouldAutoPlay = autoPlay || false;
  const shouldLoop = loop || false;

  const ratio = width && height ? `${width} / ${height}` : undefined;

  return (
    <div
      ref={ref}
      className="relative w-full mx-auto"
      style={{ aspectRatio: ratio }}
    >
      {isVisible ? (
        <MediaPlayer.Root
          aria-label={alt}
          playsInline
          muted={muted}
          autoPlay={shouldAutoPlay && !isReducedMotion}
          loop={shouldLoop || !!isReducedMotion}
        >
          {glow && <MediaPlayer.Glow />}
          <MediaPlayer.Video width={width} height={height}>
            <source src={src} type={type} />
          </MediaPlayer.Video>
          {title && (
            <MediaPlayer.VideoOverlay>{title}</MediaPlayer.VideoOverlay>
          )}
          <MediaPlayer.PlaybackControls />
          <MediaPlayer.Track>
            <MediaPlayer.Range type="played" />
          </MediaPlayer.Track>
          <MediaPlayer.ScreenControls />
        </MediaPlayer.Root>
      ) : null}
    </div>
  );
};

export default VideoPlayer;
