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
  assert.match(html, /function drawDirectTransportLayer\(option, bridge = false\)/);
  assert.match(html, /Math\.round\(x \/ 2\) \* 2/);
  assert.match(html, /if \(directTransport\) drawDirectTransportLayer\(option\)/);
  assert.match(html, /if \(directTransport\) drawDirectTransportLayer\(option, true\)/);
});

test('テストページの交通線は種別と橋を問わず表示4px・外周1pxに揃える', () => {
  assert.match(html, /const TEST_TRANSPORT_SCENE_WIDTH = 8/);
  assert.match(html, /const TEST_TRANSPORT_SCENE_CASING = 2/);
  assert.match(html, /const width = directTestTransport \? TEST_TRANSPORT_SCENE_WIDTH : style\.width \+ bridgeWidth/);
  assert.match(html, /const casing = directTestTransport \? TEST_TRANSPORT_SCENE_CASING : style\.casing/);
  assert.match(html, /const areaCasing = directTestTransport\s*\? TEST_TRANSPORT_SCENE_CASING/);
});

test('テストページでは道路を例外にせず交通線すべてを共通レンダラーへ通す', () => {
  for (const option of ['paths','tracks','raceways','ferries','piers','rail','subway','aerialways',
    'localRoads','regionalRoads','majorRoads','motorways','transportationOther']){
    assert.match(html, new RegExp(`['"]${option}['"]`), option);
  }
  assert.match(html, /TEST_MODE\s*\? DIRECT_TRANSPORT_OPTIONS\.has\(option\)\s*:\s*SMOOTH_ROAD_OPTIONS\.has\(option\)/);
  assert.doesNotMatch(html, /function drawSmoothRoadLayer/);
});

test('共通レンダラーの反復装飾で鉄道の枕木を線幅内に描く', () => {
  assert.match(html, /rail:\{ width:4, casing:2, fill:P\.tie, edge:P\.rail,[\s\S]*?repeatDecoration:\{ spacing:16, width:2, color:P\.rail \}/);
  assert.match(html, /const drawRepeatedDecoration = \(decoration, span\) =>/);
  assert.match(html, /const decorationSpan = Math\.max\([\s\S]*?width \+ casing \* 2 - ASSET_SCENE_PIXEL/);
  assert.match(html, /drawRepeatedDecoration\(style\.repeatDecoration, decorationSpan\)/);
});

test('1マップ・2マップ・4マップは共通の1px描画エンジンを使う', () => {
  assert.match(oneMap, /variants\/map-02-refined\.html\?embedded=1/);
  assert.equal((twoMap.match(/variants\/map-02-refined\.html\?embedded=1/g) || []).length, 2);
  assert.equal((fourMap.match(/map-02-refined\.html\?embedded=1/g) || []).length, 4);
});
