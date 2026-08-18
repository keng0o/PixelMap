import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('map-03だけが密集建物・面積優先モードを有効にする', async () => {
  const [map02, map03] = await Promise.all([
    read('variants/map-02-refined.html'),
    read('variants/map-03-refined.html'),
  ]);
  assert.match(map03, /PixelMap｜密集建物・面積優先検証/);
  assert.match(map03, /dataset\.denseBuildingMode = 'protected-area'/);
  assert.match(map03, /BUILDING_STYLES\.selectDenseBuildings/);
  assert.match(map03, /collisionPolicy:DENSE_COLLISION_POLICY/);
  assert.match(map03, /facility\.representation !== 'hidden'/);
  assert.match(map03, /facility-resolver\.js\?v=2/);
  assert.match(map03, /building-styles\.js\?v=2/);
  assert.doesNotMatch(map02, /DENSE_COLLISION_POLICY|denseBuildingMode|selectDenseBuildings/);
});

test('既存の1マップ・2マップ・4マップはmap-02を参照し続ける', async () => {
  const pages = await Promise.all(['index.html', 'compare.html', 'four-maps.html'].map(read));
  for (const page of pages){
    assert.doesNotMatch(page, /map-03-refined\.html/);
  }
  assert.match(pages[0], /map-02-refined\.html/);
  assert.match(pages[1], /map-02-refined\.html/);
  assert.match(pages[2], /height-stack-four-map\.html/);
});
