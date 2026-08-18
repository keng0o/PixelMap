import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const oneMap = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const twoMap = await readFile(new URL('../compare.html', import.meta.url), 'utf8');
const fourMap = await readFile(new URL('../variants/height-stack-four-map.html', import.meta.url), 'utf8');

test('全マップは1px版だけを提供する', () => {
  assert.match(html, /const REQUESTED_PIXEL_SCALE = 1/);
  assert.doesNotMatch(html, /PAGE_PARAMS\.get\('pixel'\) === '2'/);
  assert.match(html, /dataset\.pixelRequestedScale = String\(REQUESTED_PIXEL_SCALE\)/);
  assert.match(html, /pixelRequestedScale:REQUESTED_PIXEL_SCALE/);
});

test('全マップで1536pxシーンを768px論理ドット面へ最近傍変換する', () => {
  assert.match(html, /const SCENE_SIZE = 1536/);
  assert.match(html, /const PRESENTATION_SIZE = SCENE_SIZE \/ 2/);
  assert.match(html, /cv\.width = cv\.height = PRESENTATION_SIZE/);
  assert.match(html, /const sceneCanvas = document\.createElement\('canvas'\)/);
  assert.match(html, /presentationCtx\.imageSmoothingEnabled = false/);
  assert.match(html, /presentationCtx\.drawImage\([\s\S]*?SCENE_SIZE, SCENE_SIZE,[\s\S]*?PRESENTATION_SIZE, PRESENTATION_SIZE/);
});

test('施設の構成ドットは全マップで2シーンpxへ固定する', () => {
  assert.match(html, /const spritePixelScale = 2/);
  assert.match(html, /ctx\.scale\(spritePixelScale, spritePixelScale\)/);
});

test('全アセットを1論理pxの共通グリッドで構成する', () => {
  assert.match(html, /const ASSET_SCENE_PIXEL = 2/);
  assert.match(html, /function quantizeAssetRect\(x,y,w,h\)/);
  assert.match(html, /Math\.floor\(x\/ASSET_SCENE_PIXEL\)\*ASSET_SCENE_PIXEL/);
  assert.match(html, /Math\.ceil\(\(x\+w\)\/ASSET_SCENE_PIXEL\)\*ASSET_SCENE_PIXEL/);
  assert.match(html, /draw\(g, \(x,y,w,h,col\)=>fillAssetRect\(g,x,y,w,h,col\)\)/);
  assert.match(html, /document\.documentElement\.dataset\.assetPixelSize = '1'/);
  assert.match(html, /assetLogicalPixel:1/);
});

test('本番埋め込みにはテスト用表示CSSを適用しない', () => {
  assert.match(html, /html\[data-map-mode="test"\] #map/);
  assert.doesNotMatch(html, /html\[data-map-mode="production"\][^{]*#map/);
});

test('全マップの道路は元形状を1論理px単位で直接描画する', () => {
  assert.match(html, /const SMOOTH_ROAD_OPTIONS = new Set\(\['localRoads','regionalRoads','majorRoads','motorways'\]\)/);
  assert.match(html, /function drawSmoothRoadLayer\(option, bridge = false\)/);
  assert.match(html, /Math\.round\(x \/ 2\) \* 2/);
  assert.match(html, /if \(SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option\)/);
  assert.match(html, /if \(SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option, true\)/);
});

test('テストページの道路は種別と橋を問わず表示8px・外周1pxに揃える', () => {
  assert.match(html, /const TEST_ROAD_SCENE_WIDTH = 16/);
  assert.match(html, /const TEST_ROAD_SCENE_CASING = 2/);
  assert.match(html, /const width = TEST_MODE \? TEST_ROAD_SCENE_WIDTH : style\.width \+ \(bridge \? 4 : 0\)/);
  assert.match(html, /const casing = TEST_MODE \? TEST_ROAD_SCENE_CASING : style\.casing/);
  assert.match(html, /const areaCasing = TEST_MODE \? TEST_ROAD_SCENE_CASING : style\.casing \+ \(bridge \? 2 : 0\)/);
});

test('1マップ・2マップ・4マップは共通の1px描画エンジンを使う', () => {
  assert.match(oneMap, /variants\/map-02-refined\.html\?embedded=1/);
  assert.equal((twoMap.match(/variants\/map-02-refined\.html\?embedded=1/g) || []).length, 2);
  assert.equal((fourMap.match(/map-02-refined\.html\?embedded=1/g) || []).length, 4);
});
