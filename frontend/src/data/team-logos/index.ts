import { GERMANY_PIXELS } from './germany.ts';
import { FRANCE_PIXELS } from './france.ts';
import { NETHERLANDS_PIXELS } from './netherlands.ts';
import { getPlaceholderPixels } from './placeholder.ts';

const REAL_LOGOS: Record<string, number[]> = {
  germany: GERMANY_PIXELS,
  france: FRANCE_PIXELS,
  netherlands: NETHERLANDS_PIXELS,
};

export function getLogoPixels(slug: string, fallbackLetter: string): number[] {
  return REAL_LOGOS[slug] || getPlaceholderPixels(fallbackLetter);
}

export { GERMANY_PIXELS, FRANCE_PIXELS, NETHERLANDS_PIXELS, getPlaceholderPixels };
