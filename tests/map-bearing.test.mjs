import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../assets/map-bearing.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const bearing = context.PixelMapBearing;

const closeTo = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} is not close to ${expected}`);

test('normalizes map bearings into one clockwise turn', () => {
  assert.equal(bearing.normalizeDegrees(-30), 330);
  assert.equal(bearing.normalizeDegrees(390), 30);
  assert.equal(bearing.normalizeDegrees(Number.NaN), 0);
});

test('rotates world points clockwise-bearing into screen coordinates', () => {
  const [x, y] = bearing.rotatePoint([100, 50], 90, 50, 50);
  closeTo(x, 50);
  closeTo(y, 0);
  const restored = bearing.inverseRotatePoint([x, y], 90, 50, 50);
  closeTo(restored[0], 100);
  closeTo(restored[1], 50);
});

test('converts a screen-up extrusion back into world space', () => {
  const worldVector = bearing.screenVectorToWorld([4, -12], 37);
  const screenVector = bearing.worldVectorToScreen(worldVector, 37);
  closeTo(screenVector[0], 4);
  closeTo(screenVector[1], -12);
});

test('projects building height away from one fixed vanishing point', () => {
  const vanishingPoint = [0, 10];
  const referencePoint = [5, 5];
  const atReference = bearing.fixedVanishingProjection(
    referencePoint, vanishingPoint, 4, referencePoint
  );
  closeTo(Math.hypot(...atReference), 4);
  closeTo(atReference[0] / atReference[1], -1);

  const fartherOnSameRay = bearing.fixedVanishingProjection(
    [10, 0], vanishingPoint, 4, referencePoint
  );
  closeTo(fartherOnSameRay[0] / fartherOnSameRay[1], -1);
  assert.ok(Math.hypot(...fartherOnSameRay) > Math.hypot(...atReference));
});

test('caps fixed-vanishing projection and collapses at the vanishing point', () => {
  assert.deepEqual(
    [...bearing.fixedVanishingProjection([0, 10], [0, 10], 8, [5, 5])],
    [0, 0]
  );
  const capped = bearing.fixedVanishingProjection([100, -90], [0, 10], 8, [5, 5], 1.25);
  closeTo(Math.hypot(...capped), 10);
});

test('standalone test page exposes bearing study without production embedding', () => {
  const html = fs.readFileSync(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  assert.match(html, /map-bearing\.js\?v=2/);
  assert.match(html, /const BEARING_STUDY_MODE = !EMBEDDED/);
  assert.match(html, /PAGE_PARAMS\.has\('bearing'\)/);
  assert.match(html, /screenVectorToWorld/);
  assert.match(html, /FIXED_VANISHING_POINT/);
  assert.match(html, /fixedVanishingPointHeightExtrusion/);
  assert.match(html, /mapBearing:/);
});
