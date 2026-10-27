export const TEXTURES = { uVideo: 'blog/Clouds.mp4' };
export const ASPECT = 16 / 9;
export const THRESHOLD = { min: 0.01, max: 0.2, initial: 0.04 };
export const DECAY = { min: 0.8, max: 0.99, initial: 0.95 };

export interface Settings {
  threshold: number;
  decay: number;
  video: boolean;
}

export const INITIAL: Settings = {
  threshold: THRESHOLD.initial,
  decay: DECAY.initial,
  video: true,
};

export const uniforms = ({ threshold, decay, video }: Settings) => ({
  uThreshold: threshold,
  uDecay: decay,
  uSource: video ? 1 : 0,
});
