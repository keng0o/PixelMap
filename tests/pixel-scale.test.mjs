import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const worldStyle = await readFile(new URL('../assets/world-style.js', import.meta.url), 'utf8');
const oneMap = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const twoMap = await readFile(new URL('../compare.html', import.meta.url), 'utf8');
const fourMap = await readFile(new URL('../variants/height-stack-four-map.html', import.meta.url), 'utf8');
globalThis.window=globalThis;
await import('../assets/world-style.js');
const comparisonStyle=globalThis.PixelMapWorldStyles.productionComparisonZ14;

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

test('standalone z14 POCは本番copy profileを既定にし、本番iframeは従来条件を維持する', () => {
  assert.match(html, /const WORLD_STYLE_PROFILE = PAGE_PARAMS\.get\('profile'\) === 'reference'/);
  assert.match(html, /const WORLD_STYLE = window\.PixelMapWorldStyles\[WORLD_STYLE_PROFILE\]/);
  assert.match(html, /const requestedPatternId = String\(PAGE_PARAMS\.get\('pattern'\) \|\| \(EMBEDDED \? '07' : WORLD_STYLE\.patternId\)\)\.padStart\(2, '0'\)/);
  assert.equal(comparisonStyle.patternId,'07');
  assert.match(worldStyle, /const productionComparisonZ14/);
  assert.match(html, /const WORLD_STYLE_MODE = !EMBEDDED && !CELL_ONLY_MODE && !STUDY_MODE/);
  assert.match(html, /dataset\.worldStyle = WORLD_STYLE_MODE \? WORLD_STYLE\.id : 'none'/);
  assert.match(html, /dataset\.mapMode = 'production'/);
  assert.match(html, /dataset\.assetTaste = 'reference'/);
  assert.doesNotMatch(html, /TEST_MODE|data-map-mode="test"|TEST_POP|TEST_TRANSPORT/);
});

test('POCの地理精度評価はstandalone・本番ともz14に固定する', () => {
  assert.match(html, /const DEFAULT_TILE_ZOOM = 14/);
  assert.match(html, /const TILE_ZOOM = DEFAULT_TILE_ZOOM/);
  assert.doesNotMatch(html, /SUPPORTED_STANDALONE_ZOOMS|requestedTileZoom/);
  assert.match(html, /const DEFAULT_Z14_TILE = \{ x:14549, y:6460 \}/);
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

test('test用RailSkinは本番セル値のcopyをcontinuous rendererへ渡す', () => {
  assert.deepEqual(comparisonStyle.corridor.rail,{
    width:8,edgeWidth:0,fill:'#a8a098',pattern:'rail',
    rail:'#404048',tie:'#786048',railOffset:2,railThickness:2,tiePeriod:4,sourceCellWidth:8,
    bedTexture:{
      period:8,dark:'#888078',light:'#c0b8b0',
      darkPixels:[[1,2],[5,4],[3,6]],lightPixels:[[6,1],[0,5]],
    },
  });
  assert.match(html, /rail:WORLD_CORRIDOR_RULES\.rail/);
  assert.match(html, /drawUnifiedCorridorLayer\(option\)/);
  assert.match(html, /textureAt:worldLogicalPoint/);
  assert.match(html, /if\(EMBEDDED\) return false/);
});

test('production比較profileのBuildingSkinは本番8px建物チップをtest側だけで再現する',()=>{
  assert.equal(comparisonStyle.building.renderer,'production-cell-copy');
  assert.equal(comparisonStyle.building.cellSize,8);
  assert.match(html,/const STANDALONE_PRECISE_BUILDINGS = !EMBEDDED && !CELL_ONLY_MODE &&[\s\S]*WORLD_STYLE\.building\?\.renderer !== 'production-cell-copy'/);
  assert.match(html,/buildingAppearanceForActiveProfile/);
});

test('1マップ・2マップ・4マップは共通の論理ピクセル描画エンジンを使う', () => {
  assert.match(oneMap, /variants\/map-02-refined\.html\?embedded=1/);
  assert.equal((twoMap.match(/variants\/map-02-refined\.html\?embedded=1/g) || []).length, 2);
  assert.equal((fourMap.match(/map-02-refined\.html\?embedded=1/g) || []).length, 4);
});
