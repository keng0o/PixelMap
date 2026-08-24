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

test('差分ログは現行のcell描画契約と主要な変更履歴を記載する', () => {
  assert.match(log, /\?render=cell2/);
  assert.match(log, /\?render=cell3/);
  assert.match(log, /3×3論理pxの単色セル/);
  assert.match(log, /神奈川県の生成GeoJSON/);
  assert.match(log, /production-comparison-z14/);
  assert.match(log, /retro-jrpg-z14/);
  assert.match(log, /本番copy profileで描画差をレイヤー別に収束/);
  assert.match(log, /BuildingSkin／RoadSkin／RailSkin／PoiPack/);
  assert.match(log, /水面・公園・スポーツ面をsurface familyへ分離/);
  assert.match(log, /generic fallbackを明示allowlistで監査/);
  assert.match(log, /z14固定/);
  assert.match(log, /2マップは位置同期/);
  assert.match(log, /既存のRPG風S／M／L施設スプライト/);
  assert.match(log, /facility-resolver/);
  assert.match(log, /WorldStyleでz14 POCのレトロJRPG表現を固定/);
  assert.match(log, /Asset Contractと共通描画基盤を正本化/);
  assert.match(log, /全7 iframe/);
  assert.match(log, /既存POIアセット描画を復旧/);
  assert.match(log, /不変ジオメトリ基準の統一Style Specを導入/);
  assert.match(log, /建物型施設アイコンの道路回避を取り消し/);
  assert.match(log, /ログページの表示内容を簡素化/);
  assert.match(log, /cell2を全ページの既定にしてcell3切替を追加/);
  assert.match(log, /<strong>全てに反映<\/strong>/);
  assert.match(log, /1マップ（<code>index\.html<\/code>）/);
  assert.match(log, /2マップ（<code>compare\.html<\/code>）/);
  assert.match(log, /4マップ（<code>four-maps\.html<\/code>/);
  assert.match(log, /standard、cell8、未知値を<code>cell2<\/code>へ正規化/);
  assert.match(log, /standalone設定を閉じて地図を全画面化/);
  assert.match(log, /設定パネルは右上固定の「－」で閉じ、閉じた間は地図を全画面表示。右上の「＋」で再表示/);
  assert.match(log, /<strong>testのみ<\/strong>。standalone testで有効/);
  assert.match(log, /本番1・2・4マップの表示・設定UI・同期処理は変更なし/);
  assert.match(log, /設定ボタンを＋／－だけの右上固定へ変更/);
  assert.match(log, /設定の開閉状態にかかわらず同じ右上位置へ固定/);
  assert.match(log, /施設アイコンを収集ランドマークの建物表示へ限定/);
  assert.match(log, /事前収集ランドマークだけへ限定/);
  assert.match(log, /「たてもの」と同じ屋根・壁・影の描画器/);
  assert.match(log, /地区幹線道路の中央線を道路境界の中点へ整列/);
  assert.match(log, /両側境界の中点を挟む原子セル/);
  assert.match(log, /本番1・2・4マップは<code>!EMBEDDED<\/code> guardの対象外/);
  assert.match(log, /地区幹線道路の中央線を非表示/);
  assert.match(log, /道路の外縁色と路面色は維持/);
  assert.match(log, /従来の中央線を維持/);
  assert.match(log, /ランドマーク収集を5,000㎡以上へ拡張/);
  assert.match(log, /業務・商業ランドマーク/);
  assert.match(log, /building=commercial/);
  assert.match(log, /landuse=commercial/);
  assert.match(log, /ランドマーク下限を3,000㎡へ変更し公園・神社仏閣を追加/);
  assert.match(log, /ランドマーク収集下限を2,000㎡へ変更/);
  assert.match(log, /1,000㎡以上の施設敷地を意味タグから汎用収集/);
  assert.match(log, /汎用施設を選択だけでなく敷地面として確実に描画/);
  assert.match(log, /収集形状を必ず先に描き、その上へ敷地内のMVT建物を重ねる/);
  assert.match(log, /施設名ラベルは引き続き表示しない/);
  assert.match(log, /親施設20,169件/);
  assert.match(log, /汎用施設13,562件/);
  assert.match(log, /川崎変電所48,571㎡/);
  assert.match(log, /汎用施設ラベルは表示しない/);
  assert.match(log, /開いたwayは強制的に閉じず/);
  assert.match(log, /JR川崎タワー 商業棟/);
  assert.match(log, /leisure=park/);
  assert.match(log, /landuse=religious/);
  assert.match(log, /amenity=place_of_worship/);
  assert.match(log, /敷地全体を建物化せず施設記号/);
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
