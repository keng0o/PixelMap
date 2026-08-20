import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const log = await readFile(new URL('../log.html', import.meta.url), 'utf8');
const agents = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');
const build = await readFile(new URL('../build.mjs', import.meta.url), 'utf8');

test('差分ログは不要な説明・対象ページ一覧・画面内ルールを表示しない', () => {
  assert.doesNotMatch(log, /PIXELMAP \/ CHANGE RECORD/);
  assert.doesNotMatch(log, /<h1>本番／test 差分ログ<\/h1>/);
  assert.doesNotMatch(log, /id="pages-title"/);
  assert.doesNotMatch(log, /class="page-list"/);
  assert.doesNotMatch(log, /id="rules-title"/);
  assert.doesNotMatch(log, /class="rules"/);
});

test('差分ログは現行のtest専用機能と本番維持事項を記載する', () => {
  assert.match(log, /\?zoom=12/);
  assert.match(log, /\?render=cell2/);
  assert.match(log, /神奈川県の生成GeoJSON/);
  assert.match(log, /最小1論理px/);
  assert.match(log, /z14固定/);
  assert.match(log, /2マップは位置同期/);
  assert.match(log, /4マップは4地点への共通レイヤー操作/);
  assert.match(log, /建物と道路の競合/);
  assert.match(log, /建物型施設アイコン/);
  assert.match(log, /ログページの表示内容を簡素化/);
});

test('AGENTSはtest変更とログ更新を同じ変更の完了条件にする', () => {
  assert.match(agents, /Any change to `variants\/map-02-refined\.html`[\s\S]*must update `log\.html` in the same change/);
  assert.match(agents, /JST date, change summary, affected mode, production impact, and verification/);
  assert.match(agents, /`testのみ`/);
  assert.match(agents, /`全てに反映`/);
  assert.match(agents, /incomplete until its `log\.html` entry/);
});

test('AGENTSは視覚修正後の撮影とサブエージェント確認を完了条件にする', () => {
  assert.match(agents, /After every visual map fix, capture a screenshot/);
  assert.match(agents, /delegate an independent visual review to a sub-agent/);
  assert.match(agents, /continue fixing, capture a new screenshot, and repeat/);
  assert.match(agents, /Do not deploy or report completion until the latest screenshot passes/);
});

test('ビルド成果物の公開対象に差分ログを含める', () => {
  assert.match(build, /'log\.html'/);
});
