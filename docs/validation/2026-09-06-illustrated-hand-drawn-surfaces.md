# 道と川の手描き面・輪郭の検証

2026-09-06 JST。承認済みの「道路の左右の縁から面を作り、川岸と水面の筆跡を参考画像へ近づける」を実装。style IDは `illustrated-landscape-hand-drawn-v6`。

## 対象と描画

**testのみ**。`variants/map-02-refined.html?profile=illustrated-landscape&presentation=art` の専用ページと架空の構成見本。本番1・2・4マップ、通常standalone、旧topdown、素材ラボ、mobileへの変更なし。

- `assets/illustrated-landscape-surfaces.js` が、元の地理座標を保持したまま描画用の `paintPolygons` を生成する。道路の左右の縁には別々のworld座標ノイズを使う。幹線は半幅の4.5%、生活道路・小径は9.5%を上限とする緩やかな変化に、ごく小さい細部の揺れを重ねる。接続する端点から10 world単位以内で変化を抑え、橋・鉄道の幅は固定する。
- 地上道路と橋を分けて面を結合し、各グループの外周だけに筆圧と途切れのある線を描く。交差点の内部に輪郭を重ねない。面は淡い土色、幹線は明るめにし、小径には疎らな短い擦れと粒を加える。
- 川の描画用外形は元の水域内に収め、岸に最大約0.4 world単位の揺れを加える。穴の数や水域の連結が変わる狭い箇所では元の外形に戻す。中洲や陸地へ水色の面を拡張しない。
- 岸には細く途切れた輪郭、内側に幅・長さ・濃さの異なる筆跡を描く。中央は低密度の流線と淡い筆跡にして余白を残す。流れの向きは周囲の岸と存在する水路中心線を、180度周期の角度として重み付き平均し、world格子間で補間する。反対側の岸へ近づいた瞬間に線の向きが反転しない。流体計算や現地の流速・流向の再現ではない。
- 道路と水面の彩色・クリップ・輪郭・影の受け面に同じ描画用ポリゴンを使う。地物の際に集まる草土の線もこの外形を参照する。元の道路・水域、建物の外形、樹木の配置規則、V5の高さに基づく陰影は維持する。
- 線のサンプリング・揺れ・筆跡はworld座標で固定。ポリゴン結合の微小な計算誤差を避けるため道路面を1/1024 world単位で量子化する。水域・道路の内外と近傍線には空間索引を使う。

## 自動検証

- `node --test tests/*.test.mjs`：376件PASS。新規8件は、元の道路保持・T/X合流・幅の上限と橋接続・パンと入力順/方向・中洲と狭い流路・曲がる岸の流向連続性・中心線の優先・描画形状を使う受け面・空間索引と直接判定の一致を検証。
- `node build.mjs`：82ファイルのビルド。`git diff --check` PASS。
- `scripts/check-illustrated-landscape.cjs`：fixture/city/river/greenのPC・mobile、city/river/greenのDPR2で11画面。ブラウザ8項目PASS（72樹木のパン、筆跡pixel、橋・水面・中庭、岸と中洲の塗り漏れ、位置情報成功/拒否mock、通信失敗からの復帰と直前地図保持、明示profile入口）。
- 同位置の再描画はpixel完全一致。24pxパンで同じ82,368 pixelを比較し、差のあるpixelは2,049（2.49%）、最大RGB差11、平均最大RGB差0.02628、RGB差2を超えるpixelは16。従来の描画丸め許容内。
- 陸地と中洲25,030 pixelへの水面・岸の塗り漏れ0。岸の平均G値196.89、中央202.73で、岸を濃く中央を淡く保つ。
- `scripts/check-illustrated-shadows.cjs`：実Canvasの影4項目PASS。6m/28mの建物、4m/40mの受け屋根、水面の影・橋下の隙間・橋桁を検証。橋桁の細い輪郭が混ざるpixelは固定色と比較せず、影の水面との差と橋受け面の影pixelが0であることを確認。
- `scripts/capture-illustrated-surfaces.cjs`：架空の中洲・橋・道路合流の拡大図と、再計算の所要時間を保存。

実行時はローカルHTTPサーバーを用意し、`NODE_PATH`へPlaywrightのインストール先を指定する。公開先でも `PIXELMAP_BASE_URL=https://keng0o.github.io/PixelMap` と `PIXELMAP_QA_OUTPUT` を指定して同じ確認を実行できる。

## 視覚確認と処理時間

画像・計測値は `screenshots/illustrated-hand-drawn-surfaces-2026-09-06/` に保存。11地図と、高さ比較・中洲と道路合流の検証図、計13枚が独立視覚レビューPASS。橋の接続・中洲・合流内部の輪郭・既存の森林と屋根の陰影に公開を妨げる問題なし。T字路の元の終端を覆う小さい丸い突出、道の筆圧、水面の線のばらつきは任意の表現調整として記録。性能改善前後の全診断値は一致し、PNG差の大半は森林の細い輪郭部分にあり、視覚的な退行なし。実機での検証は含まない。

390×844 CSS・DPR2のheadless Chromeで、表示地物からsceneを再構成する時間と、新しい影も含めたpaint時間を測定（1回準備後3回の中央値）。cityは267.8ms + 212.1ms、riverは77.8ms + 87.6ms、greenは215.7ms + 295.0ms。CPU負荷などに依存し、実機速度の証明ではない。描画用外形の空間索引で大きい水域の繰り返し判定を軽くした。既存のドラッグ中のCanvas移動を維持し、毎pointermoveで面を再生成する変更はない。

## 公開確認

検証済みcommitを `origin/main` へpushし、同じcommitのGitHub Pages build成功を待ち、公開ページで地図11画面・ブラウザ8項目・影pixel4項目を再確認する。実施結果はタスクの完了報告へ記録する。

公開入口：`https://keng0o.github.io/PixelMap/variants/map-02-refined.html?profile=illustrated-landscape&presentation=art&lat=35.611&lon=139.573`
