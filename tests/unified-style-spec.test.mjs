import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
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
  assert.match(html, /function walkLogicalPixelLine\(/);
  assert.match(html, /function buildUnifiedCorridorMasks\(features, style\)/);
  assert.match(html, /function renderUnifiedCorridor\(features, style, bridge = false/);
  assert.match(spec, /rivers:Object\.freeze\(\{source:'waterway'/);
  assert.match(spec, /localRoads:Object\.freeze\(\{source:'transportation'/);
  assert.match(spec, /rail:Object\.freeze\(\{source:'transportation'.*pattern:'rail'/);
  assert.match(html, /drawUnifiedCorridorLayer\(option, true\)/);
});

test('鉄道らしさは外形ではなくcorridor内部スキンで描く', () => {
  assert.match(html, /function paintUnifiedRailPattern\(image, masks, style\)/);
  assert.match(html, /if \(body\[target\]\) paintLogicalImagePixel\(image, target, style\.tie\)/);
  assert.match(html, /if \(body\[target\]\) paintLogicalImagePixel\(image, target, style\.rail\)/);
  assert.match(html, /bridgeStyle\.pattern === 'rail'/);
});

test('POIは大型建物スプライトではなく16論理pxの情報シンボルになる', () => {
  assert.match(spec, /symbol:Object\.freeze\(\{[\s\S]*size:16/);
  assert.match(spec, /anchor:'bottom-center'/);
  assert.match(html, /function drawUnifiedPoiSymbol\(item\)/);
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE\) drawUnifiedPoiSymbol\(p\)/);
  assert.match(html, /else drawSprite\(spriteFor\(p\.props, p\.size, p\.variant\)/);
  assert.match(html, /symbolRenderer:STANDALONE_UNIFIED_STYLE \? 'fixed-source-anchored'/);
});

test('POI表示採用は世界座標グリッド・優先度・安定IDで決定する', () => {
  assert.match(spec, /worldGridLogicalPixels:64/);
  assert.match(spec, /maximumPerWorldCell:1/);
  assert.match(spec, /minimumGapLogicalPixels:28/);
  assert.match(spec, /overflow:'hidden'/);
  assert.match(html, /function unifiedSymbolStableKey\(item\)/);
  assert.match(html, /function compareUnifiedSymbolStableKeys\(a, b\)/);
  assert.match(html, /function selectUnifiedPoiSymbols\(items\)/);
  assert.match(html, /Math\.floor\(item\.worldX \/ scenePerCell\)/);
  assert.match(html, /compareUnifiedSymbolStableKeys\(a, b\)/);
  assert.doesNotMatch(html, /unifiedSymbolStableKey\(a\)\.localeCompare/);
  assert.match(html, /if \(!STANDALONE_UNIFIED_STYLE\)\{[\s\S]*drawDots\(\);[\s\S]*drawClusters\(\);/);
});

test('固定compositorは衝突判定に依存せず全areaの後へ全corridorを描く', () => {
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE && STANDALONE_STYLE_SPEC\.corridor\[option\]\) continue/);
  assert.match(html, /if \(STANDALONE_UNIFIED_STYLE\)\{[\s\S]*drawUnifiedCorridorLayer\(option\);[\s\S]*`Z3:corridor:\$\{option\}`/);
  assert.match(html, /compositor:STANDALONE_UNIFIED_STYLE \? \['area','corridor','bridge','symbol'\]/);
  assert.doesNotMatch(html, /function displaceStandaloneBuildingsFromRoads/);
});
