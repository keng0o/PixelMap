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
  assert.match(study,/bridge-component-core\.js\?v=\d+/);
  assert.match(study,/bridge-component-preview\.js\?v=\d+/);
  assert.match(study,/dataset\.bridgeStudy='test-only'/);
  assert.match(study,/BRIDGE_CLASSIFIER\.analyzeLayers/);
  assert.match(study,/BRIDGE_RENDERER\.prepare/);
  assert.match(study,/bridgeStudy:\{/);
  for(const [name,html] of [['source',source],['index',index],['compare',compare],['four',four],['height',height]]){
    assert.doesNotMatch(html,/bridge-classifier|bridge-renderer|bridge-component-core|bridge-component-preview|map-08-bridge-study/,name);
  }
});

test('橋単体modeは地図decoder・MVT分類・地図bootより前に分岐する',async()=>{
  const study=await read('variants/map-08-bridge-study.html');
  const branch=study.indexOf('const BRIDGE_COMPONENT_ONLY');
  const previewBoot=study.indexOf('PixelMapBridgeComponentPreview.boot()');
  const mapElse=study.indexOf('}else{',branch);
  const pbf=study.indexOf('class Pbf');
  const classifier=study.indexOf('BRIDGE_CLASSIFIER.analyzeLayers');
  const mapBoot=study.lastIndexOf('boot().finally');
  assert.ok(branch>=0&&previewBoot>branch&&mapElse>previewBoot&&pbf>mapElse&&classifier>pbf&&mapBoot>classifier,
    {branch,previewBoot,mapElse,pbf,classifier,mapBoot});
  assert.match(study,/render=bridge-components/);
  assert.match(study,/id="bridgeComponentStudy"/);
});

test('橋単体modeはV2 core・previewとLOD・透明背景UIを使う',async()=>{
  const [study,preview]=await Promise.all([
    read('variants/map-08-bridge-study.html'),read('assets/bridge-component-preview.js'),
  ]);
  assert.match(study,/bridge-component-core\.js\?v=2/);
  assert.match(study,/bridge-component-preview\.js\?v=2/);
  for(const token of ['bridge-background-water','bridge-background-ground','bridge-background-checker'])
    assert.match(study,new RegExp(token));
  for(const token of [
    'bridgeComponentDetail','bridgeComponentBackground','透明なアーチ開口','openingPixels','maxExaggeration',
  ]) assert.match(preview,new RegExp(token),token);
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

test('部品合成式橋単体modeの範囲を差分ログへ記録する',async()=>{
  const log=await read('log.html');
  assert.match(log,/部品合成式の石造アーチ橋単体モードを追加/);
  assert.match(log,/5度刻みの36方向/);
  assert.match(log,/長さ・石造部幅・路面幅/);
  assert.match(log,/地図タイルとMVT橋分類を起動しない/);
  assert.match(log,/<strong>testのみ<\/strong>/);
  assert.match(log,/本番への影響<\/dt><dd>なし/);
});

test('石造アーチ橋V2のtest-only範囲を差分ログへ記録する',async()=>{
  const log=await read('log.html');
  assert.match(log,/判読性優先の石造アーチ橋V2へ更新/);
  assert.match(log,/透明なアーチ開口/);
  assert.match(log,/3段階LOD/);
  assert.match(log,/1〜2px/);
  assert.match(log,/地図上の橋へは未接続/);
  assert.match(log,/<strong>testのみ<\/strong>/);
  assert.match(log,/本番への影響<\/dt><dd>なし/);
  assert.match(log,/全自動テスト244件/);
  assert.match(log,/独立視覚レビューで3項目すべてPASS/);
  assert.match(log,/地図タイル・MVT未要求/);
});
