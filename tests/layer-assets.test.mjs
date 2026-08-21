import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
await import('../assets/asset-family-registry.js');
await import('../assets/corridor-renderer.js');
await import('../assets/layer-assets.js');

const catalog = globalThis.PixelMapLayerAssets;

test('アセットページにマップの全62レイヤーが重複なく登録される', () => {
  assert.equal(catalog.layers.length, 62);
  assert.equal(new Set(catalog.layers.map(layer => layer.id)).size, 62);
  assert.equal(catalog.groups.length, 5);
  assert.equal(typeof catalog.render, 'function');
  assert.equal(typeof catalog.renderDetail, 'function');
  assert.equal(typeof catalog.drawStandardTransportCell, 'function');
  assert.equal(typeof catalog.transportRules, 'object');
  for(const layer of catalog.layers){
    assert.equal(typeof layer.metric?.label,'string',layer.id);
    assert.ok(layer.metric.width>0 && layer.metric.height>0,layer.id);
  }
});

test('レイヤー寸法は地図のタイル・線幅・可変種別を表す', () => {
  const byId=Object.fromEntries(catalog.layers.map(layer=>[layer.id,layer]));
  assert.deepEqual(
    byId.grass.metric,
    {kind:'tile',label:'16×16 px TILE',width:16,height:16},
  );
  assert.equal(byId.localRoads.metric.lineWidth,1);
  assert.equal(byId.motorways.metric.lineWidth,18);
  assert.equal(byId.rivers.metric.lineWidth,6);
  assert.equal(byId.roadTunnels.metric.lineWidth,3);
  assert.equal(byId.transportationOther.metric.lineWidth,2);
  assert.equal(byId.transportationOther.metric.kind,'corridor');
  assert.equal(byId.rail.metric.kind,'corridor');
  assert.equal(byId.rail.metric.lineWidth,9);
  assert.equal(byId.waterwayOther.metric.lineWidth,1);
  assert.deepEqual(byId.localRoads.assetFamilyIds,['road']);
  assert.ok(byId.localRoads.sourceTypes.includes('service'));
  assert.deepEqual(byId.paths.assetFamilyIds,['path']);
  assert.deepEqual(byId.rail.assetFamilyIds,['rail']);
  assert.deepEqual(byId.transportationOther.assetFamilyIds,['other']);
  assert.deepEqual(byId.roadTunnels.assetFamilyIds,['road','other']);
  assert.equal(byId.roadTunnels.stateModifier,'tunnel');
  assert.equal(byId.railTunnels.stateModifier,'tunnel');
  assert.equal(byId.buildings.metric.kind,'variable');
  assert.equal(byId.stationNames.metric.kind,'variable');
  assert.equal(byId.dots.metric.label,'7×7 px DOT');
});

test('交通レイヤーの寸法・色・描画方式はアセットカタログを正典にする', async () => {
  const [html,assetsHtml] = await Promise.all([
    readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8'),
    readFile(new URL('../assets.html', import.meta.url), 'utf8'),
  ]);
  assert.equal(catalog.transportRules.localRoads.renderer,'direct');
  assert.equal(catalog.transportRules.localRoads.logicalWidth,1);
  assert.equal(catalog.transportRules.rail.renderer,'rail-cell');
  assert.equal(catalog.transportRules.rail.cellSize,8);
  assert.equal(catalog.corridorContractVersion,'pixelmap-corridor-asset/1');
  assert.equal(catalog.corridorRendererVersion,'pixelmap-corridor-renderer/1');
  assert.equal(catalog.corridorRules.rail.renderer,'corridor-distance-mask');
  assert.equal(catalog.corridorRules.rail.pattern,'rail');
  assert.equal(catalog.corridorRules.rivers.source,'waterway');
  assert.equal(catalog.corridorRules.localRoads.source,'transportation');
  assert.match(html, /<script src="\.\.\/assets\/layer-assets\.js\?v=4"><\/script>/);
  assert.match(assetsHtml, /<script src="assets\/layer-assets\.js\?v=67"><\/script>/);
  assert.match(html, /<script src="\.\.\/assets\/corridor-renderer\.js\?v=1"><\/script>/);
  assert.match(html, /const CANONICAL_TRANSPORT_RULES = LAYER_ASSET_CATALOG\.transportRules/);
  assert.match(html, /const CANONICAL_CORRIDOR_RULES = LAYER_ASSET_CATALOG\.corridorRules/);
  assert.match(html, /LAYER_ASSET_CATALOG\.drawStandardTransportCell/);
});

test('全プレビューは8px・16pxの共通グリッドを同じ縮尺で重ねる', async () => {
  const [html,js,css]=await Promise.all([
    readFile(new URL('../assets.html',import.meta.url),'utf8'),
    readFile(new URL('../assets/catalog.js',import.meta.url),'utf8'),
    readFile(new URL('../assets/catalog.css',import.meta.url),'utf8'),
  ]);
  assert.match(html,/共通グリッド：細線8px／太線16px/);
  assert.match(js,/function makePreviewScaleGrid\(canvas\)/);
  assert.equal((js.match(/preview\.append\(canvas,makePreviewScaleGrid\(canvas\)\)/g)||[]).length,2);
  assert.match(js,/8\/canvas\.width\*100/);
  assert.match(js,/16\/canvas\.height\*100/);
  assert.match(css,/\.preview-scale-grid\{/);
  assert.match(css,/var\(--grid-8-x\)/);
  assert.match(css,/var\(--grid-16-y\)/);
});

test('マップの表示設定とレイヤーアセット一覧のID・名称が完全一致する', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  const controls = [...html.matchAll(
    /<label><input type="checkbox" id="tgl([^"]+)" data-category-item>([^<]+)<\/label>/g,
  )].map(match => ({
    id:match[1][0].toLowerCase() + match[1].slice(1),
    label:match[2],
  }));
  assert.deepEqual(
    catalog.layers.map(({ id,label }) => ({ id,label })),
    controls,
  );
});
