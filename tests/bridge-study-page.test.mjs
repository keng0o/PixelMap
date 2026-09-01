import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('橋研究はコピーした専用ページと専用moduleだけへ隔離する',async()=>{
  const [study,source,index,compare,four,height]=await Promise.all([
    read('variants/map-08-bridge-study.html'),read('variants/map-02-refined.html'),
    read('index.html'),read('compare.html'),read('four-maps.html'),read('variants/height-stack-four-map.html'),
  ]);
  assert.match(study,/<title>PixelMap｜橋デザイン研究ページ<\/title>/);
  assert.match(study,/PixelMap｜橋デザイン研究・z\$\{TILE_ZOOM\}/);
  assert.match(study,/bridge-classifier\.js\?v=\d+/);
  assert.match(study,/bridge-renderer\.js\?v=\d+/);
  assert.match(study,/dataset\.bridgeStudy='test-only'/);
  assert.match(study,/BRIDGE_CLASSIFIER\.analyzeLayers/);
  assert.match(study,/BRIDGE_RENDERER\.prepare/);
  assert.match(study,/bridgeStudy:\{/);
  for(const [name,html] of [['source',source],['index',index],['compare',compare],['four',four],['height',height]]){
    assert.doesNotMatch(html,/bridge-classifier|bridge-renderer|map-08-bridge-study/,name);
  }
});

test('橋体underlay・既存橋面・detail overlayの順で合成する',async()=>{
  const study=await read('variants/map-08-bridge-study.html');
  const underlay=study.indexOf('prepared.underlay');
  const deck=study.indexOf('grid, option, cellRenderingStats, transportCenters.get(bridgeOption), true');
  const overlay=study.indexOf('prepared.overlay');
  assert.ok(underlay>=0&&deck>underlay&&overlay>deck,{underlay,deck,overlay});
});

test('橋診断は用途・交差対象・LOD・fallbackと描画セル数を公開する',async()=>{
  const study=await read('variants/map-08-bridge-study.html');
  for(const field of [
    'byCarry','byCrossing','byScale','byStyle','descriptors','outlineMatched','inferred','fallbacks',
    'underlayCells','overlayCells','archOpenings','pierCells','wallCells',
  ]) assert.match(study,new RegExp(`${field}:`),field);
});

test('橋研究のtest-only範囲と検証を差分ログへ記録する',async()=>{
  const log=await read('log.html');
  assert.match(log,/可変角度・可変サイズの橋デザイン研究ページを追加/);
  assert.match(log,/2026-09-02 JST/);
  assert.match(log,/variants\/map-08-bridge-study\.html/);
  assert.match(log,/<strong>testのみ<\/strong>/);
  assert.match(log,/本番への影響<\/dt><dd>なし/);
  assert.match(log,/全自動テスト197件とビルドが成功/);
});
