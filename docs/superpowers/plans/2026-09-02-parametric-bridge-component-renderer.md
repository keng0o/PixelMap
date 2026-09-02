# 部品合成式石造橋レンダラー実装計画

> 対応設計: `docs/superpowers/specs/2026-09-02-parametric-bridge-component-renderer-design.md`

## 目標

参照画像の石造アーチ橋を、方向別完成PNGではなく、橋台、床版、路面、側壁、アーチ、橋脚、欄干、石積みの共通部品から実行時に合成する。

0度から175度まで5度刻みの36方向と、可変の長さ、石造部幅、路面幅へ対応する。地面形状だけを回転し、高さは画面上、側壁深さは画面下へ固定する。最初の完成境界は橋単体の研究モードまでとし、MVT由来の橋、道路、河川、`variants/map-02-refined.html`、本番ページへは接続しない。

これは地図描画変更ではなく、橋単体の視覚研究である。作業中に地図上の橋、道路マスク、河川、MVT記述子への接続が必要になった場合は実装を止め、別設計へ切り出す。

## 実装原則

- テストを先に失敗させ、最小実装、対象テスト合格、リファクタリングの順で進める。
- 形状計算は`assets/bridge-component-core.js`へ集約し、ブラウザとNode生成ツールで共有する。
- 完成画像、小さなPNG部品、Canvasの回転・拡大縮小を形状入力にしない。
- 座標、寸法、描画命令は論理ピクセルの整数とし、半透明とアンチエイリアスを使わない。
- 角度別の座標補正、アーチ補正、照明補正を追加しない。問題は共通モデルで直す。
- 既存の12方向PNGと旧ジェネレーターは凍結した視覚資料として残し、新しい実行時コードから参照しない。
- 新しい比較画像は36方向をまとめた1枚だけを生成する。個別PNGと新manifestは作らない。
- 既存の`assets/bridge-renderer.js`と地図研究モードは今回変更しない。
- 視覚修正はスクリーンショットと独立レビューを通してから公開する。
- 既存の無関係なdirty変更を編集またはstageせず、`git add .`を使わない。

## 現在の作業ツリー境界

開始時点の`main`は`origin/main`より8コミット先行しており、橋研究ページ、方向別素材、今回の設計書を含む。次の変更は別作業なので、変更、削除、stageを行わない。

- `.gitignore`
- `AGENTS.md`
- `mobile/`配下の変更と生成物
- `.omc/`
- `docs/releases/`
- 既存の`screenshots/`配下の画像

各コミット前に`git status --short`と`git diff --cached --name-only`を確認し、そのTaskで列挙したパスだけをstageする。公開前には、公開対象コミットが橋研究だけであることを`git log origin/main..HEAD`で確認する。

## Task 1: 5度角度、可変寸法、共有APIをテスト先行で作る

### Files

- Create: `assets/bridge-component-core.js`
- Create: `tests/bridge-component-core.test.mjs`

### Steps

1. Nodeの`createRequire()`でブラウザ向け共有ファイルを読み込み、APIが`pixelmap-bridge-components/1`、固定パレット、`stoneArchReference`スタイル、36方向、3×3のサイズプリセットを公開する失敗テストを書く。
2. `assets/bridge-component-core.js`をUMD形式にし、ブラウザでは`window.PixelMapBridgeComponents`、Nodeでは`module.exports`から同じ凍結APIを取得できるようにする。
3. 角度を180度で正規化し、最寄りの5度へ量子化する純粋関数をテスト先行で作る。2.49度は0度、2.5度は5度、177.49度は175度、177.5度は0度、負角度と180度超も固定する。
4. `BridgeModel`の必須入力、有限数、整数寸法、既知スタイル、`detailLevel`、`patternSeed`を検証する。
5. `stoneArchReference`へ橋台6px、基準径間20px、最小径間10px、橋脚4px、欄干厚3px、欄干高4px、側壁深さ9pxを定義する。
6. 短36px、標準52px、長76pxと、細16/8px、標準22/14px、太30/20pxの全9プリセットが寸法契約を満たすことをテストする。
7. `masonryWidth >= roadWidth + 2 * parapetThickness`、正の路面幅、最小橋長を満たさない入力を構造化された検証エラーにする。
8. 局所座標`u`、`v`、`z`と接地点を持つ正規化モデルを返し、入力オブジェクトを変更しないことを確認する。
9. API、スタイル、プリセット、返却モデルを`Object.freeze()`し、実行中に契約値が書き換わらないようにする。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs
```

### Commit checkpoint

対象テストが合格したら、次の明示パスだけをstageする。

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-core.test.mjs
git diff --cached --check
git commit -m "feat: add parametric bridge component core"
```

## Task 2: 左右対称の径間、幅、部品モデルを作る

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-core.test.mjs`

### Steps

1. `usableLength = length - 2 * abutmentLength`とアーチ数候補の計算を失敗テストで固定する。
2. 36pxが1連、52pxが2連、76pxが3連になることを確認する。
3. 候補の径間幅が10px未満ならアーチ数を減らし、すべての径間が最小幅を満たすようにする。
4. 外側から対応する径間と橋脚を同じ幅へ割り当て、奇数余りを中央径間または中央橋脚へ吸収する。局所座標を反転したときに部品境界が一致することをテストする。
5. `masonryWidth`を左右欄干、左右余白、中央路面へ分け、路面中心が橋中心からずれないことを9プリセットで確認する。
6. 橋台、床版、路面、長辺側壁、短辺側壁、径間、橋脚、左右欄干を固定`componentId`付きの局所部品として返す。
7. 部品定義は面と構造だけを表し、この段階では色、Canvas、画面位置を持たせない。
8. 同じモデルを2回構築した結果がdeep-equalになり、入力順や実行時刻に依存しないことを確認する。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs
```

### Commit checkpoint

Task 1のコミットへ混ぜず、径間・部品モデルを独立コミットにする。

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-core.test.mjs
git diff --cached --check
git commit -m "feat: compose symmetric bridge spans"
```

## Task 3: 投影、面マスク、アーチ、欄干、石積みを描画する

### Files

- Modify: `assets/bridge-component-core.js`
- Create: `tests/bridge-component-render.test.mjs`

### Steps

1. 0度、5度、45度、85度、90度、135度、175度の既知局所点を時計回りに投影する失敗テストを書く。
2. 地面座標だけへ回転を適用し、欄干上端を`[0, -parapetHeight]`、側壁下端を`[0, +wallDepth]`へ押し出す。全36方向で垂直辺のxが変わらないことを確認する。
3. ブラウザとNodeで共有できる整数ポリゴン塗り、supercover線、4近傍外周抽出、マスク加算・減算をコア内部へ実装する。
4. 投影後の床版外周と外向き法線から可視側壁を選ぶ。90度付近で長辺アーチ面を人工的に正面化しないテストを追加する。
5. 可視側壁マスクからアーチ開口を減算し、径間間へ橋脚、両端へ橋台を残す。開口、橋脚、橋台が同じ壁面からはみ出さないことを確認する。
6. 床版、中央路面、奥側欄干、手前側欄干を生成する。共有頂点を再利用し、斜め方向の輪郭と欄干に1pxの穴を作らない。
7. 面マスクを結合してから外周輪郭を抽出し、部品境界に不要な黒線を残さない。
8. 光源を画面左上へ固定し、上面、画面下側壁、右下向き面、開口へ設計パレットの明暗を割り当てる。
9. 石積み段、交互目地、迫石、要石、橋台縁、橋脚、笠石継ぎ目、欄干支柱、舗装継ぎ目を面マスク内へ決定論的に描く。
10. `detailLevel: auto`の省略順を、舗装継ぎ目、欄干支柱、細目地の順へ固定する。床版、欄干輪郭、アーチ、橋台、橋脚は省略しない。
11. `underlay`、`surfaceMask`、`surface`、`overlay`、`bounds`、`stats`、`diagnostics`を返す。
12. 各命令へ`x`、`y`、`color`、`kind`、`componentId`、`layer`を付け、安定ソートする。
13. 全36方向と9プリセットで、定義色だけ、alpha相当が0または255だけ、構造マスクが連結、bounds内、再描画が同一であることを確認する。
14. 0度と180度の画素列が一致し、5度、85度、175度で線切れがないことを確認する。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-render.test.mjs
git diff --cached --check
git commit -m "feat: render bridge components as logical pixels"
```

## Task 4: 安全フォールバックと上限付きLRUキャッシュを作る

### Files

- Modify: `assets/bridge-component-core.js`
- Create: `tests/bridge-component-cache.test.mjs`

### Steps

1. `createRenderer({cacheLimit})`が独立したキャッシュを持つ失敗テストを書く。グローバルなテスト順に依存させない。
2. キャッシュキーへ仕様バージョン、スタイル、5度角度、長さ、石造部幅、路面幅、アーチ配置、詳細度、パレット、模様シードを含める。
3. 画面位置とモデルIDをキーから外し、同形状の別配置が同じ原点中心命令を再利用できることを確認する。
4. 既定上限を128件とし、再参照でLRU順が更新され、129件目で最終使用が最も古い1件だけを破棄する。
5. キャッシュヒットと未使用時の描画命令、bounds、statsが完全に一致することを確認する。
6. 厳格APIは不正寸法と未知スタイルを検証エラーとして返す。
7. 安全APIは同じ入力を平坦な橋へフォールバックし、`diagnostics.fallback`と理由を記録する。
8. フォールバックでも路面マスク、床版、輪郭を残し、アーチ、石積み装飾、橋脚だけを省略する。
9. 画面外クリッピング用の配置関数を追加し、範囲外命令を例外にせず捨てる。

### Verification

```bash
node --test tests/bridge-component-cache.test.mjs tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-cache.test.mjs
git diff --cached --check
git commit -m "feat: cache parametric bridge compositions"
```

## Task 5: 36方向を1枚だけにまとめる比較シートを作る

### Files

- Create: `tools/generate-bridge-component-sheet.mjs`
- Create: `tests/bridge-component-sheet.test.mjs`
- Create: `assets/bridge-study/bridge-component-sheet.png`
- Delete: `tests/bridge-direction-core.test.mjs`
- Delete: `tests/bridge-direction-render.test.mjs`
- Delete: `tests/bridge-direction-assets.test.mjs`
- Preserve unchanged: `tools/bridge-direction-core.mjs`
- Preserve unchanged: `tools/generate-bridge-directions.mjs`
- Preserve unchanged: `assets/bridge-study/directional/`

### Steps

1. Nodeから`assets/bridge-component-core.js`の同じAPIを読み込み、標準52/22/14pxの36方向を描画する失敗テストを書く。
2. 既存の`tools/pixel-raster.mjs`と`tools/rgba-png.mjs`を使い、500×412pxのセルを6列×6行に並べた3000×2472pxの比較シートを生成する。
3. 各セルへ角度ラベル、96×96pxの原寸確認領域、最近傍4倍の確認領域を置き、OSフォント、Canvas、画像補間へ依存しない。橋のboundsは各確認領域の中央へ配置する。
4. `--output <file>`、既定出力、`--check`を実装する。テストは一時ディレクトリへ出力し、既定成果物を変更しない。
5. メモリ上で全36方向を検証してから、一時ファイルを同じディレクトリへ書き、成功時だけ1枚の成果物を置き換える。
6. 比較シートの幅、高さ、36ラベル、パレット、alpha、決定性をテストする。
7. 生成対象一覧が`bridge-component-sheet.png`の1件だけであり、`bridge-000.png`などの方向別PNGとmanifestを含まないことをテストする。
8. 新しい部品コアのテストが、旧テストの角度正規化、投影、パレット、垂直押し出し、決定性、生成物同期をすべて置き換えたことを確認する。
9. 置き換えを確認してから、15度、固定96×96、12方向PNGの存在を契約にする旧3テストを削除する。
10. 旧ジェネレーター、旧12方向PNG、旧sheet、旧manifestは凍結資料として残し、変更しない。

### Verification

```bash
node tools/generate-bridge-component-sheet.mjs
node tools/generate-bridge-component-sheet.mjs --check
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-cache.test.mjs tests/bridge-component-sheet.test.mjs
git diff --exit-code -- tools/bridge-direction-core.mjs tools/generate-bridge-directions.mjs assets/bridge-study/directional
```

### Commit checkpoint

```bash
git add -- tools/generate-bridge-component-sheet.mjs tests/bridge-component-sheet.test.mjs assets/bridge-study/bridge-component-sheet.png
git add -- tests/bridge-direction-core.test.mjs tests/bridge-direction-render.test.mjs tests/bridge-direction-assets.test.mjs
git diff --cached --check
git commit -m "assets: add parametric bridge comparison sheet"
```

## Task 6: 橋単体プレビューと操作欄を作る

### Files

- Create: `assets/bridge-component-preview.js`
- Create: `tests/bridge-component-preview.test.mjs`

### Steps

1. DOMを使わないURL状態の解析、5度ステップ、寸法クランプ、`history.replaceState`用クエリ生成を失敗テストで固定する。
2. `assets/bridge-component-preview.js`もUMD形式にし、ブラウザでは`window.PixelMapBridgeComponentPreview`、NodeではURL状態などの純粋関数を`module.exports`から取得できるようにする。
3. `render=bridge-components`だけを橋単体モードとして認識し、未知の`render`値や`cell2`、`cell3`では起動しない。
4. `angle`、`length`、`width`、`roadWidth`、`debug`を読み、無効値は45度、52、22、14、通常表示へ正規化する。
5. 研究モード用DOMを構築する`boot()`を実装する。外部フレームワークを追加しない。
6. 選択中モデルの大型プレビュー、36方向一覧、選択角度を共有する9サイズ一覧、参照画像、診断値を描く。
7. Canvasの内部解像度は論理ピクセルboundsから自動計算し、CSS拡大は`image-rendering: pixelated`を使う。Canvasの回転と補間は使わない。
8. 角度を5度単位で変更し、長さ、石造部幅、路面幅を整数単位で変更できる操作欄を作る。
9. 通常表示と部品境界表示を切り替え、境界表示では`componentId`と`layer`を識別色または凡例で確認できるようにする。
10. 操作ごとに再読込せず再描画し、正規化済み値をURLへ保存する。
11. `window.PixelMapBridgeComponentStudy`へready、現在モデル、36方向数、9サイズ数、キャッシュ統計、fallback、描画boundsを公開する。
12. `document.documentElement.dataset.bridgeComponentReady`を成功時`1`、失敗時`0`にし、失敗理由を画面へ表示する。
13. ボタン、入力、出力、Canvasへ日本語ラベルとARIA属性を付け、キーボードで操作できるようにする。

### Verification

```bash
node --test tests/bridge-component-preview.test.mjs tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-preview.js tests/bridge-component-preview.test.mjs
git diff --cached --check
git commit -m "feat: add bridge component preview controller"
```

## Task 7: 既存の橋研究ページへ地図を起動しない単体モードを追加する

### Files

- Modify: `variants/map-08-bridge-study.html`
- Modify: `tests/bridge-study-page.test.mjs`
- Modify: `log.html`

### Steps

1. ページテストへ、`bridge-component-core.js`と`bridge-component-preview.js`を橋研究ページだけが読み、`map-02-refined.html`と本番ページが読まない失敗テストを追加する。
2. 新しいscript参照へ明示的なversion queryを付け、公開HTMLとJSの同期を検証できるようにする。
3. `render=bridge-components`では橋単体DOMだけを表示し、既存の地図、設定欄、位置情報、地図クレジットを非表示にするCSSとコンテナを追加する。
4. 既存の巨大な地図インラインスクリプトを、橋単体モードでは実行しない分岐で囲む。`Pbf`生成、MVT fetch、`BRIDGE_CLASSIFIER.analyzeLayers()`、既存`boot()`へ到達しないことをテスト可能な順序で記述する。
5. 橋単体分岐では`PixelMapBridgeComponentPreview.boot()`だけを呼び、地図用`mapReady`を成功根拠にしない。
6. `render=cell2`と`render=cell3`では既存の地図DOM、`assets/bridge-renderer.js`、分類、underlay→道路→overlay順、診断値を変更しない。
7. 橋単体URLを次で再現できることをページテストへ固定する。

```text
variants/map-08-bridge-study.html?render=bridge-components&angle=45&length=52&width=22&roadWidth=14
```

8. `log.html`の先頭へ2026-09-02 JSTのtest-only項目を追加し、部品合成、5度36方向、可変サイズ、橋単体モード、地図未接続、本番影響なし、実施した検証を記録する。
9. 既存ログ項目とテストを壊さず、検証件数は実行後の実数だけを書く。計画段階の件数を先に固定しない。
10. `variants/map-02-refined.html`、`index.html`、`compare.html`、`four-maps.html`、`variants/height-stack-four-map.html`に差分がないことをテストとgit diffで確認する。

### Verification

```bash
node --test tests/bridge-study-page.test.mjs tests/bridge-component-preview.test.mjs tests/change-log.test.mjs
git diff --exit-code -- variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
```

### Commit checkpoint

```bash
git add -- variants/map-08-bridge-study.html tests/bridge-study-page.test.mjs log.html
git diff --cached --check
git commit -m "feat: add isolated parametric bridge study mode"
```

## Task 8: 全自動テスト、生成同期、ビルド、差分境界を確認する

### Files

- No additional source files expected
- Generated but do not stage: `dist/`

### Steps

1. 新しい部品コア、描画、キャッシュ、比較シート、プレビュー、研究ページの対象テストをまとめて実行する。
2. 既存の橋分類、既存地図橋レンダラー、表示方位、ピクセルラスタ、PNG入出力テストを実行する。
3. リポジトリ全Nodeテストを実行する。
4. `node build.mjs`を実行し、静的成果物へ新しいJS、PNG、研究ページが含まれることを確認する。
5. 比較シートの`--check`を実行し、コミット成果物と共有コアが同期していることを確認する。
6. `git diff --check`を実行する。
7. ビルド前後の`git status --short`を比較し、`assets/mobile-asset-manifest.json`など無関係な追跡ファイルへ差分を作っていないことを確認する。
8. 旧12方向素材、旧ジェネレーター、既存地図橋レンダラー、`map-02-refined.html`、本番ページが未変更であることを確認する。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-cache.test.mjs tests/bridge-component-sheet.test.mjs tests/bridge-component-preview.test.mjs tests/bridge-study-page.test.mjs
node --test tests/bridge-classifier.test.mjs tests/bridge-renderer.test.mjs tests/map-bearing.test.mjs tests/pixel-raster.test.mjs tests/rgba-png.test.mjs
node --test tests/*.test.mjs
node tools/generate-bridge-component-sheet.mjs --check
node build.mjs
git diff --check
git status --short
```

失敗が出た場合、該当Taskのテストへ戻る。全体テストだけを緩めて通さない。

## Task 9: ローカル実画面を検証し、独立視覚レビューを通す

### Files

- Review artifact: `assets/bridge-study/bridge-component-sheet.png`
- Reference: `assets/bridge-study/bridge-reference-pixel-art-v1.png`
- Generated screenshots, do not stage by default:
  - `screenshots/bridge-components-45-standard-2026-09-02.png`
  - `screenshots/bridge-components-directions-2026-09-02.png`
  - `screenshots/bridge-components-size-extremes-2026-09-02.png`

### Steps

1. ローカル静的サーバーを起動し、橋単体URLをブラウザで開く。
2. `bridgeComponentReady=1`、36方向、9サイズ、fallbackなし、コンソールエラーなしを確認する。
3. ネットワークまたは診断から、`.pbf`、地図タイル、位置情報、MVT橋分類が起動していないことを確認する。
4. 角度ボタンまたは入力で45→50→45度を変更し、再読込なしでCanvasとURLが同期することを確認する。
5. 標準52/22/14pxの36方向一覧を確認する。
6. 45度で9サイズを確認する。
7. 5度と175度の短い・細い、85度と90度の長い・太いを操作欄から確認する。
8. 通常表示と部品境界表示を切り替え、隙間、重複輪郭、アーチ外への目地漏れがないことを確認する。
9. 参照画像と45度標準橋を同じ画面で比較し、太い石造感、二重欄干、暗いアーチ、橋脚、路面幅を確認する。
10. 45度標準、36方向一覧、サイズ両極端をスクリーンショットへ保存する。
11. 最新スクリーンショット、比較シート、参照画像、元の指摘「参照画像と全く違う」「角度・大きさで同じ立体感にしたい」を独立レビューへ渡す。
12. レビューで1件でも不合格なら、方向別出力を直接修正せず、Task 2またはTask 3の共通部品を修正する。対象テスト、比較シート、画面、スクリーンショット、独立レビューを繰り返す。
13. 最新スクリーンショットが独立レビューを通るまで公開しない。

### Local server

```bash
python3 -m http.server 4173
```

### Review URL

```text
http://127.0.0.1:4173/variants/map-08-bridge-study.html?render=bridge-components&angle=45&length=52&width=22&roadWidth=14
```

### Independent review acceptance

- 参照画像と同じ種類の石造アーチ橋に見える。
- 36方向が同一物体の回転に見える。
- 短、標準、長と細、標準、太で部品比率が破綻しない。
- 高さ、壁深さ、光源が画面に対して固定されている。
- 線切れ、透明な隙間、二重輪郭、クリッピングがない。
- 小サイズはノイズ化せず、大サイズは引き伸ばしに見えない。
- 地図UIが混ざらず、橋だけを評価できる。

## Task 10: 対象コミットを監査し、GitHub Pagesへ公開・検証する

### Files

- No new source files expected

### Steps

1. Task 8の全検証とTask 9の独立レビュー合格を再確認する。
2. 未コミットの橋対象ファイルがあれば、明示パスだけをstageし、視覚調整内容が分かる追加コミットを作る。
3. `git diff --cached --name-only`が橋コンポーネント、比較シート、橋研究ページ、対象テスト、`log.html`だけであることを確認する。
4. `git status --short`で無関係なdirty変更が残り、橋実装コミットへ混入していないことを確認する。
5. 公開前の`origin/main`を記録し、`git log origin/main..HEAD`が橋研究ページ、方向別素材、設計、計画、部品実装だけであることを確認する。
6. 保存した公開前commitからHEADまで、`variants/map-02-refined.html`と本番ページに差分がないことを確認する。
7. `main`を`origin/main`へpushする。
8. GitHub Pagesの最新buildを`gh api repos/keng0o/PixelMap/pages/builds/latest`で確認し、pushしたHEADのbuildが`built`になるまで待つ。古い成功buildを今回の証拠にしない。
9. 公開URLへcache-busting queryを付けて開き、HTTP成功、`bridgeComponentReady=1`、36方向、9サイズ、コンソールエラーなしを確認する。
10. 公開HTMLが新しい`bridge-component-core.js`と`bridge-component-preview.js`を参照し、公開JSのversionがローカルと一致することを確認する。
11. 公開URLでも地図タイルとMVTが起動せず、橋単体表示だけであることを確認する。
12. `variants/map-02-refined.html`と本番1・2・4マップの公開内容が今回の橋単体モードを読み込んでいないことを確認する。

### Publish commands

```bash
git push origin main
gh api repos/keng0o/PixelMap/pages/builds/latest
```

### Published URL

```text
https://keng0o.github.io/PixelMap/variants/map-08-bridge-study.html?render=bridge-components&angle=45&length=52&width=22&roadWidth=14
```

## 完了報告の境界

完了時は次を分けて報告する。

1. 共有部品コアと公開API
2. 5度刻み36方向、可変長、可変幅、1・2・3連アーチ
3. 画面垂直押し出し、固定光源、決定論的な石積み
4. 安全フォールバックと128件LRU
5. 個別PNGを作らない1枚の比較シート
6. 地図を起動しない橋単体研究モード
7. 自動テスト、生成同期、ビルド
8. ローカルスクリーンショットと独立レビュー結果
9. 実装コミットとGitHub Pages build
10. 公開URLの実画面確認
11. `map-02-refined.html`、既存地図橋レンダラー、本番ページ未変更

この成功は地図上の橋配置を証明しない。MVTからの橋寸法推定、道路スキンの`surfaceMask`合成、河川との接地、LOD、地図描画順は次段階の別設計とする。
