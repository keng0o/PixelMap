import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('cell2は単独ページのrender指定でだけ有効になりcell8は廃止される', () => {
  assert.match(html, /const CELL_ONLY_MODE = !EMBEDDED && PAGE_PARAMS\.get\('render'\) === 'cell2'/);
  assert.match(html, /const RENDER_MODE = CELL_ONLY_MODE \? 'cell2' : 'standard'/);
  assert.doesNotMatch(html, /PAGE_PARAMS\.get\('render'\) === 'cell8'/);
  assert.match(html, /dataset\.renderMode = RENDER_MODE/);
  assert.match(html, /renderMode:RENDER_MODE/);
});

test('cell2だけ384グリッド・4シーンpxセルを使う', () => {
  assert.match(html, /const STANDARD_GRID = 96, STANDARD_CPX = 16/);
  assert.match(html, /const CELL_DETAIL_SCALE = CELL_ONLY_MODE \? 4 : 1/);
  assert.match(html, /const GRID = STANDARD_GRID \* CELL_DETAIL_SCALE/);
  assert.match(html, /const CPX = STANDARD_CPX \/ CELL_DETAIL_SCALE/);
  assert.match(html, /const MAP_CELL_LOGICAL_SIZE = CPX \/ SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /gridCellsPerSide:GRID/);
});

test('意味セルバッファを不透明色で合成し最近傍でセル全面へ展開する', () => {
  assert.match(html, /function paintSolidMapCell\(gx, gy, color, layer, stats\)/);
  assert.match(html, /stats\.pixelData\[pixelIndex \+ 3\] = rgba\[3\]/);
  assert.match(html, /\[0, 0, 0, 255\]/);
  assert.match(html, /function flushSolidCellBuffer\(stats\)/);
  assert.match(html, /new ImageData\(stats\.pixelData, size, size\)/);
  assert.match(html, /ctx\.imageSmoothingEnabled = false/);
  assert.match(html, /ctx\.drawImage\(cellCompositeCanvas, originX, originY, size \* CPX, size \* CPX\)/);
  assert.match(html, /function drawSolidCellGrid\(grid, option, stats, transparent = true\)/);
  assert.match(html, /singleColorCells:CELL_ONLY_MODE/);
  assert.match(html, /semanticCellBuffer:CELL_ONLY_MODE/);
});

test('細分化しても公園・建物の意味分類は96セル基準を維持する', () => {
  assert.match(html, /const semanticS = STANDARD_GRID \/ extent/);
  assert.match(html, /return Math\.abs\(twiceArea\) \* \.5 \* semanticS \* semanticS/);
  assert.match(html, /geomAreaCells:Math\.abs\(outer\.signed\) \* \(STANDARD_GRID \/ buildingExtent\) \*\* 2/);
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

test('交通線は4連結を保ち、cell2では従来幅へ4倍展開する', () => {
  assert.match(html, /function traverse\(x0, y0, x1, y1, visit\)/);
  assert.match(html, /setCellBrush\(grid, cx, cy, id, \(thick \? 2 : 1\) \* CELL_DETAIL_SCALE\)/);
  assert.match(html, /c\.lineWidth = lineWidth \* CELL_DETAIL_SCALE/);
});

test('施設はS・M・Lの旧セル形状を4×4個のcell2へ展開する', () => {
  assert.match(html, /function drawCellFacilityMarker\(item, size, layer\)/);
  assert.match(html, /size === 'L'[\s\S]*?\[-1,-1,OUT\][\s\S]*?\[0,0,tone\][\s\S]*?size === 'M'/);
  assert.match(html, /\[\[0,-1,OUT\],\[-1,0,OUT\],\[0,0,tone\],\[1,0,OUT\],\[0,1,OUT\]\]/);
  assert.match(html, /: \[\[0,0,tone\]\]/);
  assert.match(html, /function paintLegacyCellBlock\(gx, gy, color, layer, stats\)/);
  assert.match(html, /gx \+ dx \* CELL_DETAIL_SCALE/);
  assert.match(html, /function drawCellPoi\(\)/);
  assert.match(html, /drawCellFacilityMarker\(c, 'L', 'clusters'\)/);
  assert.match(html, /w:STANDARD_CPX \* 3, h:STANDARD_CPX \* 3/);
});

test('地形記号をセル化してから名称と現在地を重ねる', () => {
  const cellBranch = html.match(/if \(CELL_ONLY_MODE\)\{\n    if \(o\.dots[\s\S]*?\n  \} else \{/u)?.[0] || '';
  assert.match(cellBranch, /drawCellTerrainSymbols\(\)/);
  assert.match(cellBranch, /cellLabelDrawers\[option\]\(\)/);
  assert.ok(cellBranch.indexOf('drawCellTerrainSymbols()') < cellBranch.indexOf('cellLabelDrawers[option]()'));
  assert.ok(cellBranch.indexOf('flushSolidCellBuffer(cellRenderingStats)') < cellBranch.indexOf('cellLabelDrawers[option]()'));
  assert.ok(html.indexOf('drawCurrentLocation();') > html.indexOf('cellLabelDrawers[option]();'));
  assert.match(html, /terrainNames:drawCellTerrainNames/);
  assert.match(html, /paintLegacyCellBlock\(x, y, color, 'terrainSymbols', cellRenderingStats\)/);
});

test('セル描画の件数を診断情報へ公開する', () => {
  for (const field of ['gridCellsPerSide','cellizedFeatures','facilitySymbols','terrainSymbols','paintedCells','occupiedCells','layerCells'])
    assert.match(html, new RegExp(`${field}:`), field);
  assert.match(html, /cellLogicalPixels:MAP_CELL_LOGICAL_SIZE/);
  assert.match(html, /cellScenePixels:CPX/);
});
