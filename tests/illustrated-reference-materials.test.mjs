import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/illustrated-reference-materials.js');

const MATERIALS = globalThis.PixelMapIllustratedReferenceMaterials;
const source = await readFile(new URL('../assets/illustrated-reference-materials.js', import.meta.url), 'utf8');

test('彩色地図の寄棟建物を添付画像の原寸cropと別カタログで公開する', () => {
  assert.equal(MATERIALS.version, 'pixelmap-illustrated-reference-materials/3');
  assert.deepEqual(Object.keys(MATERIALS.catalog), ['building-red-hipped-annex-01']);
  const building = MATERIALS.catalog['building-red-hipped-annex-01'];
  assert.equal(building.family, 'building');
  assert.equal(building.structure, 'hipped-with-annex');
  assert.deepEqual(building.nativeSize, [61, 52]);
  assert.deepEqual(building.source.imageSize, [736, 952]);
  assert.deepEqual(building.source.crop, { x: 51, y: 498, width: 61, height: 52 });
  assert.match(building.source.reference, /d34c3fa1-cdfc-4de4-b96b-c0e7dcb67aaa/);
  assert.equal(building.source.usage, 'local-visual-qa-only');
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
  assert.ok(building.shadowShapes.length >= 3);
  assert.ok(building.shadowMarks.length >= 8);
  assert.notEqual(building.palette.upper, building.palette.lower);
  assert.equal(building.palette.upper, '#ee9a7a');
  assert.equal(building.palette.lower, '#b1816c');
  assert.equal(building.palette.inkDeep, '#110300');
  assert.ok(building.washes.length >= 4);
  assert.ok(building.textureMarks.length >= 6);
  assert.ok(building.grainMarks.length >= 8);
});

test('素材描画はbitmap貼付けや外部画像へ依存せずCanvas primitiveだけを使う', () => {
  assert.doesNotMatch(source, /drawImage\s*\(/);
  assert.doesNotMatch(source, /new\s+Image\s*\(/);
  assert.match(source, /function paintBuilding/);
  assert.match(source, /function paintPolygon/);
  assert.match(source, /function paintAsset/);
});
