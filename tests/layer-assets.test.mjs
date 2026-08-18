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
