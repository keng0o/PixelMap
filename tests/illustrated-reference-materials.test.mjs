import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/illustrated-reference-materials.js');

const MATERIALS = globalThis.PixelMapIllustratedReferenceMaterials;
const source = await readFile(new URL('../assets/illustrated-reference-materials.js', import.meta.url), 'utf8');

test('彩色地図の寄棟建物を添付画像の原寸cropと別カタログで公開する', () => {
  assert.equal(MATERIALS.version, 'pixelmap-illustrated-reference-materials/8');
  assert.deepEqual(Object.keys(MATERIALS.catalog), [
    'building-red-hipped-annex-01',
    'tree-round-canopy-01',
    'building-gabled-side-wing-02',
    'tree-overlapping-trio-02',
    'tree-lobed-canopy-03',
    'tree-muted-canopy-04',
    'tree-compact-canopy-05',
  ]);
  const building = MATERIALS.catalog['building-red-hipped-annex-01'];
  assert.equal(building.family, 'building');
  assert.equal(building.structure, 'hipped-with-annex');
  assert.deepEqual(building.nativeSize, [61, 52]);
  assert.deepEqual(building.source.imageSize, [736, 952]);
  assert.deepEqual(building.source.crop, { x: 51, y: 498, width: 61, height: 52 });
  assert.match(building.source.reference, /d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa/);
  assert.equal(building.source.usage, 'local-visual-qa-only');
});

test('添付された3種類の単木を原寸輪郭のフラットカラー素材として公開する', () => {
  const expected = [
    ['tree-lobed-canopy-03', 'lobed-canopy', [100, 108], 'image-1.png'],
    ['tree-muted-canopy-04', 'muted-canopy', [88, 94], 'image-2.png'],
    ['tree-compact-canopy-05', 'compact-canopy', [58, 58], 'image-3.png'],
  ];

  for (const [assetId, structure, nativeSize, reference] of expected) {
    const tree = MATERIALS.catalog[assetId];
    assert.equal(tree.family, 'tree');
    assert.equal(tree.structure, structure);
    assert.equal(tree.renderMode, 'flat-shape');
    assert.deepEqual(tree.nativeSize, nativeSize);
    assert.deepEqual(tree.source.imageSize, nativeSize);
    assert.deepEqual(tree.source.crop, { x: 0, y: 0, width: nativeSize[0], height: nativeSize[1] });
    assert.match(tree.source.reference, new RegExp(reference.replace('.', '\\.')));
    assert.match(tree.source.reference, /e8132791-4e96-4494-9bc4-92e9e18f59cd/);
    assert.equal(tree.source.usage, 'local-visual-qa-only');
    assert.ok(tree.crownOutline.length >= 24);
    assert.ok(tree.flatFacets.length >= 2);
    assert.deepEqual(Object.keys(tree.flatPalette), ['outline', 'base', 'light', 'shade']);
    assert.equal(tree.shadowShapes, undefined);
    assert.equal(tree.shadowPixelRows, undefined);
    assert.equal(tree.pixelRows, undefined);
    assert.equal(tree.washes, undefined);
    assert.equal(tree.textureMarks, undefined);
    assert.equal(tree.grainMarks, undefined);
  }
});

test('大小3つの樹冠が重なる樹木群を輪郭maskとフラットな3樹冠で公開する', () => {
  const trees = MATERIALS.catalog['tree-overlapping-trio-02'];
  assert.equal(trees.family, 'tree');
  assert.equal(trees.structure, 'overlapping-trio');
  assert.equal(trees.renderMode, 'flat-mask');
  assert.deepEqual(trees.nativeSize, [54, 50]);
  assert.deepEqual(trees.source.crop, { x: 345, y: 112, width: 54, height: 50 });
  assert.equal(trees.pixelRows.length, 50);
  assert.ok(trees.pixelRows.every(row => row.length === 54));
  assert.equal(trees.shadowPixelRows.length, 50);
  assert.ok(trees.shadowPixelRows.every(row => row.length === 54));
  assert.equal(Object.keys(trees.flatPalette).length, 5);
  assert.equal(trees.flatFacets.length, 3);
  assert.equal(trees.flatFacets.filter(facet => facet.stroke).length, 3);
  assert.equal(trees.shadowAlphaRows, undefined);
  assert.equal(trees.pixelHaloAlpha, undefined);
});

test('彩色地図の小型切妻建物を輪郭maskとフラットな屋根面で公開する', () => {
  const building = MATERIALS.catalog['building-gabled-side-wing-02'];
  assert.equal(building.family, 'building');
  assert.equal(building.structure, 'gabled-with-side-wing');
  assert.equal(building.renderMode, 'flat-mask');
  assert.deepEqual(building.nativeSize, [40, 52]);
  assert.deepEqual(building.source.crop, { x: 82, y: 420, width: 40, height: 52 });
  assert.equal(building.pixelRows.length, 52);
  assert.ok(building.pixelRows.every(row => row.length === 40));
  assert.equal(building.shadowPixelRows.length, 52);
  assert.ok(building.shadowPixelRows.every(row => row.length === 40));
  assert.equal(Object.keys(building.flatPalette).length, 5);
  assert.ok(building.flatFacets.length >= 4);
  assert.ok(building.flatLines.length >= 3);
  assert.equal(building.shadowAlphaRows, undefined);
  assert.equal(building.pixelHaloAlpha, undefined);
});

test('彩色地図の単木を原寸cropとフラットな樹冠面で公開する', () => {
  const tree = MATERIALS.catalog['tree-round-canopy-01'];
  assert.equal(tree.family, 'tree');
  assert.equal(tree.structure, 'round-irregular-canopy');
  assert.deepEqual(tree.nativeSize, [36, 34]);
  assert.deepEqual(tree.source.imageSize, [736, 952]);
  assert.deepEqual(tree.source.crop, { x: 195, y: 539, width: 36, height: 34 });
  assert.ok(tree.crownOutline.length >= 16);
  assert.equal(tree.shadowPixelRows.length, 34);
  assert.ok(tree.shadowPixelRows.every(row => row.length === 36));
  assert.ok(tree.shadowPixelRows.join('').replaceAll('.', '').length >= 50);
  assert.equal(tree.pixelRows.length, 34);
  assert.ok(tree.pixelRows.every(row => row.length === 36));
  assert.ok(tree.pixelRows.join('').replaceAll('.', '').length >= 440);
  assert.equal(tree.renderMode, 'flat-mask');
  assert.equal(Object.keys(tree.flatPalette).length, 5);
  assert.equal(tree.flatFacets.length, 2);
  assert.notEqual(tree.flatPalette.light, tree.flatPalette.shade);
  assert.equal(tree.shadowAlphaRows, undefined);
  assert.equal(tree.pixelHaloAlpha, undefined);
});

test('寄棟建物は主屋根4面・付属棟2面・棟線・四隅線・設備・影色を独立primitiveで持つ', () => {
  const building = MATERIALS.catalog['building-red-hipped-annex-01'];
  assert.ok(building.mainOutline.length >= 8);
  assert.equal(building.mainFacets.length, 4);
  assert.equal(building.annexFacets.length, 2);
  assert.ok(building.ridgeSegments.some(segment => segment.role === 'ridge'));
  assert.equal(building.ridgeSegments.filter(segment => segment.role === 'hip').length, 4);
  assert.ok(building.ridgeSegments.some(segment => segment.role === 'annex-ridge'));
  assert.ok(building.equipment.outer.length >= 5);
  assert.equal(building.shadowShapes.length, 2);
  assert.ok(building.shadowShapes.every(shape => !('alpha' in shape) && !('blur' in shape)));
  assert.notEqual(building.palette.upper, building.palette.lower);
  assert.equal(building.palette.upper, '#ee9a7a');
  assert.equal(building.palette.lower, '#b1816c');
  assert.equal(building.palette.inkDeep, '#110300');
  assert.equal(building.washes, undefined);
  assert.equal(building.textureMarks, undefined);
  assert.equal(building.grainMarks, undefined);
});

test('素材描画はbitmap・半透明・ぼかし・グラデーションなしのフラットなCanvas primitiveだけを使う', () => {
  assert.doesNotMatch(source, /drawImage\s*\(/);
  assert.doesNotMatch(source, /new\s+Image\s*\(/);
  assert.doesNotMatch(source, /globalAlpha|\.filter\s*=|create(?:Linear|Radial)Gradient|paintWash|grainMarks|textureMarks|pixelHaloAlpha|shadowAlphaRows/);
  assert.match(source, /function paintBuilding/);
  assert.match(source, /function paintTree/);
  assert.match(source, /function paintPixelMask/);
  assert.match(source, /function paintFlatPixelMaterial/);
  assert.match(source, /function paintFlatShapeMaterial/);
  assert.match(source, /function paintPixelOutline/);
  assert.match(source, /function paintPolygon/);
  assert.match(source, /function paintAsset/);
});
