import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('1論理px建物マスクは単体標準ページだけで有効になる', () => {
  assert.match(html, /const STANDALONE_PRECISE_BUILDINGS = !EMBEDDED && !CELL_ONLY_MODE/);
  assert.match(html, /function rasterizeStandaloneBuildingPixels\(bldUnits\)/);
  assert.match(html, /sceneX \/ SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /const sampleY = y \+ \.5/);
  assert.match(html, /owner\[y \* size \+ x\] = bi/);
});

test('建物チップと1論理px輪郭を分離して最近傍合成する', () => {
  assert.match(html, /function drawGrid\([\s\S]*?drawContext = ctx\)/);
  assert.match(html, /function preciseBuildingTextureGrid\(raster, buildingKinds\)/);
  assert.match(html, /globalCompositeOperation = 'destination-in'/);
  assert.match(html, /drawImage\([\s\S]*?preciseBuildingMaskCanvas[\s\S]*?SCENE_SIZE, SCENE_SIZE/);
  assert.match(html, /クリップ後の輪郭を1論理pxで描き直し/);
});

test('道路競合は棟全体の平行移動を先に試し、建物画素を削除しない', () => {
  assert.match(html, /function displaceStandaloneBuildingsFromRoads\(raster, roadMask, buildingKinds, maxDistance = 8\)/);
  assert.match(html, /if \(occupancy\[index\] === bi\) occupancy\[index\] = 0/);
  assert.match(html, /occupancy\[y \* size \+ x\] = bi/);
  assert.match(html, /if \(out \|\| occupied\) continue/);
  assert.match(html, /maximumDisplacementLogicalPixels:/);
});

test('影は道路から除外し、POIは移動した建物へ追従する', () => {
  assert.match(html, /function standaloneSurfaceRoadMask\(options, transportationFeatures\)/);
  assert.match(html, /roadMask\[index\]\) continue/);
  assert.match(html, /const offset = preciseBuildingRaster\?\.offsets\?\.\[bi\]/);
  assert.match(html, /pt\[0\] \+= offset\.dx \* SCENE_PIXELS_PER_LOGICAL_PIXEL/);
});

test('通常・POI建物を同じ高さで描き、未解決道路と橋をその後に描く', () => {
  const precise = html.indexOf("renderOrder.push('Z3:buildings:precise-1px')");
  const fallback = html.indexOf("renderOrder.push('Z3:surface-roads:conflict-fallback')");
  const bridge = html.indexOf('renderOrder.push(`Z3:bridge:${option}`)');
  assert.ok(precise >= 0 && fallback > precise && bridge > fallback);
  assert.match(html, /if \(o\.buildings && !STANDALONE_PRECISE_BUILDINGS\)/);
});
