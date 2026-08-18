import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');

test('テスト用マップは1px版だけを提供する', () => {
  assert.match(html, /const REQUESTED_PIXEL_SCALE = 1/);
  assert.doesNotMatch(html, /PAGE_PARAMS\.get\('pixel'\) === '2'/);
  assert.match(html, /dataset\.pixelRequestedScale = String\(REQUESTED_PIXEL_SCALE\)/);
  assert.match(html, /pixelRequestedScale:REQUESTED_PIXEL_SCALE/);
});

test('1536pxシーンを768px論理ドット面へ最近傍で確定変換する', () => {
  assert.match(html, /const SCENE_SIZE = 1536/);
  assert.match(html, /const PRESENTATION_SIZE = SCENE_SIZE \/ 2/);
  assert.match(html, /presentationCtx\.imageSmoothingEnabled = false/);
  assert.match(html, /presentationCtx\.drawImage\([\s\S]*?SCENE_SIZE, SCENE_SIZE,[\s\S]*?PRESENTATION_SIZE, PRESENTATION_SIZE/);
});

test('施設の構成ドットはテストモードだけ2シーンpxへ固定する', () => {
  assert.match(html, /const spritePixelScale = TEST_MODE \? 2 : 3 \* visualScale/);
  assert.match(html, /ctx\.scale\(spritePixelScale, spritePixelScale\)/);
});

test('全アセットを1論理pxの共通グリッドで構成する', () => {
  assert.match(html, /const ASSET_SCENE_PIXEL = TEST_MODE \? 2 : 1/);
  assert.match(html, /function quantizeAssetRect\(x,y,w,h\)/);
  assert.match(html, /Math\.floor\(x\/ASSET_SCENE_PIXEL\)\*ASSET_SCENE_PIXEL/);
  assert.match(html, /Math\.ceil\(\(x\+w\)\/ASSET_SCENE_PIXEL\)\*ASSET_SCENE_PIXEL/);
  assert.match(html, /draw\(g, \(x,y,w,h,col\)=>fillAssetRect\(g,x,y,w,h,col\)\)/);
  assert.match(html, /if\(TEST_MODE\) document\.documentElement\.dataset\.assetPixelSize = '1'/);
  assert.match(html, /\.\.\.\(TEST_MODE \? \{[\s\S]*?assetLogicalPixel:1/);
});

test('本番埋め込みにはテスト用表示CSSを適用しない', () => {
  assert.match(html, /html\[data-map-mode="test"\] #map/);
  assert.doesNotMatch(html, /html\[data-map-mode="production"\][^{]*#map/);
});

test('テスト用道路は元形状を1論理px単位で直接描画する', () => {
  assert.match(html, /const SMOOTH_ROAD_OPTIONS = new Set\(\['localRoads','regionalRoads','majorRoads','motorways'\]\)/);
  assert.match(html, /function drawSmoothRoadLayer\(option, bridge = false\)/);
  assert.match(html, /Math\.round\(x \/ 2\) \* 2/);
  assert.match(html, /TEST_MODE && SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option\)/);
  assert.match(html, /TEST_MODE && SMOOTH_ROAD_OPTIONS\.has\(option\)\) drawSmoothRoadLayer\(option, true\)/);
});
