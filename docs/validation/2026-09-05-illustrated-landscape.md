# 彩色ゲーム地図の検証記録

日付：2026-09-05 JST。対象：standalone testの `illustrated-landscape-v1`。

## 変更範囲

`variants/map-02-refined.html?profile=illustrated-landscape&presentation=art` はstandaloneのときだけ専用ページへ接続する。実地図は `variants/map-12-illustrated-landscape.html`、架空の構成見本は同ページの `?scene=fixture`。

本番1・2・4マップ、通常standalone、旧topdownのpage/runtime/renderer/material、既存素材ラボ、mobileは `origin/main` との差分なしを確認した。共通MVT runtimeは読み取り再利用し、既存Canvas selectorを持たない新ページでは旧runtimeが自動起動しない。

## 自動検証

- `node --test tests/*.test.mjs`：356件。
- `node build.mjs`：80ファイル。生成されたmobile manifestに差分なし。
- `git diff --check`：問題なし。
- 新規の11テスト：中庭を残したタイル断片結合、forest境界結合、複数棟の表示判定、全道路・屋根外形の保持、植生衝突、パン・入力順・部分集合での安定性、tunnel保持、平屋根構造、実paint入口の整合、見本の建物と川の非交差、standalone限定入口。

実ブラウザはChromeのheadless実行、deviceScaleFactor=1。再現スクリプトは `scripts/check-illustrated-landscape.cjs`。ローカルでは `PIXELMAP_BASE_URL=http://127.0.0.1:8766` を指定した。

| 検証 | 結果 |
| --- | --- |
| 8画面のmapReady、style ID、paint件数、console error | 全件PASS |
| パン前後のworld座標と樹木 | 中央範囲の72樹木がkey・位置・半径・variationまで同一 |
| 実Canvas pixel | 橋が道路色、水面が水色、中庭が地表色であり、屋根面は赤茶 |
| 現在地成功 | ブラウザのmock座標へ移動し、操作ボタンが復帰 |
| 現在地拒否 | 拒否message、地図維持、操作ボタン復帰 |
| タイル全失敗と再試行 | 初期失敗から再取得でき、遠方取得の全失敗では最後の地図へ復帰 |
| 明示profile入口 | 新ページへ遷移し、fixtureは架空の地形と明示 |

位置情報成功／拒否はmockでの確認。実機GPSの確認やmobileへの反映を示す記録ではない。

## スクリーンショット

画像は `screenshots/illustrated-landscape-2026-09-05/` に保存。各地点を736×952と390×844で撮影した。

| 名前 | 座標またはモード | 画像 |
| --- | --- | --- |
| city | lat=35.531, lon=139.702 | city.png / city-mobile.png |
| river | lat=35.5536, lon=139.7013 | river.png / river-mobile.png |
| green | lat=35.611, lon=139.573 | green.png / green-mobile.png |
| fixture | scene=fixture、架空の地形 | fixture.png / fixture-mobile.png |

## 独立視覚レビュー

サブエージェントが元の参考画像、承認済み設計、最新8画像を直接確認した。初回は見本建物の川への重なり、森林の直線的な地色境界、水面内の重複線、河川地点の検証不足でFAIL。

修正後は8画像すべてPASS。建物を陸側へ移し、林縁を樹冠で構成し、水域内のwaterway中心線を水面で覆った。河川地点を両岸の見える位置へ変更し、fixture-mobileは画面いっぱいに地形が続く範囲へ調整した。最終版の平屋根も確認され、目立つ回帰や公開を止める視覚上の問題なし。

参考画像より描き込みは簡潔だが、承認済みの「大きな色面と輪郭を優先する」方針に適合、という判定。独立レビューは静止画の検証であり、操作検証は上記の実ブラウザスクリプトで別途実施した。

## 公開時の確認

検証済みcommitを `origin/main` へpushし、同じcommitのGitHub Pages build成功後に公開URLで8画面と操作スクリプトを再実行する。公開後の結果とcommitはタスクの完了報告に記録する。

公開URL：`https://keng0o.github.io/PixelMap/variants/map-12-illustrated-landscape.html`

この公開はtestページの追加であり、本番1・2・4マップへの反映ではない。
