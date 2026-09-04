import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../variants/map-09-top-down-game.html', import.meta.url), 'utf8');

test('独立pageは全画面Canvas・現在地・一時status・帰属だけを持つ', () => {
  assert.match(page, /<canvas[^>]+data-top-down-map/);
  assert.match(page, /<button[^>]+data-current-location[^>]+aria-label="現在地へ移動"/);
  assert.match(page, /data-map-status/);
  assert.match(page, /data-map-status-text/);
  assert.match(page, /data-map-retry/);
  assert.match(page, /©\s*<a[^>]+>OpenStreetMap contributors<\/a>/);
  assert.match(page, /OpenFreeMap/);
  assert.match(page, /OpenMapTiles/);
  assert.doesNotMatch(page, /<header|<nav|設定|方位|施設を選択/);
});

test('参考素材を含む4つの専用moduleだけを順に読み、map-02 profileへ依存しない', () => {
  const patterns = page.indexOf('../assets/top-down-game-patterns.js');
  const materials = page.indexOf('../assets/top-down-game-materials.js');
  const renderer = page.indexOf('../assets/top-down-game-renderer.js');
  const runtime = page.indexOf('../assets/top-down-game-map.js');
  assert.ok(patterns >= 0 && materials > patterns && renderer > materials && runtime > renderer);
  assert.doesNotMatch(page, /map-02-refined|profile=topdown-game|presentation=art/);
});

test('mobile safe area・44px以上の操作・focus・reduced motionを持つ', () => {
  assert.match(page, /width:\s*100vw/);
  assert.match(page, /height:\s*100dvh/);
  assert.match(page, /min-width:\s*48px/);
  assert.match(page, /min-height:\s*48px/);
  assert.match(page, /env\(safe-area-inset-right/);
  assert.match(page, /env\(safe-area-inset-bottom/);
  assert.match(page, /:focus-visible/);
  assert.match(page, /prefers-reduced-motion:\s*reduce/);
});

test('Canvasは北上固定・名称なし・屋根中心の契約を説明する', () => {
  assert.match(page, /aria-label="実地理を真上から描いた、名称表示のないゲーム風地図。ドラッグで移動できます"/);
  assert.match(page, /data-style="top-down-hand-drawn-game-v9"/);
  assert.match(page, /data-bearing="0"/);
});

test('参考素材5巡目のcache versionを全専用moduleへ揃える', () => {
  assert.equal((page.match(/reference-material-5/g) || []).length, 4);
});

test('map-02の明示profileだけが専用pageへ接続し、本番入口は新styleを参照しない', async () => {
  const standalone = await readFile(new URL('../variants/map-02-refined.html', import.meta.url), 'utf8');
  assert.match(standalone, /params\.get\('profile'\) !== 'topdown-game'/);
  assert.match(standalone, /params\.get\('presentation'\) !== 'art'/);
  assert.match(standalone, /new URL\('map-09-top-down-game\.html', location\.href\)/);
  for (const relative of [
    '../index.html',
    '../compare.html',
    '../four-maps.html',
    '../variants/height-stack-four-map.html',
  ]) {
    const contents = await readFile(new URL(relative, import.meta.url), 'utf8');
    assert.doesNotMatch(contents, /top-down-game|top-down-hand-drawn-game-v1/, relative);
  }
});
