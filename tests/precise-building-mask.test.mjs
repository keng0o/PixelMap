import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const worldStyle = await readFile(new URL('../assets/world-style.js', import.meta.url), 'utf8');

test('1論理px建物マスクは単体標準ページだけで有効になる', () => {
  assert.match(html, /const STANDALONE_PRECISE_BUILDINGS = !EMBEDDED && !CELL_ONLY_MODE/);
  assert.match(html, /function rasterizeStandaloneBuildingPixels\(bldUnits\)/);
  assert.match(html, /sceneX \/ SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /const sampleY = y \+ \.5/);
  assert.match(html, /owner\[y \* size \+ x\] = bi/);
});

test('建物チップと1論理px輪郭を分離して最近傍合成する', () => {
  assert.match(html, /function drawGrid\([\s\S]*?drawContext = ctx\)/);
  assert.match(html, /function preciseBuildingTextureGrid\(raster, buildingKinds, detailedBuildings = null\)/);
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

test('z14通常建物はringKey固定のsemantic LODでareaとRPG屋根へ分ける', () => {
  assert.match(html, /function selectWorldStyleBuildingLod\(raster, buildingKinds, buildingDescs, foregroundBuildingIds = new Set\(\)\)/);
  assert.match(html, /positiveModulo\(Number\(desc\?\.lodSeed \|\| bi\), WORLD_STYLE\.building\.detailedSmallModulo\)/);
  assert.match(html, /const lodSeed = BUILDING_STYLES\.seedFromKey\(unit\.ringKey\)/);
  assert.match(html, /const foregroundBuildingIds = new Set\(drawnIcons/);
  assert.match(html, /foregroundBuildingIds\.has\(bi\)/);
  assert.match(html, /WORLD_STYLE\.building\.quietFills/);
  assert.match(html, /!lod\.detailed\[raster\.owner\[i\]\]/);
  assert.match(html, /semanticLod:preciseBuildingLodStats/);
  const start = html.indexOf('function selectWorldStyleBuildingLod');
  const end = html.indexOf('function preciseBuildingTextureGrid', start);
  assert.doesNotMatch(html.slice(start, end), /roadMask|viewOffset|corridor/);
});

test('standalone標準は影だけをcorridorから除外し、建物本体とPOIの座標を固定する', () => {
  assert.match(html, /const pt = worldToScreen\(f\.worldX, f\.worldY\)/);
  assert.match(html, /drawStandalonePreciseBuildings\([\s\S]*?preciseSurfaceRoadMask[\s\S]*?\)/);
  assert.match(html, /shadowsExcludedFromCorridors:Boolean\(preciseSurfaceRoadMask\)/);
  assert.doesNotMatch(html, /pt\[0\] \+= offset/);
  assert.doesNotMatch(html, /pt\[1\] \+= offset/);
});

test('固定compositorは地表corridorを建物の下へ置き、橋とoverlayを後段へ分離する', () => {
  const corridor = html.indexOf('renderOrder.push(`Z2:ground-corridor:${option}`)');
  const precise = html.indexOf("'Z3:building:precise-1px'");
  const structure = html.indexOf("'Z3:symbol:structure'");
  const bridge = html.indexOf('renderOrder.push(`Z3:bridge:${option}`)');
  assert.ok(corridor >= 0 && precise > corridor && structure > precise && bridge > structure);
  assert.match(worldStyle, /'area','ground-corridor','building','structure','bridge','object','marker','dot-cluster'/);
  assert.match(html, /if \(!STANDALONE_UNIFIED_STYLE && preciseBuildingRoadOverlapPixels\)/);
  assert.match(html, /if \(o\.buildings && !STANDALONE_PRECISE_BUILDINGS\)/);
});
