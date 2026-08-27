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

test('standalone testは画面垂直、本番embeddedは固定消失点を使う', () => {
  const html = fs.readFileSync(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  assert.match(html, /map-bearing\.js\?v=2/);
  assert.match(html, /const BEARING_STUDY_MODE = PAGE_PARAMS\.get\('capture'\) !== '1'/);
  assert.match(html, /PAGE_PARAMS\.has\('bearing'\)/);
  assert.match(html, /screenVectorToWorld/);
  assert.match(html, /const STANDALONE_SCREEN_VERTICAL_EXTRUSION = !EMBEDDED && CELL_ONLY_MODE/);
  assert.match(html, /if \(STANDALONE_SCREEN_VERTICAL_EXTRUSION\) return \[0, -riseCells\]/);
  assert.match(html, /FIXED_VANISHING_POINT/);
  assert.match(html, /fixedVanishingPointHeightExtrusion:[\s\S]*?!STANDALONE_SCREEN_VERTICAL_EXTRUSION/);
  assert.match(html, /screenVerticalHeightExtrusion:STANDALONE_SCREEN_VERTICAL_EXTRUSION/);
  assert.match(html, /mapBearing:/);
});

test('全Webマップのコンパスボタンは15度ずつリロードなしで再描画する', () => {
  const html = fs.readFileSync(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  assert.match(html, /id="bearingMinusBtn"/);
  assert.match(html, /id="bearingPlusBtn"/);
  assert.match(html, /const BEARING_STEP_DEGREES = 15/);
  assert.match(html, /const BEARING_STUDY_MODE = PAGE_PARAMS\.get\('capture'\) !== '1'/);
  const start = html.indexOf('function setMapBearingWithoutReload');
  const end = html.indexOf("\nbearingMinusBtn.addEventListener", start);
  assert.ok(start >= 0 && end > start);
  const controlSource = html.slice(start, end);
  assert.match(controlSource, /history\.replaceState/);
  assert.match(controlSource, /render\(\)/);
  assert.match(controlSource, /reloaded:false/);
  assert.match(controlSource, /pendingBearingUpdate/);
  assert.doesNotMatch(controlSource, /location\.(?:assign|reload|replace)/);
});

test('1・2・4マップは表示方位だけをpostMessageで同期する', () => {
  const mapHtml = fs.readFileSync(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  const oneMapHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const twoMapHtml = fs.readFileSync(new URL('../compare.html', import.meta.url), 'utf8');
  const fourMapHtml = fs.readFileSync(new URL('../variants/height-stack-four-map.html', import.meta.url), 'utf8');
  const fourMapShellHtml = fs.readFileSync(new URL('../four-maps.html', import.meta.url), 'utf8');
  assert.match(mapHtml, /type:'pixelmap:bearing'/);
  assert.match(mapHtml, /type === 'pixelmap:set-bearing'/);
  assert.match(mapHtml, /publish:false/);
  assert.match(oneMapHtml, /pixelmap:set-bearing/);
  assert.match(oneMapHtml, /pixelmap:bearing/);
  assert.match(twoMapHtml, /function sendBearing\(frame, bearing\)/);
  assert.match(twoMapHtml, /for \(const frame of frames\) sendBearing\(frame, latestBearing\)/);
  assert.match(fourMapHtml, /function broadcastBearing\(\)/);
  assert.match(fourMapHtml, /updateParentBearingUrl/);
  assert.match(fourMapShellHtml, /pixelmap:set-bearing/);
  assert.match(fourMapShellHtml, /pixelmap:bearing/);
});
