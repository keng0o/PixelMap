import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.window = globalThis;
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
  assert.equal(byId.motorways.metric.lineWidth,14);
  assert.equal(byId.rivers.metric.lineWidth,1.4);
  assert.equal(byId.roadTunnels.metric.lineWidth,2.5);
  assert.equal(byId.transportationOther.metric.lineWidth,2);
  assert.equal(byId.transportationOther.metric.kind,'cell-route');
  assert.equal(byId.rail.metric.kind,'cell-route');
  assert.equal(byId.rail.metric.railWidth,1);
  assert.equal(byId.rail.metric.railCount,2);
  assert.equal(byId.waterwayOther.metric.lineWidth,1);
  assert.equal(byId.buildings.metric.kind,'variable');
  assert.equal(byId.stationNames.metric.kind,'variable');
  assert.equal(byId.dots.metric.label,'7×7 px DOT');
});

test('交通レイヤーの寸法・色・描画方式はアセットカタログを正典にする', async () => {
  const html = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  assert.equal(catalog.transportRules.localRoads.renderer,'direct');
  assert.equal(catalog.transportRules.localRoads.logicalWidth,1);
  assert.equal(catalog.transportRules.rail.renderer,'rail-cell');
  assert.equal(catalog.transportRules.rail.cellSize,8);
  assert.match(html, /<script src="\.\.\/assets\/layer-assets\.js"><\/script>/);
  assert.match(html, /const CANONICAL_TRANSPORT_RULES = LAYER_ASSET_CATALOG\.transportRules/);
  assert.match(html, /LAYER_ASSET_CATALOG\.drawStandardTransportCell/);
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
