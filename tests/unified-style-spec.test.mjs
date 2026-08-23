import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const corridorRenderer = await readFile(new URL('../assets/corridor-renderer.js', import.meta.url), 'utf8');
const layerAssets = await readFile(new URL('../assets/layer-assets.js', import.meta.url), 'utf8');
const worldStyle = await readFile(new URL('../assets/world-style.js', import.meta.url), 'utf8');
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
  assert.match(html, /<script src="\.\.\/assets\/corridor-renderer\.js\?v=3"><\/script>/);
  assert.match(corridorRenderer, /function walkPixelLine\(/);
  assert.match(corridorRenderer, /function rasterizeLines\(/);
  assert.match(html, /function buildUnifiedCorridorMasks\(features, style\)/);
  assert.match(html, /return CORRIDOR_RENDERER\.buildMasks\(/);
  assert.match(html, /function renderUnifiedCorridor\(features, style, bridge = false/);
  assert.match(html, /const masks=CORRIDOR_RENDERER\.render\(/);
  assert.match(layerAssets, /corridorRenderer\.render\(overlay\.getContext\('2d'\)/);
  assert.match(html, /const CANONICAL_CORRIDOR_RULES = LAYER_ASSET_CATALOG\.corridorRules/);
  assert.match(html, /const WORLD_CORRIDOR_RULES = Object\.freeze/);
  assert.match(html, /WORLD_STYLE_MODE \? WORLD_STYLE\.corridor\[id\] \|\| \{\} : \{\}/);
  assert.match(spec, /rivers:WORLD_CORRIDOR_RULES\.rivers/);
  assert.match(spec, /localRoads:WORLD_CORRIDOR_RULES\.localRoads/);
  assert.match(spec, /rail:WORLD_CORRIDOR_RULES\.rail/);
  assert.match(corridorRenderer, /dx\*dx\+dy\*dy<=amount\*amount/);
  assert.match(corridorRenderer, /const centerPhase=new Uint32Array/);
  assert.match(html, /drawUnifiedCorridorLayer\(option, true\)/);
  assert.doesNotMatch(html, /function rasterizeUnifiedLineFeatures/);
});

test('RailSkinの路盤textureは描画時もworld座標へ固定する', () => {
  assert.match(html, /CORRIDOR_RENDERER\.render\(unifiedCorridorContext,\{[\s\S]*?textureAt:worldLogicalPoint,[\s\S]*?preparedMasks,/);
});

test('鉄道らしさは外形ではなくcorridor内部スキンで描く', () => {
  assert.match(corridorRenderer, /function paintRail\(image,masks,style,width,height\)/);
  assert.match(corridorRenderer, /const nearestCenter=new Int32Array/);
  assert.match(corridorRenderer, /const centerTangentX=new Float32Array/);
  assert.match(corridorRenderer, /nearestPerpendicular\[candidate\]=Math\.abs/);
  assert.match(corridorRenderer, /phase\[centerIndex\]%tiePeriod===0/);
  assert.match(corridorRenderer, /Math\.abs\(nearestPerpendicular\[index\]-railOffset\)<=railTolerance/);
  assert.match(corridorRenderer, /paintPixel\(image,index,style\.tie\)/);
  assert.match(corridorRenderer, /paintPixel\(image,index,style\.rail\)/);
  assert.match(corridorRenderer, /function paintRailBedTexture\(image,masks,style,width,height,textureAt\)/);
  assert.match(corridorRenderer, /paintRailBedTexture\(image,masks,style,width,height,textureAt\)/);
  assert.match(corridorRenderer, /paintRail\(image,masks,style,width,height\)/);
  assert.match(html, /textureAt:worldLogicalPoint/);
});

test('POIはprofileに応じてproduction互換radiusと実測boundsを切り替える', () => {
  assert.match(spec, /renderer:'poi-asset'/);
  assert.match(spec, /geometrySource:'resolver-source-world-point'/);
  assert.match(spec, /anchorSource:'poi-asset-metadata'/);
  assert.match(spec, /boundsSource:'poi-asset-measurement'/);
  assert.match(spec, /sizeTiers:Object\.freeze\(\['S','M','L'\]\)/);
  assert.match(html, /drawSprite\(spriteFor\(p\.props, p\.displayAssetSize \|\| p\.assetSize \|\| p\.size, p\.variant, p\.spriteKey\), p\.pt\[0\], p\.pt\[1\], p\)/);
  assert.match(html, /drawPatternMarker\(p, cx, cy, visualScale\)/);
  assert.match(html, /drawAuxiliaryAssets\(p, cx, cy\)/);
  assert.match(html, /WORLD_STYLE\.symbol\.collisionBounds === 'poi-asset-measured-bounds'/);
  assert.match(html, /sourceAnchored:WORLD_STYLE_MODE[\s\S]*WORLD_STYLE\.symbol\.sourceAnchored !== false/);
  assert.match(html, /symbolCollisionBounds:WORLD_STYLE_MODE[\s\S]*WORLD_STYLE\.symbol\.collisionBounds/);
  assert.match(html, /RESOLVER\.assetCollisionGeometry\(/);
  assert.match(html, /anchorMode:'source-point'/);
  assert.match(html, /sourceCoordinateMismatches:resolvedView\.facilities\.filter/);
  assert.match(html, /decisionFingerprint/);
  assert.doesNotMatch(html, /props\.icon_anchor_candidates/);
  assert.doesNotMatch(html, /function drawUnifiedPoiSymbol\(item\)/);
});

test('POIの地理判定とprofile別密度・anchor条件をresolverへ集約する', () => {
  assert.match(spec, /selectionAuthority:'facility-resolver-world-style'/);
  assert.match(html, /RESOLVER\.selectViewportIcons\(poiSourceFacilities, WORLD_STYLE\.density\)/);
  assert.match(html, /WORLD_STYLE\.symbol\.minimumAssetSizeByRole\[item\.semanticRole\]/);
  assert.match(html, /displayAssetSize:worldStyleDisplayAssetSize\(item\)/);
  assert.match(html, /const drawnIcons = viewportIconSelection\.selected\.map/);
  assert.match(html, /\.\.\.viewportIconSelection\.rejected/);
  assert.match(html, /WORLD_STYLE\.profileKind === 'production-copy'[\s\S]*'production-copy-unbounded'[\s\S]*'resolver-world-style-density-budget'/);
  assert.doesNotMatch(html, /function selectUnifiedPoiSymbols\(items\)/);
  assert.doesNotMatch(html, /unifiedSymbolKeys/);
});

test('固定compositorは地表corridorを建物の下、橋を建物の上へ置く', () => {
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE && STANDALONE_STYLE_SPEC\.corridor\[option\]\) continue/);
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE\)\{[\s\S]*drawUnifiedCorridorLayer\(option\);[\s\S]*`Z2:ground-corridor:\$\{option\}`/);
  assert.match(worldStyle, /'area','ground-corridor','building','structure','bridge','object','marker','dot-cluster'/);
  assert.match(html, /corridorRenderer:STANDALONE_UNIFIED_STYLE \? 'continuous-distance-mask'/);
  assert.match(html, /corridorPhase:STANDALONE_UNIFIED_STYLE \? 'source-line-distance'/);
  assert.doesNotMatch(html, /function displaceStandaloneBuildingsFromRoads/);
});

test('POI Asset Contractのroleが固定semantic z-orderを決め、座標移動では解決しない', () => {
  assert.match(html, /function drawPoiStructures\(\)/);
  assert.match(html, /function drawPoiOverlays\(\)/);
  const overlayStart = html.indexOf('function drawPoiOverlays(){');
  const overlayEnd = html.indexOf('function drawCellPoi(){', overlayStart);
  const overlays = html.slice(overlayStart, overlayEnd);
  assert.match(overlays, /drawPoiIcons\(\['object'\]\);[\s\S]*drawPoiIcons\(\['marker'\]\);/);
  assert.match(overlays, /WORLD_STYLE\.density\.drawDotsByDefault[\s\S]*drawDots\(\)/);
  assert.match(overlays, /WORLD_STYLE\.density\.drawClustersByDefault[\s\S]*drawClusters\(\)/);
  assert.match(html, /dots:\(\) => \{[\s\S]*drawDots\(hiddenPois\);[\s\S]*drawClusters\(\);/);
  assert.match(html, /drawUnifiedCorridorLayer\(option\);[\s\S]*Z2:ground-corridor:[\s\S]*drawStandalonePreciseBuildings\([\s\S]*drawPoiStructures\(\)/);
  assert.match(html, /poi:STANDALONE_LANDMARK_MODE[\s\S]*drawStandaloneLandmarkBuildings[\s\S]*STANDALONE_UNIFIED_STYLE \? drawPoiOverlays : drawPoi/);
  assert.doesNotMatch(html, /displace.*Poi|shift.*Poi|move.*Poi/i);
});

test('WorldStyleの見た目変更はstandalone game profileだけに閉じる', () => {
  assert.match(html, /const WORLD_STYLE_MODE = !EMBEDDED && !CELL_ONLY_MODE && !STUDY_MODE/);
  assert.match(html, /outline:WORLD_STYLE_MODE \? WORLD_STYLE\.palette\.outline : '#302838'/);
  assert.match(html, /!WORLD_STYLE_MODE \|\| WORLD_STYLE\.symbol\.decorateStructures/);
  assert.match(html, /!WORLD_STYLE_MODE \|\| WORLD_STYLE\.symbol\.auxiliaryStructures/);
  assert.match(html, /const STUDY_MODE = EMBEDDED[\s\S]*PAGE_PARAMS\.get\('layers'\) !== 'manual'[\s\S]*PAGE_PARAMS\.get\('layers'\) === 'study'/);
});
