import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('cell8は単独ページのrender指定でだけ有効になる', () => {
  assert.match(html, /const CELL_ONLY_MODE = !EMBEDDED && PAGE_PARAMS\.get\('render'\) === 'cell8'/);
  assert.match(html, /const RENDER_MODE = CELL_ONLY_MODE \? 'cell8' : 'standard'/);
  assert.match(html, /dataset\.renderMode = RENDER_MODE/);
  assert.match(html, /renderMode:RENDER_MODE/);
});

test('1マップセルを8論理pxの単色矩形として直接描く', () => {
  assert.match(html, /const MAP_CELL_LOGICAL_SIZE = CPX \/ SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /function paintSolidMapCell\(gx, gy, color, layer, stats\)/);
  assert.match(html, /nativeFillRect\(originX \+ gx \* CPX, originY \+ gy \* CPX, CPX, CPX\)/);
  assert.match(html, /function drawSolidCellGrid\(grid, option, stats, transparent = true\)/);
  assert.match(html, /singleColorCells:CELL_ONLY_MODE/);
});

test('セルモードの地形・交通・建物は精細描画を迂回する', () => {
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawSolidCellGrid\(grid, option, cellRenderingStats/);
  assert.match(html, /if \(CELL_ONLY_MODE\)\{[\s\S]*?drawSolidBuildingGrid\(normalBuildingGrid/);
  assert.match(html, /else if \(SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option\)/);
  assert.match(html, /else if \(tunnelOptions\.has\(option\)\) drawTunnelLayer\(option\)/);
});

test('地下交通もセルモード用グリッドへ分類する', () => {
  assert.match(html, /if \(!isBridgeFeature && option === 'subway'\)[\s\S]*?layer = 'subway'/);
  assert.match(html, /\['paths','tracks'\]\.includes\(option\)\) layer = 'pathTunnels'/);
  assert.match(html, /\['rail','aerialways'\]\.includes\(option\)\) layer = 'railTunnels'/);
  assert.match(html, /else layer = 'roadTunnels'/);
});

test('施設はS・M・Lの単色セルパターンを使う', () => {
  assert.match(html, /function drawCellFacilityMarker\(item, size, layer\)/);
  assert.match(html, /size === 'L'[\s\S]*?\[-1,-1,OUT\][\s\S]*?\[0,0,tone\][\s\S]*?size === 'M'/);
  assert.match(html, /\[\[0,-1,OUT\],\[-1,0,OUT\],\[0,0,tone\],\[1,0,OUT\],\[0,1,OUT\]\]/);
  assert.match(html, /: \[\[0,0,tone\]\]/);
  assert.match(html, /function drawCellPoi\(\)/);
  assert.match(html, /drawCellFacilityMarker\(c, 'L', 'clusters'\)/);
});

test('地形記号をセル化してから名称と現在地を重ねる', () => {
  const cellBranch = html.match(/if \(CELL_ONLY_MODE\)\{\n    if \(o\.dots[\s\S]*?\n  \} else \{/u)?.[0] || '';
  assert.match(cellBranch, /drawCellTerrainSymbols\(\)/);
  assert.match(cellBranch, /cellLabelDrawers\[option\]\(\)/);
  assert.ok(cellBranch.indexOf('drawCellTerrainSymbols()') < cellBranch.indexOf('cellLabelDrawers[option]()'));
  assert.ok(html.indexOf('drawCurrentLocation();') > html.indexOf('cellLabelDrawers[option]();'));
  assert.match(html, /terrainNames:drawCellTerrainNames/);
});

test('セル描画の件数を診断情報へ公開する', () => {
  for (const field of ['cellizedFeatures','facilitySymbols','terrainSymbols','paintedCells','occupiedCells','layerCells'])
    assert.match(html, new RegExp(`${field}:`), field);
  assert.match(html, /cellLogicalPixels:MAP_CELL_LOGICAL_SIZE/);
  assert.match(html, /cellScenePixels:CPX/);
});
