'use client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowShrinkIcon,
  FullScreenIcon,
  PauseIcon,
  PictureInPictureExitIcon,
  PictureInPictureOnIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Children,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { formatTime, isIOS, isMobileDevice } from './utils';

type MediaContextType = {
  isPlaying: boolean;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  videoProps: React.VideoHTMLAttributes<HTMLVideoElement>;
  isPiP: boolean;
  isFullscreen: boolean;
  togglePiP: () => void;
  toggleFullscreen: () => void;
  toggleVolume: () => void;
  setVolumeValue: (volume: number) => void;
  volume: number;
};

const MediaContext = createContext<MediaContextType | undefined>(undefined);

const useMedia = () => {
  const ctx = useContext(MediaContext);
  if (!ctx)
    throw new Error('Media components must be wrapped in MediaPlayer.Root');
  return ctx;
};

const isElementOfType = (
  child: React.ReactNode,
  component: { displayName?: string },
): boolean => {
  if (!child || typeof child !== 'object') return false;
  const el = child as React.ReactElement;
  return el.type
    ? (el.type as { displayName?: string }).displayName ===
        component.displayName
    : false;
};

const iconMotion = {
  initial: { opacity: 0, scale: 0.6, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(4px)' },
};
const iconTransition = {
  duration: 0.1,
  ease: [0.2, 0, 0, 1] as [number, number, number, number],
};

const AnimatedIcon = ({
  icon,
  iconKey,
}: {
  icon: IconSvgElement;
  iconKey: string;
}) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={iconKey}
      {...iconMotion}
      transition={iconTransition}
      className="flex items-center justify-center"
    >
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.75} />
    </motion.span>
  </AnimatePresence>
);

interface CtrlButtonProps {
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  'aria-label': string;
  tooltip: string;
  children: React.ReactNode;
}

const CtrlButton = ({
  onClick,
  onKeyDown,
  tooltip,
  children,
  ...props
}: CtrlButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <motion.button
        type="button"
        onClick={onClick}
        onKeyDown={onKeyDown}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 shrink-0"
        {...props}
      >
        {children}
      </motion.button>
    </TooltipTrigger>
    <TooltipContent side="bottom" sideOffset={8}>
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

interface MediaPlayerRootProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  children: React.ReactNode;
}

const MediaPlayerRoot = ({
  children,
  loop,
  autoPlay,
  muted,
  ...rest
}: MediaPlayerRootProps) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay ?? false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [isFocusWithin, setIsFocusWithin] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => setDuration(video.duration);
    if (video.readyState >= 1) onLoaded();
    video.addEventListener('loadedmetadata', onLoaded);
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPlaying) return;

    const tick = (ts: number) => {
      if (video.duration) {
        if (progressBarRef.current)
          progressBarRef.current.style.transform = `scaleX(${video.currentTime / video.duration})`;
        if (ts - lastTickRef.current > 250) {
          setCurrentTime(video.currentTime);
          lastTickRef.current = ts;
        }
        if (!loop && video.currentTime >= video.duration) {
          setIsPlaying(false);
          video.pause();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, loop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnter = () => setIsPiP(true);
    const onLeave = () => setIsPiP(false);
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const childArray = Children.toArray(children);
  const pick = (c: { displayName?: string }) =>
    childArray.filter((ch) => isElementOfType(ch, c));
  const skip = (...cs: { displayName?: string }[]) =>
    childArray.filter((ch) => !cs.some((c) => isElementOfType(ch, c)));

  const videoChildren = pick(MediaPlayerVideo);
  const glowChildren = pick(MediaPlayerGlow);
  const overlayChildren = pick(MediaPlayerVideoOverlay);
  const ctrlChildren = skip(
    MediaPlayerVideo,
    MediaPlayerGlow,
    MediaPlayerVideoOverlay,
  );

  if (!videoChildren.length)
    throw new Error('MediaPlayer.Root requires a MediaPlayer.Video child');

  const pause = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };
  const resume = () => {
    videoRef.current?.play();
    setIsPlaying(true);
  };
  const togglePlay = () => {
    isPlaying ? pause() : resume();
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (!video?.duration) return;
    video.currentTime = time;
    setCurrentTime(time);
    if (progressBarRef.current)
      progressBarRef.current.style.transform = `scaleX(${time / video.duration})`;
  };

  const toggleVolume = () => {
    const video = videoRef.current;
    if (!video) return;
    if (volume === 0) {
      video.muted = false;
      video.volume = prevVolume;
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      video.muted = true;
      video.volume = 0;
      setVolume(0);
    }
  };

  const setVolumeValue = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    const video = videoRef.current;
    if (!video) return;
    video.muted = clamped === 0;
    video.volume = clamped;
    setVolume(clamped);
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : document.pictureInPictureEnabled &&
          (await video.requestPictureInPicture());
    } catch {
      /* unavailable */
    }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      document.fullscreenElement
        ? await document.exitFullscreen()
        : await el.requestFullscreen();
    } catch {
      /* unavailable */
    }
  };

  const controlsHidden = isPlaying && !isFocusWithin && !isMobileDevice();

  return (
    <MediaContext.Provider
      value={{
        isPlaying,
        togglePlay,
        pause,
        resume,
        videoRef,
        containerRef,
        progressBarRef,
        currentTime,
        duration,
        seek,
        videoProps: { loop, autoPlay, muted, ...rest },
        isPiP,
        isFullscreen,
        togglePiP,
        toggleFullscreen,
        toggleVolume,
        setVolumeValue,
        volume,
      }}
    >
      <motion.div
        ref={containerRef}
        initial={controlsHidden ? 'hidden' : 'visible'}
        animate={controlsHidden ? 'hidden' : 'visible'}
        whileHover="visible"
        onFocus={(e) => {
          requestAnimationFrame(() => {
            if ((e.target as HTMLElement).matches(':focus-visible'))
              setIsFocusWithin(true);
          });
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node))
            setIsFocusWithin(false);
        }}
        style={{ position: 'relative', width: '100%', isolation: 'isolate' }}
      >
        {!isPiP && glowChildren}

        <div className="relative overflow-hidden rounded-xl z-[1]">
          {videoChildren}
        </div>

        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          <motion.div
            className="w-full pointer-events-auto"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.2 }}
          >
            {overlayChildren}
          </motion.div>

          <motion.div
            className="absolute bottom-0 left-0 right-0 p-2 pointer-events-auto"
            variants={{ hidden: { y: 52 }, visible: { y: 0 } }}
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              bounce: 0.17,
              type: 'spring',
            }}
          >
            <div className="relative flex items-center w-full rounded-xl px-1 py-1">
              <div
                className="absolute inset-0 rounded-xl border border-white/15"
                style={{
                  background: 'oklch(0 0 0 / 0.35)',
                  backdropFilter: 'blur(16px) saturate(1.2)',
                }}
              />
              <div className="relative z-10 flex items-center w-full">
                {ctrlChildren}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </MediaContext.Provider>
  );
};

MediaPlayerRoot.displayName = 'MediaPlayerRoot';

interface MediaPlayerVideoProps {
  width?: number;
  height?: number;
  aspectRatio?: string | number;
  children: React.ReactNode;
  fit?: 'cover' | 'contain';
}

const MediaPlayerVideo = ({
  aspectRatio,
  children,
  width,
  height,
  fit = 'cover',
}: MediaPlayerVideoProps) => {
  const { videoRef, videoProps, togglePlay } = useMedia();
  const reducedMotion = useReducedMotion();

  const ratio = aspectRatio
    ? `${aspectRatio}`
    : width && height
      ? `${width} / ${height}`
      : undefined;

  return (
    <div className="w-full h-full" style={{ aspectRatio: ratio }}>
      <video
        {...videoProps}
        autoPlay={videoProps.autoPlay && !reducedMotion}
        ref={videoRef}
        onClick={togglePlay}
        onKeyDown={(e) => {
          if (e.key === 'Enter') togglePlay();
        }}
        className="relative z-[1] w-full h-full block cursor-pointer"
        style={{ objectFit: fit }}
      >
        {children}
      </video>
    </div>
  );
};

MediaPlayerVideo.displayName = 'MediaPlayerVideo';

const MediaPlayerVideoOverlay = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div
    className="relative w-full h-full px-5 pt-5 overflow-hidden rounded-t-xl"
    style={{
      backdropFilter: 'blur(0.5px)',
      background: 'linear-gradient(to bottom, oklch(0 0 0 / 0.3), transparent)',
    }}
  >
    <p className="font-display text-sm font-medium text-white/90">{children}</p>
  </div>
);

MediaPlayerVideoOverlay.displayName = 'MediaPlayerVideoOverlay';

interface MediaPlayerGlowProps {
  blur?: number;
  scaleX?: number;
  scaleY?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  fps?: number;
}

const MediaPlayerGlow = ({
  blur = 90,
  scaleX = 1.15,
  scaleY = 1.25,
  canvasWidth = 256,
  canvasHeight = 144,
  fps = 15,
}: MediaPlayerGlowProps) => {
  const { videoRef } = useMedia();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const interval = 1000 / fps;
    let lastDraw = 0;
    let raf = 0;

    const draw = (ts: number) => {
      if (ts - lastDraw >= interval) {
        ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        lastDraw = ts;
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, canvasWidth, canvasHeight, fps]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '90%',
        transform: `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`,
        filter: `blur(${blur}px) saturate(1.25)`,
        zIndex: 0,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
};

MediaPlayerGlow.displayName = 'MediaPlayerGlow';

const MediaPlayerPlaybackControls = () => {
  const { isPlaying, togglePlay, toggleVolume, volume, setVolumeValue } =
    useMedia();
  const volumePercent = Math.round(volume * 100);
  const [isVolumeHovering, setIsVolumeHovering] = useState(false);
  const [volumeAnimKey, setVolumeAnimKey] = useState('init');

  const handleToggleVolume = () => {
    setVolumeAnimKey(volume === 0 ? 'unmuted' : 'muted');
    toggleVolume();
  };

  const VolumeIcon =
    volumePercent === 0
      ? VolumeOffIcon
      : volumePercent < 50
        ? VolumeLowIcon
        : VolumeHighIcon;

  return (
    <div className="flex items-center">
      <CtrlButton
        aria-label={isPlaying ? 'Pause' : 'Play'}
        tooltip={isPlaying ? 'Pause' : 'Play'}
        onClick={togglePlay}
      >
        <AnimatedIcon
          icon={isPlaying ? PauseIcon : PlayIcon}
          iconKey={isPlaying ? 'pause' : 'play'}
        />
      </CtrlButton>

      <div
        className="relative"
        onPointerEnter={() => {
          if (!isMobileDevice()) setIsVolumeHovering(true);
        }}
        onPointerLeave={() => {
          if (!isMobileDevice()) setIsVolumeHovering(false);
        }}
        onFocus={() => {
          if (!isMobileDevice()) setIsVolumeHovering(true);
        }}
        onBlur={() => {
          if (!isMobileDevice()) setIsVolumeHovering(false);
        }}
      >
        <AnimatePresence>
          {isVolumeHovering && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute left-1/2 bottom-0 -translate-x-1/2 pb-11 w-8"
            >
              <div
                className="relative w-full rounded-md"
                style={{ height: 102 }}
              >
                <div
                  className="absolute inset-0 rounded-md border border-white/15"
                  style={{
                    background: 'oklch(0 0 0 / 0.35)',
                    backdropFilter: 'blur(16px) saturate(1.2)',
                  }}
                />
                <input
                  aria-hidden="true"
                  tabIndex={-1}
                  type="range"
                  min={0}
                  max={100}
                  value={volumePercent}
                  onChange={(e) => setVolumeValue(Number(e.target.value) / 100)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 m-0 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,white_var(--vp-fill,100%),rgba(255,255,255,0.25)_var(--vp-fill,100%))] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/25 [&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-sm"
                  style={
                    {
                      '--vp-fill': `${volumePercent}%`,
                      width: 80,
                      height: 24,
                    } as React.CSSProperties
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CtrlButton
          aria-label={volumePercent === 0 ? 'Unmute' : 'Mute'}
          tooltip={volumePercent === 0 ? 'Unmute' : 'Mute'}
          onClick={handleToggleVolume}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setVolumeValue(volume + 0.05);
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setVolumeValue(volume - 0.05);
            }
          }}
        >
          <AnimatedIcon icon={VolumeIcon} iconKey={volumeAnimKey} />
        </CtrlButton>
      </div>
    </div>
  );
};

MediaPlayerPlaybackControls.displayName = 'MediaPlayerPlaybackControls';

const MediaPlayerTrack = ({ children }: { children: React.ReactNode }) => {
  const { seek, duration, currentTime, isPlaying, pause, resume } = useMedia();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const wasPlayingRef = useRef(false);

  const [isHovering, setIsHovering] = useState(false);
  const [hoveredTime, setHoveredTime] = useState(0);
  const [showRemaining, setShowRemaining] = useState(false);

  const id = useId();

  const getPercent = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(clientX - rect.left, rect.width)) / rect.width;
  };

  const seekFromX = (x: number) => {
    if (duration) seek(getPercent(x) * duration);
  };
  const moveCursor = (x: number) => {
    const wrapper = wrapperRef.current;
    const cursor = cursorRef.current;
    if (!wrapper || !cursor) return;
    cursor.style.transform = `translateX(${Math.max(0, Math.min(x - wrapper.getBoundingClientRect().left, wrapper.getBoundingClientRect().width))}px)`;
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;

    if (isPlaying) {
      wasPlayingRef.current = true;
      pause();
    }

    seekFromX(e.clientX);

    const onMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect || ev.clientX < rect.left || ev.clientX > rect.right) return;
      seekFromX(ev.clientX);
      moveCursor(ev.clientX);
      setHoveredTime(getPercent(ev.clientX) * duration);
    };

    const onUp = () => {
      isDraggingRef.current = false;
      if (wasPlayingRef.current) {
        wasPlayingRef.current = false;
        resume();
      }
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  return (
    <>
      <span className="font-mono-code text-xs tabular-nums text-white/90 shrink-0 px-1">
        {formatTime(currentTime)}
      </span>

      <div
        ref={wrapperRef}
        id={`${id}-track-wrapper`}
        className="flex flex-1 items-center h-6 cursor-crosshair relative mx-2"
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => {
          moveCursor(e.clientX);
          if (duration) setHoveredTime(getPercent(e.clientX) * duration);
        }}
        onMouseEnter={() => {
          if (!isMobileDevice()) setIsHovering(true);
        }}
        onMouseLeave={() => {
          if (!isMobileDevice()) setIsHovering(false);
        }}
      >
        <div
          ref={cursorRef}
          className="absolute top-0 h-full z-[4] select-none pointer-events-none"
          style={{
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-[70%] bg-white rounded-full shadow" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 font-mono-code text-[10px] tabular-nums text-white/90 whitespace-nowrap">
            {formatTime(hoveredTime)} / {formatTime(duration)}
          </span>
        </div>

        <div
          ref={trackRef}
          id={`${id}-track`}
          tabIndex={0}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={formatTime(currentTime)}
          className="relative h-1 bg-white/20 rounded-full w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-white/40 focus-visible:outline-offset-4"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') seek(currentTime - 1);
            if (e.key === 'ArrowRight') seek(currentTime + 1);
          }}
        >
          {children}
        </div>
      </div>

      <button
        type="button"
        aria-label="Toggle time display format"
        className="font-mono-code text-xs tabular-nums text-white/90 shrink-0 cursor-pointer px-1 rounded hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        onClick={() => setShowRemaining((p) => !p)}
      >
        {showRemaining
          ? `-${formatTime(duration - currentTime)}`
          : formatTime(duration)}
      </button>
    </>
  );
};

MediaPlayerTrack.displayName = 'MediaPlayerTrack';

const MediaPlayerRange = ({ type }: { type: 'played' | 'buffered' }) => {
  const { progressBarRef } = useMedia();
  const isPlayed = type === 'played';

  return (
    <div
      ref={isPlayed ? progressBarRef : undefined}
      className="absolute left-0 w-full h-full"
      style={{
        transformOrigin: 'left',
        transform: 'scaleX(0)',
        backgroundColor: isPlayed ? 'white' : 'rgba(255,255,255,0.2)',
        zIndex: isPlayed ? 2 : 1,
      }}
    />
  );
};

MediaPlayerRange.displayName = 'MediaPlayerRange';

const MediaPlayerScreenControls = () => {
  const { togglePiP, toggleFullscreen, isPiP, isFullscreen } = useMedia();

  return (
    <div className="flex items-center">
      {!isIOS() && (
        <CtrlButton
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          tooltip={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onClick={toggleFullscreen}
        >
          <AnimatedIcon
            icon={isFullscreen ? ArrowShrinkIcon : FullScreenIcon}
            iconKey={isFullscreen ? 'shrink' : 'expand'}
          />
        </CtrlButton>
      )}
      <CtrlButton
        aria-label={isPiP ? 'Exit picture in picture' : 'Picture in picture'}
        tooltip={isPiP ? 'Exit PiP' : 'Picture in picture'}
        onClick={togglePiP}
      >
        <AnimatedIcon
          icon={isPiP ? PictureInPictureExitIcon : PictureInPictureOnIcon}
          iconKey={isPiP ? 'pip-exit' : 'pip-enter'}
        />
      </CtrlButton>
    </div>
  );
};

MediaPlayerScreenControls.displayName = 'MediaPlayerScreenControls';

export const MediaPlayer = {
  Root: MediaPlayerRoot,
  Video: MediaPlayerVideo,
  Glow: MediaPlayerGlow,
  PlaybackControls: MediaPlayerPlaybackControls,
  Track: MediaPlayerTrack,
  Range: MediaPlayerRange,
  ScreenControls: MediaPlayerScreenControls,
  VideoOverlay: MediaPlayerVideoOverlay,
};
