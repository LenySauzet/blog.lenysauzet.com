import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SlideshowCarousel } from './SlideshowCarousel';

// jsdom has no layout, so Embla cannot scroll here; the browser proves the motion.
// What stands without it: the slideshow is one named carousel, its slides are
// labelled and only the current one is reachable, and the controls it offers.
const props = {
  images: ['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png', 'https://cdn.example.com/c.png'],
  width: 1600,
  height: 900,
  alt: 'Three paintings',
  autoPlay: false,
  interval: 5000,
};

describe('SlideshowCarousel', () => {
  it('is one named, focusable carousel of labelled slides', () => {
    render(<SlideshowCarousel {...props} />);
    const carousel = screen.getByRole('region', { name: 'Three paintings' });
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    expect(carousel).toHaveAttribute('tabindex', '0');
    const slides = screen.getAllByRole('group', { hidden: true });
    expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
  });

  it('leaves only the current slide reachable', () => {
    render(<SlideshowCarousel {...props} />);
    const slides = screen.getAllByRole('group', { hidden: true });
    expect(slides.map((slide) => slide.hasAttribute('inert'))).toEqual([false, true, true]);
  });

  it('offers previous, next and a step per image, the first step current', () => {
    render(<SlideshowCarousel {...props} />);
    expect(screen.getByRole('button', { name: 'Previous image' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next image' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Image 1' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getAllByRole('button', { name: /^Image \d$/ })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /slideshow/ })).toBeNull();
  });

  it('offers a pause control only when it plays itself, held paused under reduced motion', () => {
    render(<SlideshowCarousel {...props} autoPlay />);
    // vitest-setup reports reduced motion, so the slideshow starts still.
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
  });

  it('draws no controls for a single image', () => {
    render(<SlideshowCarousel {...props} images={props.images.slice(0, 1)} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('region')).not.toHaveAttribute('tabindex');
  });
});
