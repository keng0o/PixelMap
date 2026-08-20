import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const oneMap = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const twoMap = await readFile(new URL('../compare.html', import.meta.url), 'utf8');
const fourMap = await readFile(new URL('../variants/height-stack-four-map.html', import.meta.url), 'utf8');

test('表示倍率は1に固定し、旧pixel指定では変えない', () => {
  assert.match(html, /const REQUESTED_DISPLAY_SCALE = 1/);
  assert.doesNotMatch(html, /PAGE_PARAMS\.get\('pixel'\) === '2'/);
  assert.match(html, /dataset\.pixelRequestedScale = String\(REQUESTED_DISPLAY_SCALE\)/);
  assert.match(html, /pixelRequestedScale:REQUESTED_DISPLAY_SCALE/);
});

test('1536シーンpxのシーンを768論理pxの出力画像へ最近傍変換する', () => {
  assert.match(html, /const SCENE_SIZE = 1536/);
  assert.match(html, /const PRESENTATION_SIZE = SCENE_SIZE \/ 2/);
  assert.match(html, /cv\.width = cv\.height = PRESENTATION_SIZE/);
  assert.match(html, /const sceneCanvas = document\.createElement\('canvas'\)/);
  assert.match(html, /presentationCtx\.imageSmoothingEnabled = false/);
  assert.match(html, /presentationCtx\.drawImage\([\s\S]*?SCENE_SIZE, SCENE_SIZE,[\s\S]*?PRESENTATION_SIZE, PRESENTATION_SIZE/);
});

test('施設スプライトの素材座標1単位を1論理px（2シーンpx）で描く', () => {
  assert.match(html, /const spritePixelScale = sp\.contract\.assetPixelScale/);
  assert.match(html, /POI_SPRITE_CATALOG\.contract\(asset\.id,size\)/);
  assert.match(html, /ctx\.scale\(spritePixelScale, spritePixelScale\)/);
});

test('全アセットを論理ピクセルグリッドへそろえる', () => {
  assert.match(html, /const SCENE_PIXELS_PER_LOGICAL_PIXEL = 2/);
  assert.match(html, /function quantizeAssetRect\(x,y,w,h\)/);
  assert.match(html, /Math\.floor\(x\/SCENE_PIXELS_PER_LOGICAL_PIXEL\)\*SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /Math\.ceil\(\(x\+w\)\/SCENE_PIXELS_PER_LOGICAL_PIXEL\)\*SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /draw\(g, \(x,y,w,h,col\)=>fillAssetRect\(g,x,y,w,h,col\)\)/);
  assert.match(html, /document\.documentElement\.dataset\.assetPixelSize = '1'/);
  assert.match(html, /assetLogicalPixel:1/);
});

test('単体ページも本番と同じモード・パターン・アセットを使う', () => {
  assert.match(html, /const requestedPatternId = String\(PAGE_PARAMS\.get\('pattern'\) \|\| '07'\)\.padStart\(2, '0'\)/);
  assert.match(html, /dataset\.mapMode = 'production'/);
  assert.match(html, /dataset\.assetTaste = 'reference'/);
  assert.doesNotMatch(html, /TEST_MODE|data-map-mode="test"|TEST_POP|TEST_TRANSPORT/);
});

test('単体ページだけがz12・z13・z14を選べ、各版で同じ中心地点を保つ', () => {
  assert.match(html, /const SUPPORTED_STANDALONE_ZOOMS = new Set\(\[12, 13, 14\]\)/);
  assert.match(html, /const TILE_ZOOM = !EMBEDDED && SUPPORTED_STANDALONE_ZOOMS\.has\(requestedTileZoom\)/);
  assert.match(html, /const ZOOM_RATIO_FROM_Z14 = 2 \*\* \(DEFAULT_TILE_ZOOM - TILE_ZOOM\)/);
  assert.match(html, /x:\(DEFAULT_Z14_TILE\.x \+ \.5\) \/ ZOOM_RATIO_FROM_Z14/);
  assert.match(html, /const viewOffset = \{ \.\.\.DEFAULT_VIEW_OFFSET \}/);
  assert.match(html, /dataset\.tileZoom = String\(TILE_ZOOM\)/);
  assert.match(html, /tileZoom:TILE\.z/);
});

test('道路は元形状を1論理px単位で直接描画する', () => {
  assert.match(html, /const CANONICAL_TRANSPORT_RULES = LAYER_ASSET_CATALOG\.transportRules/);
  assert.match(html, /rule\.renderer === 'direct'/);
  assert.match(html, /width:rule\.logicalWidth \* SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /function drawSmoothRoadLayer\(option, bridge = false\)/);
  assert.match(html, /Math\.round\(x \/ 2\) \* 2/);
  assert.match(html, /if \(SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option\)/);
  assert.match(html, /if \(SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option, true\)/);
});

test('単体ページの生活道路と歩道・小径は各描画モードの最小幅にする', () => {
  assert.match(html, /const STANDALONE_MINIMUM_MINOR_ROUTES = !EMBEDDED/);
  assert.match(html, /const MINIMUM_ROUTE_SCENE_WIDTH = SCENE_PIXELS_PER_LOGICAL_PIXEL/);
  assert.match(html, /if\(EMBEDDED && option === 'localRoads'\)/);
  assert.match(html, /canonical\.width=14/);
  assert.match(html, /canonical\.casing=2/);
  assert.match(html, /\['localRoads','paths'\]\.includes\(routeOption\)/);
  assert.match(html, /minimumMinorRoute \? 1 : \(thick \? 2 : 1\) \* CELL_DETAIL_SCALE/);
  assert.match(html, /if\(EMBEDDED\) return false;[\s\S]*?drawStandardTransportCell/);
  assert.match(html, /minorRoutes:\{[\s\S]*?standaloneMinimum:STANDALONE_MINIMUM_MINOR_ROUTES/);
  assert.match(html, /localRoadWidth:CELL_ONLY_MODE[\s\S]*?pathWidth:CELL_ONLY_MODE/);
});

test('鉄道は本番と同じタイル模様を使う', () => {
  assert.match(html, /LAYER_ASSET_CATALOG\.drawStandardTransportCell/);
  assert.match(html, /if\(EMBEDDED\) return false/);
  assert.match(html, /case ID\.RAIL:[\s\S]*?const TIE = [\s\S]*?if \(con\.L\) TIE/);
  assert.doesNotMatch(html, /repeatDecoration|drawRepeatedDecoration/);
});

test('1マップ・2マップ・4マップは共通の論理ピクセル描画エンジンを使う', () => {
  assert.match(oneMap, /variants\/map-02-refined\.html\?embedded=1/);
  assert.equal((twoMap.match(/variants\/map-02-refined\.html\?embedded=1/g) || []).length, 2);
  assert.equal((fourMap.match(/map-02-refined\.html\?embedded=1/g) || []).length, 4);
});
