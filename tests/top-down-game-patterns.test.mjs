import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-patterns.js');

const PATTERNS = globalThis.PixelMapTopDownPatterns;
const source = await readFile(new URL('../assets/top-down-game-patterns.js', import.meta.url), 'utf8');

test('真上視点styleは参考画像1寄りの固定paletteとpattern catalogを公開する', () => {
  assert.equal(PATTERNS.version, 'pixelmap-top-down-patterns/1');
  assert.equal(PATTERNS.styleId, 'top-down-hand-drawn-game-v1');
  assert.equal(PATTERNS.palette.water, '#63c4c3');
  assert.equal(PATTERNS.palette.forest, '#3f704d');
  assert.equal(PATTERNS.palette.road, '#ead9ac');
  assert.equal(PATTERNS.palette.roof, '#4f7893');
  assert.equal(Object.isFrozen(PATTERNS.palette), true);
});

test('屋根・木・道路・水域・地表は複数のpatternを持つ', () => {
  assert.ok(PATTERNS.catalogs.roof.length >= 6);
  assert.ok(PATTERNS.catalogs.tree.length >= 5);
  assert.ok(PATTERNS.catalogs.road.length >= 4);
  assert.ok(PATTERNS.catalogs.water.length >= 4);
  assert.ok(PATTERNS.catalogs.ground.length >= 5);
  const entries = Object.values(PATTERNS.catalogs).flat();
  assert.equal(new Set(entries.map(pattern => pattern.id)).size, entries.length);
  for (const pattern of entries) {
    assert.ok(pattern.id);
    assert.ok(pattern.family);
    assert.ok(pattern.primitive);
    assert.equal(Object.isFrozen(pattern), true);
  }
});

test('feature keyはproperty順と配列indexではなく地物ID・意味・world boundsで安定する', () => {
  const first = PATTERNS.featureKey({
    layer: 'building', id: 42, props: { class: 'commercial', building: 'yes' },
    bounds: { minX: 10.1254, minY: 20.8752, maxX: 38.5001, maxY: 44.2499 },
  });
  const reordered = PATTERNS.featureKey({
    layer: 'building', id: 42, props: { building: 'yes', class: 'commercial' },
    bounds: { minX: 10.1254, minY: 20.8752, maxX: 38.5001, maxY: 44.2499 },
  });
  assert.equal(first, reordered);
  assert.doesNotMatch(first, /index/);
  assert.equal(PATTERNS.hashString(first), PATTERNS.hashString(reordered));
});

test('geometry metricsは小数座標を丸めず屋根選択に必要な形状を返す', () => {
  const metrics = PATTERNS.geometryMetrics([[
    [0.25, 0.5], [12.75, 0.5], [12.75, 4.25], [0.25, 4.25], [0.25, 0.5],
  ]]);
  assert.equal(metrics.bounds.minX, 0.25);
  assert.equal(metrics.bounds.maxY, 4.25);
  assert.equal(metrics.width, 12.5);
  assert.equal(metrics.height, 3.75);
  assert.ok(metrics.aspect > 3);
  assert.ok(metrics.area > 46 && metrics.area < 47);
});

test('同じ地物は同じvariantを返しviewportや描画順に依存しない', () => {
  const input = {
    key: 'building|42|commercial|10.125,20.875,38.500,44.250',
    props: { class: 'commercial' },
    metrics: { area: 810, aspect: 1.4, complexity: 8 },
  };
  const first = PATTERNS.selectPattern('roof', input);
  const second = PATTERNS.selectPattern('roof', { ...input, viewportX: 999, renderCount: 7 });
  assert.deepEqual(second, first);

  const ids = new Set(Array.from({ length: 80 }, (_, index) => PATTERNS.selectPattern('roof', {
    ...input, key: `building|${index}|commercial|${index * 17},0,100,100`,
  }).pattern.id));
  assert.ok(ids.size >= 3, `expected roof variation, received ${[...ids].join(', ')}`);
});

test('道路classと未知分類は意味に合うfamilyまたはneutralへ決定的に縮退する', () => {
  assert.equal(PATTERNS.selectPattern('road', { key: 'a', props: { class: 'path' } }).pattern.id, 'road-narrow-path');
  assert.equal(PATTERNS.selectPattern('road', { key: 'b', props: { class: 'motorway' } }).pattern.id, 'road-cobbled-major');
  const fallback = PATTERNS.selectPattern('unknown-family', { key: 'c', props: {} });
  assert.equal(fallback.pattern.id, 'ground-neutral-grass');
  assert.equal(fallback.fallback, true);
  assert.match(fallback.reason, /unknown-family/);
});

test('pattern選択は実行時乱数を使わない', () => {
  assert.doesNotMatch(source, /Math\.random\s*\(/);
});
