import { describe, expect, it } from 'vitest';

import { formatPoiCoordinate, PREVIEW_POIS } from './previewPois';

describe('preview POIs', () => {
  it('keeps preview hit targets unique and inside the 16-cell grid', () => {
    const cells = PREVIEW_POIS.map((poi) => `${poi.gridX}:${poi.gridY}`);
    expect(new Set(cells).size).toBe(PREVIEW_POIS.length);
    expect(PREVIEW_POIS.every((poi) => poi.gridX >= 0 && poi.gridX < 16)).toBe(true);
    expect(PREVIEW_POIS.every((poi) => poi.gridY >= 0 && poi.gridY < 16)).toBe(true);
  });

  it('formats signed coordinates with cardinal directions', () => {
    expect(formatPoiCoordinate(35.5315, 'N', 'S')).toBe('35.5315° N');
    expect(formatPoiCoordinate(-139.6967, 'E', 'W')).toBe('139.6967° W');
  });
});
