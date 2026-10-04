/**
 * The site's glass: a translucent wash over a blurred, slightly saturated
 * backdrop, edged in a hairline that reads against either theme. It is what
 * lets a panel sit *over* content and keep what it covers legible, where
 * `Card` and `Input` are cut *into* the page.
 *
 * The saturation matters as much as the blur: a plain blur greys whatever it
 * covers, and 115% puts the colour back so the surface reads as glass rather
 * than as fog.
 *
 * Radius is the caller's, since a tooltip, a pill and a dropdown do not round
 * alike. `Select`'s panel and the chart's tooltip and legend share this;
 * `BeforeAfterSlider`'s handle deliberately does not, its fill being heavier
 * because it floats over photography rather than over the page.
 */
export const glassSurface =
  'border border-muted-foreground/15 bg-wash/30 backdrop-blur-md backdrop-saturate-[115%]';
