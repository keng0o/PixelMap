import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/top-down-game-materials.js');

const MATERIALS = globalThis.PixelMapTopDownMaterials;
const source = await readFile(new URL('../assets/top-down-game-materials.js', import.meta.url), 'utf8');

test('参考画像1から実測した建物と樹冠を独立したCanvas素材として公開する', () => {
  assert.equal(MATERIALS.version, 'pixelmap-top-down-materials/2');
  assert.deepEqual(Object.keys(MATERIALS.catalog), [
    'building-blue-gable-01',
    'building-blue-hipped-02',
    'tree-round-crown-01',
    'tree-small-crown-02',
  ]);
  assert.deepEqual(MATERIALS.catalog['building-blue-gable-01'].nativeSize, [50, 32]);
  assert.deepEqual(MATERIALS.catalog['building-blue-hipped-02'].nativeSize, [72, 64]);
  assert.deepEqual(MATERIALS.catalog['tree-round-crown-01'].nativeSize, [48, 48]);
  assert.deepEqual(MATERIALS.catalog['tree-small-crown-02'].nativeSize, [48, 48]);
  assert.equal(MATERIALS.catalog['building-blue-gable-01'].source.crop.x, 584);
  assert.equal(MATERIALS.catalog['building-blue-gable-01'].source.crop.y, 702);
  assert.deepEqual(MATERIALS.catalog['building-blue-hipped-02'].source.crop,
    { x: 510, y: 592, width: 72, height: 64 });
  assert.equal(MATERIALS.catalog['tree-round-crown-01'].source.crop.x, 590);
  assert.equal(MATERIALS.catalog['tree-round-crown-01'].source.crop.y, 110);
  assert.deepEqual(MATERIALS.catalog['tree-small-crown-02'].source.crop,
    { x: 270, y: 344, width: 48, height: 48 });
  assert.ok(Object.values(MATERIALS.catalog).every(asset => asset.source.reference === 'Photo 1.jpg'));
  assert.ok(Object.values(MATERIALS.catalog).every(asset => asset.referenceClipPath));
  assert.deepEqual(MATERIALS.catalog['building-blue-gable-01'].fitBounds,
    { minX: 12, minY: 2, maxX: 50, maxY: 25 });
  assert.deepEqual(MATERIALS.catalog['tree-round-crown-01'].center, [24, 29]);
});

test('寄棟風屋根素材は張り出しを含む輪郭・3面以上の陰影・長辺線だけを持つ', () => {
  const building = MATERIALS.catalog['building-blue-hipped-02'];
  assert.ok(building.silhouette.length >= 7);
  assert.ok(building.facets.length >= 3);
  assert.ok(building.inkSegments.length >= 5);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.ok(building.inkSegments.some(segment => segment.parts?.length >= 2));
  assert.equal(building.shadowHalf, 'lower-right');
  assert.ok(new Set(building.facets.map(facet => facet.role)).size >= 3);
});

test('建物素材は輪郭・明暗2面・長辺方向の途切れ線を実測primitiveで持つ', () => {
  const building = MATERIALS.catalog['building-blue-gable-01'];
  assert.equal(building.silhouette.length, 6);
  assert.equal(building.facets.length, 2);
  assert.ok(building.inkSegments.length >= 5);
  assert.ok(building.inkSegments.every(segment => segment.axis === 'longest-edge'));
  assert.equal(building.shadowHalf, 'lower-right');
  assert.ok(building.palette.light !== building.palette.shade);
});

test('樹冠素材は外周の重なり葉・暗部・中央ハイライトを個別primitiveで持つ', () => {
  const tree = MATERIALS.catalog['tree-round-crown-01'];
  assert.ok(tree.outline.length >= 12);
  assert.ok(tree.crowns.length >= 9);
  assert.ok(tree.crowns.some(crown => crown.role === 'shadow'));
  assert.ok(tree.crowns.some(crown => crown.role === 'highlight'));
  assert.ok(tree.inkMarks.length >= 5);
});

test('小型樹冠素材は明るい外葉と濃い中心部を別primitiveで持つ', () => {
  const tree = MATERIALS.catalog['tree-small-crown-02'];
  assert.ok(tree.outline.length >= 12);
  assert.ok(tree.crowns.length >= 8);
  assert.ok(tree.crowns.some(crown => crown.role === 'dark'));
  assert.ok(tree.crowns.some(crown => crown.role === 'highlight'));
  assert.ok(tree.crowns.filter(crown => crown.role === 'dark').length >= 4);
  assert.ok(tree.inkMarks.length >= 4);
  assert.deepEqual(tree.center, [24, 25]);
});

test('素材描画はbitmap貼付けや外部画像へ依存せずCanvas primitiveだけを使う', () => {
  assert.doesNotMatch(source, /drawImage\s*\(/);
  assert.doesNotMatch(source, /new\s+Image\s*\(/);
  assert.match(source, /function paintAsset/);
  assert.match(source, /function paintRoofInFrame/);
  assert.match(source, /function paintTreeAt/);
});
