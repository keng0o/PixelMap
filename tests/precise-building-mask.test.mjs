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

test('建物とcorridorは元形状を維持し、競合は診断だけ行う', () => {
  assert.match(html, /const STANDALONE_UNIFIED_STYLE = !EMBEDDED && !CELL_ONLY_MODE/);
  assert.match(html, /function auditStandaloneBuildingCorridorOverlap\(raster, corridorMask\)/);
  assert.match(html, /immutableSourceGeometry:STANDALONE_UNIFIED_STYLE/);
  assert.match(html, /displacedBuildings:0/);
  assert.match(html, /maximumDisplacementLogicalPixels:0/);
  assert.doesNotMatch(html, /function displaceStandaloneBuildingsFromRoads/);
  assert.doesNotMatch(html, /preciseBuildingRaster\?\.offsets/);
});

test('standalone標準は影もPOIも衝突移動せず、POIを元の世界座標へ固定する', () => {
  assert.match(html, /const pt = worldToScreen\(f\.worldX, f\.worldY\)/);
  assert.match(html, /STANDALONE_UNIFIED_STYLE \? null : preciseSurfaceRoadMask/);
  assert.match(html, /shadowsExcludedFromCorridors:!STANDALONE_UNIFIED_STYLE/);
  assert.doesNotMatch(html, /pt\[0\] \+= offset/);
  assert.doesNotMatch(html, /pt\[1\] \+= offset/);
});

test('固定compositorはarea、structure、corridor、bridge、overlayの順で全域を合成する', () => {
  const precise = html.indexOf("'Z2:area:buildings:precise-1px'");
  const corridor = html.indexOf('renderOrder.push(`Z3:corridor:${option}`)');
  const bridge = html.indexOf('renderOrder.push(`Z3:bridge:${option}`)');
  assert.ok(precise >= 0 && corridor > precise && bridge > corridor);
  assert.match(html, /\? \['area','structure','corridor','bridge','object','marker','dot-cluster'\]/);
  assert.match(html, /if \(!STANDALONE_UNIFIED_STYLE && preciseBuildingRoadOverlapPixels\)/);
  assert.match(html, /if \(o\.buildings && !STANDALONE_PRECISE_BUILDINGS\)/);
});
