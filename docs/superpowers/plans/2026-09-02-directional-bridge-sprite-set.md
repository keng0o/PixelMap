# 方向別石造橋スプライトセット実装計画

> 対応設計: `docs/superpowers/specs/2026-09-02-directional-bridge-sprite-set-design.md`

## 目標

参照画像の石造橋を、PixelMapの15度刻みの表示方位と画面垂直押し出しに合う12方向のピクセル素材として生成する。全方向を1つの共通モデルから作り、橋の寸法、接地点、アーチ、照明、色を方向別に変えない。

この計画の完了範囲は橋単体素材までとする。地図への配置、橋の識別、道路・河川との合成、standalone testページ、本番ページ、GitHub Pagesは変更しない。

## 実装原則

- 既存の完成PNGを回転せず、論理座標の共通モデルを各方向へ再投影する。
- 方向別の座標補正、拡大率補正、アーチ補正を持たない。
- 地面形状だけを回転し、欄干高は画面上、橋体深さは画面下へ固定する。
- 画像生成ライブラリを追加せず、Node.js標準機能だけでRGBA PNGを生成する。
- 半透明、アンチエイリアス、未定義色を許可しない。
- テストを先に作り、純粋モデル、ラスタライズ、生成物契約、再現性を分けて検証する。
- 目視修正は必ず共通モデルへ反映し、12方向をまとめて再生成する。
- 既存の未コミット変更、`.omc/`、モバイル生成物、既存スクリーンショットをstageしない。

## 現在の作業ツリー境界

`assets/bridge-study/bridge-reference-pixel-art-v1.png`は未追跡である。この画像は先に作成した橋単体の視覚参照で、幾何入力や回転元には使わない。実装完了時に、方向別素材との比較根拠として明示的にstageする。

次の既存変更は本計画と無関係なので変更、削除、stageを行わない。

- `.gitignore`
- `AGENTS.md`
- `mobile/`配下の変更と生成物
- `.omc/`
- `docs/releases/`
- 既存の`screenshots/`配下の画像

実装開始前と完了前に`git status --short`を確認し、計画対象パスだけを差分監査する。`git add .`は使わない。

## Task 1: 共通幾何モデルと方向契約をテスト先行で作る

### Files

- Create: `tools/bridge-direction-core.mjs`
- Create: `tests/bridge-direction-core.test.mjs`

### Steps

1. 失敗するテストで、角度集合が`0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165`と完全一致することを固定する。
2. 論理キャンバス96×96、接地点`{x: 48, y: 40}`、橋長52、石造幅22、車道幅14、欄干厚3、欄干高4、側壁深さ9、2アーチ、両端6pxの橋台を単一の定数オブジェクトへ定義する。
3. 局所座標`u`を橋軸、`v`を橋幅とし、時計回りの角度で画面座標へ変換する純粋関数を作る。
4. 0度、45度、90度、165度の既知点をテストし、角度によって中心または接地点が移動しないことを確認する。
5. 角度を180度で正規化し、最寄りの15度へ量子化する関数を作る。7.5度の同率は時計回り側へ統一する。
6. デッキ、左右欄干、4つの外周辺、2つのアーチ中心、両端橋台を局所座標の部品として返す。
7. 部品IDと描画優先順位を固定し、同一深度のstable sortが環境差を持たないようにする。
8. 不明角度、重複角度、非整数寸法、キャンバス外の接地点を拒否する検証関数を作る。

### Verification

```bash
node --test tests/bridge-direction-core.test.mjs
```

## Task 2: 整数ラスタライザーと最小PNG入出力を作る

### Files

- Create: `tools/rgba-png.mjs`
- Create: `tools/pixel-raster.mjs`
- Create: `tests/rgba-png.test.mjs`
- Create: `tests/pixel-raster.test.mjs`

### Steps

1. RGBAバッファ生成、範囲検査付き1px描画、矩形塗り、整数ポリゴン走査変換、supercover線の失敗テストを書く。
2. 斜線が8近傍で途切れず、ポリゴン境界に穴がなく、同じ入力で同じRGBA配列になることをテストする。
3. `node:zlib`、`node:buffer`、CRC32を使い、PNG signature、IHDR、IDAT、IENDだけを出力する最小RGBA PNGエンコーダーを作る。
4. 画像幅・高さを正の整数に限定し、RGBA長が`width * height * 4`と一致しない入力を拒否する。
5. テスト用の最小PNGデコーダーで、生成した画像の幅、高さ、RGBA値、chunk CRCを読み戻す。
6. filter type 0、固定圧縮設定、固定chunk順を使い、同じ入力から2回生成したPNGのバイト列が一致することを確認する。
7. 最近傍4倍拡大をRGBA配列上で行い、新しい中間色または半透明画素を作らないことをテストする。

### Verification

```bash
node --test tests/rgba-png.test.mjs tests/pixel-raster.test.mjs
```

## Task 3: 石橋の面、アーチ、欄干、固定照明を描画する

### Files

- Modify: `tools/bridge-direction-core.mjs`
- Create: `tests/bridge-direction-render.test.mjs`

### Steps

1. 設計書の7色と透明色を固定パレットとして定義し、描画後にパレット外RGBと0・255以外のalphaを拒否するテストを書く。
2. 回転後のデッキ外周から、外向き法線が画面下を向く辺だけを可視側壁として選ぶ。
3. 可視側壁を同じ辺から`[0, +9]`へ押し出し、画面y、画面x、固定部品IDで描画順を決める。
4. 橋の長辺側壁へ、局所`u`上の同じ2位置に半円アーチを定義する。投影後の可視面積が0pxになる方向では開口を人工的に拡張しない。
5. 短辺側には橋台の石積み面を描き、アーチを追加しない。
6. デッキ上面を石材明部と路面色で描き、車道幅14pxを全方向で維持する。
7. 左右欄干の基部をデッキの長辺へ置き、上端を`[0, -4]`へ押し出す。欄干の垂直辺を常に画面垂直にする。
8. 光源を画面左上へ固定し、上面、画面下側壁、右下向き継ぎ目、アーチ内部へ固定パレットの明暗を割り当てる。
9. 石目は橋局所座標の対称な固定パターンから生成し、方向ごとの乱数を使わない。
10. 最外輪郭を最後にsupercover線で補強し、斜め方向で1pxの切れ目がないことをテストする。
11. 0度、45度、90度のテストで、欄干高が常に負の画面y、側壁深さが正の画面yへ出ることを確認する。
12. 180度で同一になる対称性、全方向の共通寸法、接地点固定、キャンバス内収まりをテストする。

### Verification

```bash
node --test tests/bridge-direction-core.test.mjs tests/bridge-direction-render.test.mjs tests/pixel-raster.test.mjs
```

## Task 4: 12枚、manifest、比較シートを原子的に生成する

### Files

- Create: `tools/generate-bridge-directions.mjs`
- Create: `tests/bridge-direction-assets.test.mjs`
- Create: `assets/bridge-study/directional/bridge-000.png`
- Create: `assets/bridge-study/directional/bridge-015.png`
- Create: `assets/bridge-study/directional/bridge-030.png`
- Create: `assets/bridge-study/directional/bridge-045.png`
- Create: `assets/bridge-study/directional/bridge-060.png`
- Create: `assets/bridge-study/directional/bridge-075.png`
- Create: `assets/bridge-study/directional/bridge-090.png`
- Create: `assets/bridge-study/directional/bridge-105.png`
- Create: `assets/bridge-study/directional/bridge-120.png`
- Create: `assets/bridge-study/directional/bridge-135.png`
- Create: `assets/bridge-study/directional/bridge-150.png`
- Create: `assets/bridge-study/directional/bridge-165.png`
- Create: `assets/bridge-study/directional/bridge-direction-sheet.png`
- Create: `assets/bridge-study/directional/bridge-direction-manifest.json`

### Steps

1. CLIへ`--output <directory>`と`--check`を実装する。通常出力の既定値だけを`assets/bridge-study/directional/`とし、テストは必ず一時ディレクトリを渡す。
2. 12方向をメモリ上で生成し、寸法、alpha、パレット、接地点、キャンバス範囲を全件検証してからファイルを書く。
3. manifestへschema、キャンバス、接地点、共通寸法、投影方式、光源、角度、ファイル名、不透明画素boundsを安定したキー順で記録する。
4. 6列×2行の比較シートを作る。各セルへ角度ラベル、96×96原寸、最近傍4倍プレビューを同じ背景条件で配置する。
5. 角度ラベルは固定5×7ビットマップフォントで描き、OSフォントとCanvasへ依存しない。
6. 既定出力は同じ親ディレクトリ内の一時ディレクトリへ全件生成し、検証成功後だけ対象14ファイルを更新する。
7. エラー時は既存成果物を変更せず、一時出力だけを安全に片付ける。削除対象は作成した一時ディレクトリの絶対パスを検証してから限定する。
8. assetsテストで、全14ファイルの存在、12方向、PNG寸法、manifest一致、半透明なし、パレット限定を確認する。
9. 別々の一時ディレクトリへ2回生成し、PNG、sheet、manifestのSHA-256がすべて一致することを確認する。
10. `--check`でコミット対象の生成物と再生成結果を比較し、古い成果物があれば非0終了する。

### Verification

```bash
node tools/generate-bridge-directions.mjs
node tools/generate-bridge-directions.mjs --check
node --test tests/bridge-direction-assets.test.mjs
```

## Task 5: 全体テストと差分境界を確認する

### Files

- No additional files expected

### Steps

1. 橋方向素材の全テストをまとめて実行する。
2. 既存の橋分類・橋レンダラー・bearingテストを実行し、今回の素材追加が既存契約を変えていないことを確認する。
3. リポジトリの全Nodeテストを実行する。
4. `git diff --check`を実行する。
5. `git diff --name-only`と`git status --short`で、地図HTML、`assets/bridge-renderer.js`、`assets/bridge-classifier.js`、`assets/map-bearing.js`、`log.html`、本番ページに変更がないことを確認する。
6. master参照画像を含む対象ファイルだけを一覧化し、無関係なdirty変更と分離できていることを確認する。

### Verification

```bash
node --test tests/bridge-direction-core.test.mjs tests/pixel-raster.test.mjs tests/rgba-png.test.mjs tests/bridge-direction-render.test.mjs tests/bridge-direction-assets.test.mjs
node --test tests/bridge-classifier.test.mjs tests/bridge-renderer.test.mjs tests/map-bearing.test.mjs
node --test tests/*.test.mjs
git diff --check
git status --short
```

## Task 6: 原寸と拡大表示を目視レビューする

### Files

- Generated review artifact: `assets/bridge-study/directional/bridge-direction-sheet.png`
- Reference: `assets/bridge-study/bridge-reference-pixel-art-v1.png`

### Steps

1. 比較シートを原寸で開き、透明境界、1pxの線切れ、キャンバス切れを確認する。
2. 4倍プレビューで、アンチエイリアス、半透明、新しい中間色がないことを確認する。
3. 0度、45度、90度を重点比較し、欄干が画面上、橋体が画面下、垂直辺が画面垂直、光源が画面左上に固定されていることを確認する。
4. 12方向で橋長、橋幅、接地点、アーチ定義、橋台、石目が同一モデルから来ていることを確認する。
5. 参照画像と並べ、幅広い灰色路面、厚い欄干、2つの大きな石造アーチという識別特徴を確認する。
6. 比較シートと参照画像を、元のユーザー指摘とともに独立レビューへ渡す。
7. レビューで問題が出た場合は方向別PNGを直接編集せず、Task 1またはTask 3の共通モデルだけを修正し、Task 4から再実行する。
8. 修正版の比較シートを再レビューし、合格するまで完了扱いにしない。

### Verification

独立レビューで次を明示的に判定する。

- 参照画像と同じ種類の石造アーチ橋に見える。
- 12方向が同一物体の回転として見える。
- 投影と光源の統一感がある。
- ピクセル境界が鮮明である。
- 地図統合前の素材として中心と接地点が使える。

## Task 7: 対象ファイルだけをcommitして素材段階を完了する

### Files

- Stage only: `tools/bridge-direction-core.mjs`
- Stage only: `tools/pixel-raster.mjs`
- Stage only: `tools/rgba-png.mjs`
- Stage only: `tools/generate-bridge-directions.mjs`
- Stage only: `tests/bridge-direction-core.test.mjs`
- Stage only: `tests/pixel-raster.test.mjs`
- Stage only: `tests/rgba-png.test.mjs`
- Stage only: `tests/bridge-direction-render.test.mjs`
- Stage only: `tests/bridge-direction-assets.test.mjs`
- Stage only: `assets/bridge-study/bridge-reference-pixel-art-v1.png`
- Stage only: `assets/bridge-study/directional/`

### Steps

1. `git diff --check`とTask 5のテストを再実行する。
2. 上記の明示パスだけをstageする。
3. `git diff --cached --name-only`で無関係ファイルが含まれないことを確認する。
4. staged diffと生成物一覧を確認する。
5. `assets: add directional stone bridge sprites`として1つの素材実装commitを作る。
6. commit後も既存の無関係なdirty変更が残っていることを確認する。
7. push、GitHub Pages公開、地図ページ変更は行わない。

## 完了報告の境界

完了時は次を分けて報告する。

1. 共通幾何モデルと整数ラスタライザーの自動テスト
2. 12枚の透過PNG、manifest、比較シートの生成
3. 再生成の決定性とcommitted artifacts同期
4. 参照画像との目視比較
5. 独立レビュー結果
6. 素材実装commit
7. 地図未統合、本番未変更、未push

この7項目の成功は地図上での表示品質を証明しない。素材承認後に、角度選択、サイズ調整、道路・河川への接地、橋種別判定を含む地図統合計画を別途作る。
