# 地図データのzoom切替

2026-09-06 JST。依頼「地図データのzoomを変えて」への対応。style IDは `illustrated-landscape-hand-drawn-v9`。

## 対象と動作

**testのみ**。standaloneの明示的な `profile=illustrated-landscape&presentation=art` から開く専用ページ。本番1・2・4マップ、通常standalone、旧topdown、素材ラボ、mobileは変更しない。架空の構成見本は引き続きローカルのfixtureのみを使用する。

[配信元TileJSON](https://tiles.openfreemap.org/planet)を取得してminzoom=0、maxzoom=14を確認。実行時にもこの上限・下限を読み、取得先と合わせて利用する。TileJSONを取得できない場合は既存のフォールバック配信URLと0〜14を使う。

初期表示にz14を対応させ、表示倍率のlog2に応じて整数のデータzoomを選ぶ。現在の0.5〜4倍の操作範囲では、0.5〜1倍未満がz13、1〜4倍がz14。上限を超えるz15のリクエストは送らない。これは初期表示を維持するデータ詳細度の切替方針であり、表示倍率の数値を一般的な地図ライブラリーのカメラzoom値として扱ってはいない。

- zごとに必要なタイルの座標と範囲を計算。経度の折り返しと極付近の行を制限する。
- MVTのextentを解釈した後、`2 ** (14 - sourceZoom)`で既存のz14 world座標へ揃える。高さ等の属性値は倍率を掛けない。
- キャッシュと取得中のPromiseは`z/worldX/y`で識別する。同じx/yでも異なるzの形状を混ぜない。
- データzoomの変更は必要なタイルが揃ってからフレーム単位で切り替える。一部失敗時は最後に表示できたカメラ・地物・dataZoomへ戻す。遅れて届いた古いzの結果は世代番号で無視する。
- 診断情報の`dataZoom`は表示中のデータ、`requestedDataZoom`は現在のカメラに対して取得するzを示す。

## z13の建物の扱い

初回の視覚レビューはFAIL。配信元がz13で近接する建物をまとめるため、従来の屋根生成をそのまま適用すると、住宅街全体が巨大な寄棟屋根に見えた。[OpenMapTilesの建物生成処理](https://github.com/openmaptiles/planetiler-openmaptiles/blob/main/src/main/java/org/openmaptiles/layers/Building.java)にも、この街区単位の結合が記述されている。取得したz13の建物属性は空で、z14のような個別の高さ属性を持たない。

`sourceZoom < 14`の建物は`buildingAreas`として屋根と区別し、元の外形と穴を維持した淡い市街地の面で描く。屋根棟、勾配の陰影、建物としての投影影、個別屋根に基づく庭木生成を適用しない。推測による家への分割は行わない。z14へ戻ると元の個別屋根を描く。

## 検証

- `node --test tests/*.test.mjs`：391件PASS。データzoomの選択と配信範囲、z14の既存互換、親子タイルの範囲・同位置への変換、extent違い、日付変更線と極、zごとのkey、トンネルの変換に7件を追加。集約面を屋根や影の投射物にしない検証1件も追加した。
- `node build.mjs`：82ファイル。`git diff --check` PASS。
- `scripts/check-illustrated-data-zoom.cjs`：実際のHTTP取得でz14→z13→z14を確認。戻る際のz14 cache利用、同一のカメラ中心、樹木配置の復帰、z15以上の取得0、遅いz13応答後もz14を保持、一部のz13タイルだけ503の場合もz14のフレームを維持して次の操作で復帰することを検証する。ほぼ同じ倍率・同じ中心でz13/z14の比較画像を保存し、z13に屋根がなく集約面が描かれたことも確認する。
- `scripts/check-illustrated-zoom.cjs`：ピンチ、ホイール、ボタン、キー、範囲限界、片指への切替、操作中断、resize、位置情報、通信復帰の既存8項目と倍率別9画像。
- `scripts/check-illustrated-landscape.cjs`：通常11画像と既存8項目。位置情報はmock。ピンチはChrome CDPであり、スマートフォン実機の検証は含まない。
- `scripts/check-illustrated-shadows.cjs`：既存の高さによる影4項目と比較画像。

最新画像・JSONの保存先は `screenshots/illustrated-data-zoom-2026-09-06/`。修正後のデータzoom4項目、ズーム8項目、既存8項目、影4項目がPASS。通常11画像、倍率別9画像、z13/z14比較2画像、影比較1画像の計23枚は独立視覚レビューPASS。巨大な屋根の問題が解消し、z14の手描き表現・水面・陰影、地図の連続性、操作ボタンの可読性を維持している。

## 公開確認

検証済みcommitを`origin/main`へpushし、同一commitのGitHub Pages build成功後、公開URLでデータzoom4項目・ズーム操作8項目・通常11画面と既存8項目を検証する。実施結果はタスク完了報告に記録する。
