import { describe, expect, it } from 'vitest';

import { responsiveMapLayout } from './responsiveLayout';

describe('responsive map layout', () => {
  it('uses a full-width single column on a portrait phone', () => {
    expect(responsiveMapLayout(393, 852)).toEqual({
      contentMaxWidth: 560,
      horizontalPadding: 16,
      mapSize: 361,
      wide: false,
    });
  });

  it('keeps the square map within the short edge in phone landscape', () => {
    const layout = responsiveMapLayout(852, 393);
    expect(layout.wide).toBe(true);
    expect(layout.mapSize).toBe(265);
    expect(layout.mapSize).toBeLessThan(393 - 100);
  });

  it('centers a capped two-column canvas on tablet', () => {
    expect(responsiveMapLayout(1024, 1366)).toEqual({
      contentMaxWidth: 960,
      horizontalPadding: 24,
      mapSize: 420,
      wide: true,
    });
  });

  it('defends against transient zero-size window measurements', () => {
    const layout = responsiveMapLayout(0, 0);
    expect(layout.mapSize).toBe(288);
    expect(layout.wide).toBe(false);
  });
});
