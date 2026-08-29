import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
const fourMapHtml = await readFile(new URL('../variants/height-stack-four-map.html', import.meta.url), 'utf8');

test('standaloneと本番1・2マップは7種類の素材模様を初期ONの独立チェックとして表示する', () => {
  const expected = [
    ['dirtGrain','土地：土の粒'],
    ['pavingJoints','舗装：タイル・舗装継ぎ目'],
    ['sandGrain','砂地：短い砂粒'],
    ['roadGrain','道路：舗装面の小さな粒'],
    ['pathGrain','小径：踏み跡の粒'],
    ['roofTexture','屋根の素材模様'],
    ['gravelTexture','砂利模様'],
  ];
  assert.match(html, /id="materialPatternCategory"/);
  for (const [id,label] of expected){
    assert.match(
      html,
      new RegExp(`data-material-pattern="${id}" checked>${label}`),
      `${label} の独立チェック`,
    );
  }
  assert.match(html, /materialPatternCategory\.hidden = SHARED_CONTROLS/);
  assert.match(html, /return input\?\.checked !== false/);
});

test('素材チェックはレイヤー順を変えず再描画し、共有設定では状態を通知する', () => {
  assert.match(html, /const materialPatternInputs = \[\.\.\.document\.querySelectorAll\('\[data-material-pattern\]'\)\]/);
  assert.match(html, /for \(const input of materialPatternInputs\)[\s\S]*?input\.addEventListener\('change',[\s\S]*?render\(\)[\s\S]*?publishLayerState\(\)/);
  assert.doesNotMatch(html, /data-material-pattern[^>]*data-category-item/);
  assert.match(html, /const master = panel\.querySelector\('\[data-category-toggle\]'\);\s*if \(!master\) continue;/);
});

test('4マップは素材模様を外側の共通パネルから4地点へ同期する', () => {
  assert.match(html, /materialPatterns:materialPatternInputs\.filter\(input => input\.checked\)/);
  assert.match(html, /materialPatternCatalog:materialPatternInputs\.map\(input => \(\{/);
  assert.match(html, /if \(Array\.isArray\(state\.materialPatterns\)\)/);
  assert.match(fourMapHtml, /id="materialPatternGroup"/);
  assert.match(fourMapHtml, /id="materialPatternControls"/);
  assert.match(fourMapHtml, /materialPatterns:\[\.\.\.activeMaterialPatterns\]/);
  assert.match(fourMapHtml, /function buildMaterialPatternControls\(patterns\)/);
  assert.match(fourMapHtml, /input\.dataset\.materialPattern = item\.pattern/);
  assert.match(fourMapHtml, /broadcastLayers\(\)/);
});

test('土・舗装・砂・道路・小径・砂利は基本色を残す無地チップへ個別に切り替わる', () => {
  for (const tile of ['dirtPlain','pavePlain','sandPlain','roadPlain','roadMajorPlain','highwayPlain','pathPlain','gravelPlain'])
    assert.match(html, new RegExp(`TILES\\.${tile} = T`), tile);
  for (const pattern of ['dirtGrain','pavingJoints','sandGrain','roadGrain','pathGrain','gravelTexture'])
    assert.match(html, new RegExp(`materialPatternEnabled\\('${pattern}'\\)`), pattern);
});

test('屋根の素材チェックは輪郭や設備とは独立して疎な粒と瓦継ぎ目だけを抑止する', () => {
  assert.match(html, /materialPatternEnabled\('roofTexture'\) &&\s*positiveModulo\(wx \* 3 \+ wy \* 5 \+ buildingIndex, 17\) === 0/);
  assert.match(html, /materialPatternEnabled\('roofTexture'\) &&\s*positiveModulo\(wx \* 3 \+ wy \* 5 \+ group\.bi, 17\) === 0/);
  assert.match(html, /if \(materialPatternEnabled\('roofTexture'\)\)\{[\s\S]*?瓦の継ぎ目/);
});

test('砂利チェックは全Webマップの鉄道路盤粒だけを消しレールを維持する', async () => {
  assert.match(html, /bedTexture:null/);
  assert.match(html, /materialTexture:materialPatternEnabled\('gravelTexture'\)/);

  globalThis.window = globalThis;
  await import('../assets/asset-family-registry.js');
  await import('../assets/corridor-renderer.js');
  await import('../assets/layer-assets.js');
  const draw = globalThis.PixelMapLayerAssets.drawStandardTransportCell;
  const fills = materialTexture => {
    const calls = [];
    const ctx = {
      fillStyle:'',
      fillRect(x,y,w,h){ calls.push([x,y,w,h,this.fillStyle]); },
    };
    draw(ctx,'rail',0,0,{L:true},{scale:1,materialTexture});
    return calls;
  };
  assert.ok(fills(true).length > fills(false).length, '砂利粒だけ描画数が減る');
  assert.ok(fills(false).some(call => call[4] === '#404048'), 'レールは残る');
  assert.ok(fills(false).some(call => call[4] === '#786048'), '枕木は残る');
});
