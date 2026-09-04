import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-patterns.js');

const PATTERNS = globalThis.PixelMapTopDownPatterns;
const source = await readFile(new URL('../assets/top-down-game-patterns.js', import.meta.url), 'utf8');

test('真上視点styleは参考画像1寄りの固定paletteとpattern catalogを公開する', () => {
  assert.equal(PATTERNS.version, 'pixelmap-top-down-patterns/8');
  assert.equal(PATTERNS.styleId, 'top-down-hand-drawn-game-v8');
  assert.equal(PATTERNS.palette.water, '#63c4c3');
  assert.equal(PATTERNS.palette.forest, '#3f704d');
  assert.equal(PATTERNS.palette.road, '#ead9ac');
  assert.equal(PATTERNS.palette.roof, '#4f7893');
  assert.equal(Object.isFrozen(PATTERNS.palette), true);
});

test('普通建物は見た目の異なる5つのCanvas屋根patternを持つ', () => {
  assert.deepEqual(PATTERNS.catalogs.roof.map(pattern => pattern.id), [
    'building-cottage-gable',
    'building-longhouse',
    'building-hipped',
    'building-flat-workshop',
    'building-weathered-gable',
  ]);
  assert.equal(new Set(PATTERNS.catalogs.roof.map(pattern => pattern.primitive)).size, 5);
  assert.ok(PATTERNS.catalogs.roof.every(pattern => pattern.lineDirection === 'longest-edge-only'));
  assert.ok(PATTERNS.catalogs.roof.every(pattern => pattern.handDrawn === true));
});

test('木・道路・水域・地表は複数のpatternを持つ', () => {
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

test('木は参考画像に寄せた多層の凹凸樹冠を使う', () => {
  assert.ok(PATTERNS.catalogs.tree.every(pattern => pattern.primitive === 'scalloped-layered-crown'));
  assert.ok(PATTERNS.catalogs.tree.every(pattern => pattern.handDrawn === true));
  assert.ok(Math.min(...PATTERNS.catalogs.tree.map(pattern => pattern.radius)) >= 8);
  assert.ok(Math.max(...PATTERNS.catalogs.tree.map(pattern => pattern.radius)) >= 15);
});

test('寄棟屋根と小型樹冠は2巡目の参考素材へ接続する', () => {
  assert.equal(PATTERNS.catalogs.roof.find(pattern => pattern.id === 'building-hipped').referenceAsset,
    'building-blue-hipped-02');
  assert.equal(PATTERNS.catalogs.tree.find(pattern => pattern.id === 'tree-small').referenceAsset,
    'tree-small-crown-02');
});

test('長い屋根と濃色樹冠は3巡目の参考素材へ接続する', () => {
  assert.equal(PATTERNS.catalogs.roof.find(pattern => pattern.id === 'building-longhouse').referenceAsset,
    'building-blue-longhouse-03');
  assert.equal(PATTERNS.catalogs.tree.find(pattern => pattern.id === 'tree-dark-crown').referenceAsset,
    'tree-dark-crown-03');
});

test('円形タンク付き平屋根と複数樹冠は4巡目の参考素材へ接続する', () => {
  assert.equal(PATTERNS.catalogs.roof.find(pattern => pattern.id === 'building-flat-workshop').referenceAsset,
    'building-harbor-workshop-04');
  assert.equal(PATTERNS.catalogs.tree.find(pattern => pattern.id === 'tree-multi-crown').referenceAsset,
    'tree-multi-crown-04');
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

test('普通建物の形状と安定seedから5つの屋根patternをすべて選べる', () => {
  const ids = new Set();
  for (let index = 0; index < 500; index += 1) {
    const shape = index % 4;
    ids.add(PATTERNS.selectPattern('roof', {
      key: `ordinary-building-${index}`,
      props: { class: shape === 3 ? 'commercial' : 'residential' },
      metrics: {
        area: shape === 2 ? 2200 : 420 + index,
        aspect: shape === 1 ? 3.2 : 1.25 + shape * 0.25,
        complexity: shape === 2 ? 18 : 6,
      },
    }).pattern.id);
  }
  assert.deepEqual([...ids].sort(), [
    'building-cottage-gable',
    'building-flat-workshop',
    'building-hipped',
    'building-longhouse',
    'building-weathered-gable',
  ]);
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
