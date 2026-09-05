# 彩色地図の手描き表現の検証

2026-09-05 JST。ユーザーの「方向は良い。より手書き感のある参考画像らしくして」に対応する、既存の彩色地図testの描画調整。

## 変更範囲と描画

対象は `illustrated-landscape-hand-drawn-v2`。standaloneの `variants/map-02-refined.html?profile=illustrated-landscape&presentation=art` から開く専用ページと、その架空の構成見本に適用する。**testのみ**。本番1・2・4マップ、通常standalone、旧topdown、mobile、地理の構成処理・元のアセットには変更なし。

- 建物・道路・水際に、角を維持した小さな線の揺れと筆圧の強弱を加えた。
- 屋根には薄い塗りの筆跡と途切れた細線、樹冠には不規則な葉の曲線と点を加えた。葉の配置には十分にばらける決定的な乱数を用いる。
- 草・土・畝に短い描線、全体に淡い紙の繊維を加えた。紙目と草土の線はworld座標へ固定し、地物の地理座標や道路幅は変更しない。
- 水面は広い疎密と線の長さ・角度・曲率・濃淡の差を持たせ、岸に沿う途切れた線を加えた。水面内の重複waterway中心線は従来どおり水面で覆う。
- 筆圧の線をまとめて描き、道路の細線は画面外の区間を省いて負荷を抑えた。既存のドラッグ中のCanvas移動処理は維持する。
- 専用renderer/runtimeの読み込みを `?v=2` に更新した。

## 自動・操作検証

- `node --test tests/*.test.mjs`：356件PASS。
- `node build.mjs`：80ファイル。生成mobile manifestに変更なし。
- `scripts/check-illustrated-landscape.cjs`：ローカルで8画面、7項目PASS。style ID・mapReady・描画件数・console errorなしを確認。
- パン前後で72樹木の配置・大きさ・seedを保持。
- 実Canvasの橋・水面・中庭の色と屋根の色相を確認。紙の繊維による微小な色差には12 RGB段階の許容を設け、水面と道路、地表と屋根の取り違えを検出する。
- 位置情報成功／拒否mock、通信全失敗・再試行・直前地図への復帰、standalone入口を確認。

筆跡の移動は別の実pixel検査を追加した。同じ画面の再描画は82,368 pixelすべて同一。24pxの整数パン後は同じ地理範囲の98.10%が同一で、RGB差が2を超えるのは44 pixel、最大差15、pixelごとの最大RGB差の平均は0.02174。GPUによる細線のアンチエイリアスの丸めを許容し、変化面積・平均差・最大差を併せて制限する。同じ入力の再描画には差を許容しない。CPU描画との比較でも、整数パン時に少数の輪郭pixelの差が残ることを確認した。

生の描画時間の参考値（headless Chrome、390×844 CSS、DPR 2、ウォームアップ後5回の中央値）は市街地33.9ms、緑地49.7ms。細線追加直後の市街地約99msから、画面外の道路細線を省いて短縮した。これはこのMac上のCanvas paint時間であり、実機性能の保証ではない。

ブラウザ結果は `screenshots/illustrated-hand-drawn-2026-09-05/browser-report.json`。

## 視覚検証

参考画像、変更前の8画像、変更後の8画像を独立したサブエージェントが直接比較した。初回は河川2画像で均等な波線の反復を指摘してFAIL。水面の疎密・長短・曲率・方向を修正した後、最新8画像すべてPASS。

保存先：`screenshots/illustrated-hand-drawn-2026-09-05/`。

| 地点 | 座標・モード | 撮影サイズ |
| --- | --- | --- |
| fixture | 架空の構成見本、scene=fixture | 736×952、390×844 |
| city | 35.531, 139.702 | 736×952、390×844 |
| river | 35.5536, 139.7013 | 736×952、390×844 |
| green | 35.611, 139.573 | 736×952、390×844 |

追加の `city-mobile-dpr2.png` / `green-mobile-dpr2.png` も独立レビューPASS。小建物・街路・葉線・水際の潰れ、過度な太線化、地物の読み分けの回帰なし。実ブラウザのスクリーンショットであり、実機検証ではない。

## 公開確認

検証済みcommitを `origin/main` へpushし、同じcommitのGitHub Pages build成功を確認する。公開URLでも同じ8画面・7項目を再実行し、結果をタスクの完了報告に記録する。

公開入口：`https://keng0o.github.io/PixelMap/variants/map-02-refined.html?profile=illustrated-landscape&presentation=art&lat=35.611&lon=139.573`
