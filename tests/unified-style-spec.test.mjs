import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const corridorRenderer = await readFile(new URL('../assets/corridor-renderer.js', import.meta.url), 'utf8');
const layerAssets = await readFile(new URL('../assets/layer-assets.js', import.meta.url), 'utf8');
const specStart = html.indexOf('const STANDALONE_STYLE_SPEC = Object.freeze({');
const specEnd = html.indexOf('\nfunction T(draw)', specStart);
const spec = html.slice(specStart, specEnd);

test('統一Style Specはstandalone標準だけで有効になる', () => {
  assert.match(html, /const STANDALONE_UNIFIED_STYLE = !EMBEDDED && !CELL_ONLY_MODE/);
  assert.match(html, /document\.documentElement\.dataset\.styleModel = STANDALONE_UNIFIED_STYLE/);
  assert.match(html, /'geometry-skin-symbol-v1'/);
  assert.match(html, /: 'legacy'/);
});

test('描画プリミティブはarea・corridor・symbolの3種類に固定する', () => {
  assert.ok(specStart >= 0 && specEnd > specStart);
  assert.match(spec, /version:'geometry-skin-symbol\/1'/);
  assert.match(spec, /area:Object\.freeze\(/);
  assert.match(spec, /symbol:Object\.freeze\(/);
  assert.match(spec, /corridor:Object\.freeze\(/);
  assert.doesNotMatch(spec, /\b(?:width|edgeWidth|outlineWidth):\d+\.\d+/);
});

test('道路・鉄道・水路は同じ1論理px corridorマスク生成器を使う', () => {
  assert.match(html, /<script src="\.\.\/assets\/corridor-renderer\.js\?v=1"><\/script>/);
  assert.match(corridorRenderer, /function walkPixelLine\(/);
  assert.match(corridorRenderer, /function rasterizeLines\(/);
  assert.match(html, /function buildUnifiedCorridorMasks\(features, style\)/);
  assert.match(html, /return CORRIDOR_RENDERER\.buildMasks\(/);
  assert.match(html, /function renderUnifiedCorridor\(features, style, bridge = false/);
  assert.match(html, /const masks=CORRIDOR_RENDERER\.render\(/);
  assert.match(layerAssets, /corridorRenderer\.render\(overlay\.getContext\('2d'\)/);
  assert.match(html, /const CANONICAL_CORRIDOR_RULES = LAYER_ASSET_CATALOG\.corridorRules/);
  assert.match(spec, /rivers:CANONICAL_CORRIDOR_RULES\.rivers/);
  assert.match(spec, /localRoads:CANONICAL_CORRIDOR_RULES\.localRoads/);
  assert.match(spec, /rail:CANONICAL_CORRIDOR_RULES\.rail/);
  assert.match(corridorRenderer, /dx\*dx\+dy\*dy<=amount\*amount/);
  assert.match(corridorRenderer, /const centerPhase=new Uint32Array/);
  assert.match(html, /drawUnifiedCorridorLayer\(option, true\)/);
  assert.doesNotMatch(html, /function rasterizeUnifiedLineFeatures/);
});

test('鉄道らしさは外形ではなくcorridor内部スキンで描く', () => {
  assert.match(corridorRenderer, /function paintRail\(image,masks,style,width,height\)/);
  assert.match(corridorRenderer, /const nearestCenter=new Int32Array/);
  assert.match(corridorRenderer, /phase\[centerIndex\]%tiePeriod===0/);
  assert.match(corridorRenderer, /Math\.abs\(nearestDistance\[index\]-targetDistance\)<=tolerance/);
  assert.match(corridorRenderer, /paintPixel\(image,index,style\.tie\)/);
  assert.match(corridorRenderer, /paintPixel\(image,index,style\.rail\)/);
  assert.match(corridorRenderer, /if\(style\.pattern==='rail'\) paintRail/);
});

test('POIは既存RPGアセットのS・M・Lと実測boundsを使う', () => {
  assert.match(spec, /renderer:'poi-asset'/);
  assert.match(spec, /geometrySource:'resolver-source-world-point'/);
  assert.match(spec, /anchorSource:'poi-asset-metadata'/);
  assert.match(spec, /boundsSource:'poi-asset-measurement'/);
  assert.match(spec, /sizeTiers:Object\.freeze\(\['S','M','L'\]\)/);
  assert.match(html, /drawSprite\(spriteFor\(p\.props, p\.assetSize \|\| p\.size, p\.variant, p\.spriteKey\), p\.pt\[0\], p\.pt\[1\], p\)/);
  assert.match(html, /drawPatternMarker\(p, cx, cy, visualScale\)/);
  assert.match(html, /drawAuxiliaryAssets\(p, cx, cy\)/);
  assert.match(html, /assetCatalog:STANDALONE_UNIFIED_STYLE \? POI_SPRITE_CATALOG : null/);
  assert.match(html, /sourceAnchored:STANDALONE_UNIFIED_STYLE/);
  assert.match(html, /symbolCollisionBounds:STANDALONE_UNIFIED_STYLE \? 'poi-asset-measured-bounds'/);
  assert.match(html, /RESOLVER\.assetCollisionGeometry\(/);
  assert.match(html, /anchorMode:'source-point'/);
  assert.match(html, /sourceCoordinateMismatches:resolvedView\.facilities\.filter/);
  assert.match(html, /decisionFingerprint/);
  assert.doesNotMatch(html, /props\.icon_anchor_candidates/);
  assert.doesNotMatch(html, /function drawUnifiedPoiSymbol\(item\)/);
});

test('POI表示採用はfacility-resolverだけが決め、map側で再選抜しない', () => {
  assert.match(spec, /selectionAuthority:'facility-resolver'/);
  assert.match(html, /const drawnIcons = facilitiesInView\.filter\(p => p\.representation === 'icon'\)/);
  assert.match(html, /drawDots\(\);[\s\S]*drawClusters\(\);/);
  assert.match(html, /symbolSelectionOverride:false/);
  assert.doesNotMatch(html, /function selectUnifiedPoiSymbols\(items\)/);
  assert.doesNotMatch(html, /unifiedSymbolKeys/);
});

test('固定compositorは衝突判定に依存せず全areaの後へ全corridorを描く', () => {
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE && STANDALONE_STYLE_SPEC\.corridor\[option\]\) continue/);
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE\)\{[\s\S]*drawUnifiedCorridorLayer\(option\);[\s\S]*`Z3:corridor:\$\{option\}`/);
  assert.match(html, /\? \['area','structure','corridor','bridge','object','marker','dot-cluster'\]/);
  assert.match(html, /corridorRenderer:STANDALONE_UNIFIED_STYLE \? 'continuous-distance-mask'/);
  assert.match(html, /corridorPhase:STANDALONE_UNIFIED_STYLE \? 'source-line-distance'/);
  assert.doesNotMatch(html, /function displaceStandaloneBuildingsFromRoads/);
});

test('POI Asset Contractのroleが固定semantic z-orderを決め、座標移動では解決しない', () => {
  assert.match(html, /function drawPoiStructures\(\)/);
  assert.match(html, /function drawPoiOverlays\(\)/);
  assert.match(html, /drawPoiIcons\(\['object'\]\);[\s\S]*drawPoiIcons\(\['marker'\]\);[\s\S]*drawDots\(\);[\s\S]*drawClusters\(\);/);
  assert.match(html, /drawPoiStructures\(\);[\s\S]*Z2:symbol:structure[\s\S]*drawUnifiedCorridorLayer\(option\)/);
  assert.match(html, /poi:STANDALONE_UNIFIED_STYLE \? drawPoiOverlays : drawPoi/);
  assert.doesNotMatch(html, /displace.*Poi|shift.*Poi|move.*Poi/i);
});
