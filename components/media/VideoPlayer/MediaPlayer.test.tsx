import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MediaPlayer } from './MediaPlayer';

const player = (poster?: string) =>
  render(
    <MediaPlayer.Root aria-label="A video">
      <MediaPlayer.Video poster={poster}>
        <source src="/clip.mp4" type="video/mp4" />
      </MediaPlayer.Video>
    </MediaPlayer.Root>,
  ).container.querySelector('video')!;

describe('MediaPlayer.Video', () => {
  it('stays hidden until its first frame is decoded, then shows', () => {
    const video = player();
    expect(video).toHaveClass('opacity-0');

    fireEvent(video, new Event('loadeddata'));
    expect(video).not.toHaveClass('opacity-0');
  });

  it('shows once it plays, for a data saver that skips loadeddata', () => {
    const video = player();

    fireEvent(video, new Event('playing'));
    expect(video).not.toHaveClass('opacity-0');
  });

  it('hides again when its source is emptied', () => {
    const video = player();
    fireEvent(video, new Event('loadeddata'));

    fireEvent(video, new Event('emptied'));
    expect(video).toHaveClass('opacity-0');
  });

  it('shows at once with a poster, which is a first frame already', () => {
    expect(player('/poster.jpg')).not.toHaveClass('opacity-0');
  });
});
