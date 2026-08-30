import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../assets/facility-site-rendering.js';

const API = globalThis.PixelMapFacilitySiteRendering;
const compareHtml = await readFile(
  new URL('../variants/facility-site-rendering-compare.html', import.meta.url), 'utf8');
const mapHtml = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('比較モードは専用指定されたembedded地図だけで有効になる', () => {
  assert.deepEqual(API.modes, ['current','surface','precise','clean','none']);
  const requested = new URLSearchParams('facility-site-compare=1&facility-site-mode=surface');
  assert.deepEqual(API.comparisonMode(requested, true), { enabled:true, mode:'surface' });
  assert.deepEqual(API.comparisonMode(requested, false), { enabled:false, mode:'current' });
  assert.deepEqual(API.comparisonMode(
    new URLSearchParams('facility-site-compare=1&facility-site-mode=unknown'), true),
  { enabled:false, mode:'current' });
});

test('セル整形は孤立突起を除去し一セルのくぼみを埋める', () => {
  const size = 7;
  const grid = new Uint8Array(size * size);
  const buildings = new Uint16Array(size * size);
  const put = (x, y, value = 8, building = 3) => {
    grid[y * size + x] = value;
    buildings[y * size + x] = building;
  };
  put(1, 1);
  put(3, 2); put(2, 3); put(4, 3); put(3, 4);
  const cleaned = API.cleanAtomicFootprint(grid, buildings, size);
  assert.equal(cleaned.grid[1 * size + 1], 0, '孤立した一セルを除去する');
  assert.equal(cleaned.grid[3 * size + 3], 8, '四方を囲まれた一セルのくぼみを埋める');
  assert.equal(cleaned.buildingGrid[3 * size + 3], 3);
  assert.ok(cleaned.changedCells >= 2);
});

test('比較ページは川崎変電所の実データを5方式・同一条件で表示する', () => {
  const panelModes = [...compareHtml.matchAll(/<section class="map-panel" data-mode="([^"]+)"/g)]
    .map(match => match[1]);
  assert.deepEqual(panelModes, ['current','surface','precise','clean','none']);
  assert.match(compareHtml, /lat:'35\.5289'/);
  assert.match(compareHtml, /lon:'139\.68745'/);
  assert.match(compareHtml, /place:'川崎変電所'/);
  assert.match(compareHtml, /OpenFreeMap MVT/);
  assert.match(compareHtml, /OSM由来の神奈川県生成GeoJSON/);
  assert.match(compareHtml, /'facility-site-compare':'1'/);
  assert.match(compareHtml, /'facility-site-mode':mode/);
  assert.match(compareHtml, /type:'pixelmap:set-viewport'/);
  assert.match(compareHtml, /type:'pixelmap:set-bearing'/);
  assert.match(compareHtml, /data-render="cell2"/);
  assert.match(compareHtml, /data-render="cell3"/);
});

test('各施設敷地方式は通常ページから隔離され実建物を維持する', () => {
  assert.match(mapHtml, /FACILITY_SITE_RENDERING\.comparisonMode\(PAGE_PARAMS, EMBEDDED\)/);
  assert.match(mapHtml, /\['surface','precise','none'\]\.includes\(FACILITY_SITE_COMPARE_MODE\)/);
  assert.match(mapHtml, /FACILITY_SITE_COMPARE_MODE === 'clean'/);
  assert.match(mapHtml, /drawCellFacilitySiteSurfaceGrid\(facilityFootprintLayer\.grid/);
  assert.match(mapHtml, /rasterizeStandaloneFacilitySurfacePixels\(/);
  assert.match(mapHtml, /Z0\.5:facilitySiteSurface:atomic/);
  assert.match(mapHtml, /Z0\.5:facilitySiteSurface:precise-1px/);
  assert.match(mapHtml, /actualMapBuildingsPreserved:true/);
  assert.match(mapHtml, /testOnly:FACILITY_SITE_COMPARISON\.enabled/);
});
