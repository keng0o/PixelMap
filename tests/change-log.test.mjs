import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const log = await readFile(new URL('../log.html', import.meta.url), 'utf8');
const agents = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');
const build = await readFile(new URL('../build.mjs', import.meta.url), 'utf8');

test('差分ログは本番3ページとstandalone testを案内する', () => {
  assert.match(log, /href="index\.html"/);
  assert.match(log, /href="compare\.html"/);
  assert.match(log, /href="four-maps\.html"/);
  assert.match(log, /href="variants\/map-02-refined\.html"/);
  assert.match(log, /pattern 07/);
  assert.match(log, /referenceアセット/);
  assert.match(log, /表示倍率1/);
});

test('差分ログは現行のtest専用機能と本番維持事項を記載する', () => {
  assert.match(log, /\?zoom=12/);
  assert.match(log, /\?render=cell2/);
  assert.match(log, /神奈川県の生成GeoJSON/);
  assert.match(log, /最小1論理px/);
  assert.match(log, /z14固定/);
  assert.match(log, /2マップは位置同期/);
  assert.match(log, /4マップは4地点への共通レイヤー操作/);
});

test('AGENTSはtest変更とログ更新を同じ変更の完了条件にする', () => {
  assert.match(agents, /Any change to `variants\/map-02-refined\.html`[\s\S]*must update `log\.html` in the same change/);
  assert.match(agents, /JST date, change summary, affected mode, production impact, and verification/);
  assert.match(agents, /`testのみ`/);
  assert.match(agents, /`全てに反映`/);
  assert.match(agents, /incomplete until its `log\.html` entry/);
});

test('ビルド成果物の公開対象に差分ログを含める', () => {
  assert.match(build, /'log\.html'/);
});
