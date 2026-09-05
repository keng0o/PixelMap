# 川と森の手描き陰影の検証

2026-09-05 JST。対象は `illustrated-landscape-hand-drawn-v4`。ユーザーの「川や森の陰影をつけて手書き感のあるように実装して」に対応。

## 変更範囲

**testのみ**。`variants/map-02-refined.html?profile=illustrated-landscape&presentation=art` から開く専用ページと、その架空の構成見本に適用。本番1・2・4マップ、通常standalone、旧topdown、既存素材ラボ、mobileへの変更はない。

実地理の水域・道路・建物・中庭、樹木の位置・半径、構成見本の地形を保持し、描画の陰影だけを調整した。

## 描画

- 川岸に、長さ・幅・濃さと途切れが異なる青緑の薄い筆跡を重ねた。岸から離れた水面は淡く保つ。水面の色むらと細い流れの線は近い岸の向きに沿わせる。
- 太い閉じた色面の代わりに、始点・終点が揃わない細い半透明の線を重ね、筆先のかすれを表す。影と色むらは水域の内側へ切り抜き、中洲の穴を保つ。橋は後から描く。
- 森の大きな樹冠群の右下に、不揃いの輪郭を持つ半透明の暗部と短いハッチ線を加えた。従来の左上の淡い緑と葉の細線を残す。陰影は実際の樹冠の合成範囲へ切り抜く。
- すべての筆跡をworld座標とseedへ固定。既存のドラッグ中のCanvas移動と、操作後の再描画を維持した。

## 自動検証

- `node --test tests/*.test.mjs`：359件PASS。
- `node --check assets/illustrated-landscape-renderer.js`：PASS。
- `node build.mjs`：80ファイル。生成mobile manifestに差分なし。`git diff --check` もPASS。
- ブラウザ再現スクリプト：`scripts/check-illustrated-landscape.cjs`。fixture / city / river / green各736×952・390×844の8画面に、city / river / greenの390×844 CSS・DPR 2の3画面を追加し、11画面を保存。
- 11画面ともstyle ID V4、mapReady、描画件数、タイル失敗0、console errorなし。
- 実地図のパン前後で72樹木の位置・半径・seedが一致。
- 同じ画面の再描画では82,368 pixelが完全一致。24pxパンで同じ地理範囲を比較すると97.94%が一致、最大RGB差3、平均最大RGB差0.02118。既存のアンチエイリアス許容内。
- 橋・水面・中庭・屋根の実pixel、位置情報成功・拒否mock、通信失敗・再試行と直前の地図保持、standalone入口の遷移を確認。
- 水域だけを描く比較で、岸から4px以上離れた陸地・中洲の25,030 pixelへの塗り漏れ0。岸際と中央の平均G値は198.04 / 203.22で、岸の陰影が実際に描かれていることも確認。微細な紙目のGPU描画とreadbackの切替差を避け、この比較は両Canvasを `willReadFrequently` で統一する。

画像・ブラウザ8項目の結果：`screenshots/illustrated-shading-2026-09-05/`。

390×844 CSS・DPR 2のheadless ChromeでのCanvas paint時間は、ウォームアップ後5回の中央値がcity 39.4ms、river 20.6ms、green 83.4ms。環境内の参考計測であり、実機性能の確認ではない。測定値は同フォルダの `paint-timing.json` に保存。

## 独立視覚レビュー

初回は8画像中4画像がFAIL。川の両岸に揃った連続帯がチューブ状に見え、太い水面の色むらが魚・葉形の反復に見えると指摘された。市街地・緑地の残り4画像はPASS。

連続帯を途切れた岸影へ、閉じた色面を始点・終点が異なる細い半透明の筆跡へ修正。最新11画像はすべてPASS。川の人工的な形の解消、森の樹冠群の重なり、橋・道・中庭・建物の視認性、DPR 2の細線を確認した。静止画の範囲で公開を止める問題なし。実機の確認は含まない。

## 公開確認

検証済みcommitを `origin/main` へpushし、同じcommitのGitHub Pages build成功後、公開URLで11画面・8項目のブラウザ検証を再実行する。公開確認の実行結果はタスクの完了報告へ記録する。

公開入口：`https://keng0o.github.io/PixelMap/variants/map-02-refined.html?profile=illustrated-landscape&presentation=art&lat=35.611&lon=139.573`
