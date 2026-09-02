# 判読性優先の石造アーチ橋V2 実装計画

> 対応設計: `docs/superpowers/specs/2026-09-02-readable-stone-arch-bridge-v2-design.md`

## 目標

現在の部品合成式石造橋V1を、参照画像に近い大きなアーチ、張り出した中央橋脚、厚い笠石、太い端柱を持つV2へ更新する。

完成画像を回転せず、0度から175度まで5度刻みの36方向、可変長、可変幅、画面垂直押し出し、固定光源を維持する。小、中、大の意味的LODと画面上1から2pxの構造誇張を導入し、アーチ開口は側壁の暗色模様ではなく、背景が見える透明な穴として生成する。

最初の完成境界は既存の橋単体研究モードまでとする。MVT由来の橋、地図用橋分類、地図用橋描画、`variants/map-02-refined.html`、本番ページへは接続しない。

## 実装原則

- 各Taskは失敗テスト、最小実装、対象テスト合格、リファクタリングの順で進める。
- V2の最終設計へ直接更新し、V1の見た目またはキャッシュ結果との後方互換を維持しない。
- 形状、LOD、誇張、照明は`assets/bridge-component-core.js`へ集約する。
- 完成PNG、小さなPNG部品、Canvasの回転・拡大縮小を形状入力にしない。
- 角度別の座標補正、アーチ補正、照明補正を追加しない。問題は共通モデルで直す。
- 微細模様より透明開口、輪郭、笠石、橋脚、橋台、端柱を優先する。
- `assets/bridge-classifier.js`と`assets/bridge-renderer.js`は変更しない。
- 生成する画像は36方向をまとめた`bridge-component-sheet.png`の1枚だけとする。
- 視覚修正後は最新スクリーンショットと独立レビューを必須とする。
- 既存の無関係なdirty変更を編集またはstageせず、`git add .`を使わない。

## 現在の作業ツリー境界

計画作成時点で、次はユーザーまたは別作業の変更である。変更、削除、stageを行わない。

- `.gitignore`
- `AGENTS.md`
- `mobile/`配下の変更、生成物、QRコード、スクリーンショット
- `.omc/`
- `.superpowers/`
- `docs/releases/`
- 既存の`screenshots/`配下

各コミット前に`git status --short`と`git diff --cached --name-only`を確認し、そのTaskで列挙したパスだけをstageする。

## Git履歴と公開境界

2026-09-02の確認では、ローカル`main`と最新`origin/main`は履歴上分岐している。V1橋実装の内容はpatch-equivalentだがコミットIDが異なり、ローカルには橋と無関係なAndroid設計・計画コミットもある。

このため、現在のdirty worktreeでrebase、reset、force pushを行わない。実装中はV2関連だけを小さなコミットへ分ける。公開時は最新`origin/main`から清潔な一時worktreeを作り、次だけをコミットIDで明示してcherry-pickする。

- V2設計書コミット`ca6bdeb`
- このV2実装計画のコミット
- 下記Taskで作るV2実装コミット

Android設計・計画コミットを含む広い範囲指定は使わない。公開用worktreeで全検証を再実行し、`origin/main`のfast-forwardであることを確認してからforceなしでpushする。

## Task 0: V1の基準状態と保護対象を固定する

### Files

- No source changes

### Steps

1. `git fetch origin main`で公開基点を最新化する。
2. `git status --short`を保存し、V2対象ファイルに未コミット差分がないことを確認する。
3. `git cherry -v origin/main HEAD`で、橋V1がpatch-equivalentであることと、V2設計書が未公開の固有コミットであることを確認する。
4. V1の対象テスト、比較シート同期、ビルドを実行し、開始前の失敗がないことを確認する。
5. 45度標準、36方向、9サイズのV1スクリーンショットを比較基準として確認する。既存画像が使える場合も、対象revisionとURLを記録する。
6. 基準失敗があればV2実装と混ぜず、原因と既存失敗として記録する。

### Verification

```bash
git diff --exit-code -- assets/bridge-component-core.js assets/bridge-component-preview.js tools/generate-bridge-component-sheet.mjs variants/map-08-bridge-study.html tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-cache.test.mjs tests/bridge-component-preview.test.mjs tests/bridge-component-sheet.test.mjs tests/bridge-study-page.test.mjs log.html
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-cache.test.mjs tests/bridge-component-preview.test.mjs tests/bridge-component-sheet.test.mjs tests/bridge-study-page.test.mjs
node tools/generate-bridge-component-sheet.mjs --check
node build.mjs
```

### Commit checkpoint

変更しない。基準確認だけを行う。

## Task 1: V2の意味モデルと入力契約をテスト先行で作る

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-core.test.mjs`

### Steps

1. API versionを`pixelmap-bridge-components/2`へ変更する失敗テストを書く。
2. `family`、`material`、`carry`、`crossing`、`classificationSource`、`spanCount`、`detailLevel`の正規化契約を失敗テストで固定する。
3. 通常描画は`family: stoneArch`と`material: stone`だけを受け付ける。`carry`は`road`、`rail`、`foot`、`other`、`crossing`は`water`、`road`、`rail`、`mixed`、`unknown`を受け付ける。
4. `spanCount`は`auto`または1から5の整数とし、明示値が有効長へ収まるかを厳格検証する。
5. `detailLevel`は`auto`、`small`、`medium`、`large`へ統一する。V1の`full`、`quiet`は受け付けない。
6. 36方向分の固定高精度角度基底を、実行時入力から変更できない凍結値として追加する。
7. 角度基底が36件、5度刻み、単位長、0度と180度の対称契約を満たすことをテストする。
8. `createModel()`が意味値、径間指定、LOD指定を保持し、入力を変更せず、同じ入力でdeep-equalになることを確認する。
9. 未知構造、未知材質、矛盾する組み合わせ、範囲外径間、未知LODを構造化された検証エラーにする。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-core.test.mjs
git diff --cached --check
git commit -m "feat: add bridge v2 semantic model"
```

## Task 2: 最終1回だけ丸める投影とラスタライズへ置き換える

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-core.test.mjs`
- Modify: `tests/bridge-component-render.test.mjs`

### Steps

1. `u`、`v`、`z`から浮動小数の投影座標を返す失敗テストを書く。局所点投影時に整数へ丸めないことを固定する。
2. 36方向で、地面座標だけが回転し、欄干高が画面上、側壁深さが画面下へ固定されることを確認する。
3. 共有頂点を一度だけ投影し、床版、側壁、欄干が同じ浮動小数値を参照する中間形を作る。
4. 浮動小数端点に対応するsupercoverグリッド走査を実装する。同値時のx/y優先規則を固定する。
5. 浮動小数ポリゴンを画素中心包含規則で塗る。boundsは`floor`と`ceil`から求め、画面外の候補画素を先に失わない。
6. アーチ曲線用に、浮動小数曲線から連続した境界画素と内部マスクを作る共通ラスタ関数を追加する。
7. V1の局所点ごとの`Math.round()`経路を形状生成から除く。返却する最終描画命令だけを整数座標にする。
8. 0度、5度、30度、45度、60度、85度、90度、135度、175度で既知点と共有境界をテストする。
9. 全36方向×9サイズで、構造が8近傍連結、bounds内、決定論的であることを確認する。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
git diff --cached --check
git commit -m "feat: stabilize bridge v2 projection"
```

## Task 3: 透明アーチ、橋脚、橋台、笠石を構造マスクとして作る

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-render.test.mjs`

### Steps

1. 出力に`openingMask`と`reservedStructureMask`を追加する失敗テストを書く。
2. 可視側壁を色付き命令へ直接変換せず、最初に壁面マスクとして生成する。
3. 各径間へ半円形の開口マスクを作り、壁面マスクから減算する。開口全体を暗色で塗るV1の`arch-opening`命令を削除する。
4. `openingMask`の全画素が`underlay`、`surface`、`overlay`の不透明命令から除外されることをテストする。
5. 開口保護領域の外側へだけ1から2pxの内周影を生成し、穴の背景を残す。
6. 橋脚、橋台、端柱、笠石の予約マスクを作る。中央橋脚は側壁より張り出す面を持ち、橋台は端へ向けて段階的に太くする。
7. 迫石リングを開口曲線の外側へ連続幅を持つ帯として作る。橋脚、橋台、端柱の予約マスクを侵食しない。
8. 90度と近垂直方向では、見えない長辺アーチを人工的に正面化せず、端面、床版、欄干だけを残す。
9. 0度、30度、45度、60度、135度で透明開口、内周影、橋脚、橋台、端柱、笠石の最低画素数を固定する。
10. `stats`へ`openingPixels`、`innerShadowPixels`、`pierPixels`、`capstonePixels`を追加する。

### Verification

```bash
node --test tests/bridge-component-render.test.mjs tests/bridge-component-core.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-render.test.mjs
git diff --cached --check
git commit -m "feat: render transparent stone bridge arches"
```

## Task 4: 意味的LODと1から2pxの構造誇張を作る

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-core.test.mjs`
- Modify: `tests/bridge-component-render.test.mjs`

### Steps

1. 最終投影後の主要軸長、側壁高、最小開口寸法から`small`、`medium`、`large`を選ぶ`resolveLod()`の失敗テストを書く。
2. 初期閾値を主要軸44px未満S、44px以上68px未満M、68px以上Lとする。最小開口が幅6pxまたは高さ3px未満なら1段階下げる。
3. `detailLevel`明示値は視覚比較用の強制LODとし、`auto`だけが投影寸法から選ぶ。
4. Sでは最外輪郭、透明開口、笠石、中央橋脚、端柱だけを残す。
5. Mでは迫石リング、要石、橋台段差を追加する。
6. Lでは水平石積み、交互目地、笠石継ぎ目、疎な舗装を追加する。
7. SとMで迫石外側1px、中央橋脚左右合計2px、笠石高さ1pxと端張出し1px、端柱最大2pxの誇張を実装する。
8. Lでは実寸を基本とし、主要構造の最低1pxだけを保証する。
9. 誇張が路面、欄干、開口、橋脚予約領域へ衝突する場合、微細模様、迫石分割、誇張の順に減らす。
10. `stats`へ`lod`と`exaggerationPixels`を追加し、全方向で誇張が2pxを超えないことをテストする。
11. 同じ床版、開口中心、橋脚中心、橋台境界を全LODで共有することを確認する。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
git diff --cached --check
git commit -m "feat: add semantic bridge detail levels"
```

## Task 5: 固定照明と構造に従う石積みへ更新する

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-render.test.mjs`

### Steps

1. 画面左上の固定光源と投影後法線から、上面、正面、右下向き面を3段階へ量子化する失敗テストを書く。
2. 橋の角度を変えても光源が回転せず、0度と180度が同じ画素列になることを確認する。
3. 水平石積み段と交互にずらした垂直目地を側壁マスク内へ配置する。
4. 迫石分割をアーチ曲線へ沿わせ、水平目地とランダムな斑点に見えないようにする。
5. `patternSeed`は石積み段と継ぎ目の開始位相だけを変え、構造、LOD、照明、開口を変えない。
6. V1の反復する路面横線を削除し、Lだけへ疎な低コントラスト舗装継ぎ目を置く。
7. すべての微細模様が`reservedStructureMask`と`openingMask`を避けることをテストする。
8. 固定パレット、alpha 0または255、方向専用色なしを全36方向×9サイズで確認する。
9. `stats.detailPixels`と部品別詳細数を返す。

### Verification

```bash
node --test tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-render.test.mjs
git diff --cached --check
git commit -m "style: refine bridge v2 stone structure"
```

## Task 6: 段階的フォールバック、診断、V2キャッシュを作る

### Files

- Modify: `assets/bridge-component-core.js`
- Modify: `tests/bridge-component-cache.test.mjs`
- Modify: `tests/bridge-component-render.test.mjs`

### Steps

1. 厳格APIが不正構造、材質、径間数、寸法、LODを検証エラーにするテストを追加する。
2. 安全APIが、微細模様、迫石分割、誇張、径間数の順に縮退するテストを追加する。
3. 透明開口を保てない場合だけ`generic`平坦橋へ落とし、石造アーチに見せない。
4. `diagnostics`へ`fallback`、理由、変更前後の値、採用LOD、抑制した部品を記録する。
5. フォールバック時も床版、路面マスク、輪郭、boundsを返し、ページ全体を停止させない。
6. キャッシュキーをV2仕様、意味モデル、固定角度基底、径間、LOD、誇張、パレット、シードへ更新する。
7. V1のキャッシュ結果を再利用しないこと、キャッシュ有無で描画結果が変わらないことを確認する。
8. `placeComposition()`が`openingMask`、`reservedStructureMask`、新診断値も平行移動・クリップするように更新する。
9. クリップされた開口または予約マスクの数を診断し、範囲外を例外にしない。

### Verification

```bash
node --test tests/bridge-component-cache.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-core.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-core.js tests/bridge-component-cache.test.mjs tests/bridge-component-render.test.mjs
git diff --cached --check
git commit -m "feat: add bridge v2 fallback diagnostics"
```

## Task 7: V2単体プレビューへLOD・背景・診断を追加する

### Files

- Modify: `assets/bridge-component-preview.js`
- Modify: `tests/bridge-component-preview.test.mjs`

### Steps

1. preview API versionを`pixelmap-bridge-component-preview/2`へ変更する失敗テストを書く。
2. URL状態へ`detail=auto|small|medium|large`と`background=water|ground|checker`を追加する。
3. 無効なdetailとbackgroundを安全な既定値`auto`と`water`へ正規化する。
4. LOD選択と背景選択を操作欄へ追加し、状態を`history.replaceState()`でURLへ保存する。
5. Canvasの透明背景越しに、水面、地面、チェック模様が見えるラッパーを作る。背景をCanvas内へ焼き込まない。
6. 選択中V2、36方向、9サイズを同じ共有コアから再描画する。
7. 診断欄へcore/preview version、意味モデル、採用LOD、透明開口、内周影、橋脚、笠石、誇張画素、抑制部品、fallback、cacheを表示する。
8. 部品境界表示で`openingMask`と`reservedStructureMask`を不透明橋画素と区別して確認できる凡例を追加する。
9. 参照画像の説明を、大きな2連アーチ、張り出し橋脚、厚い笠石、太い端柱へ更新する。
10. DOM構築失敗時は`bridgeComponentReady=0`と日本語の画面内エラーを維持する。

### Verification

```bash
node --test tests/bridge-component-preview.test.mjs tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/bridge-component-preview.js tests/bridge-component-preview.test.mjs
git diff --cached --check
git commit -m "feat: add bridge v2 preview controls"
```

## Task 8: V2比較シートを1枚だけ再生成する

### Files

- Modify: `tools/generate-bridge-component-sheet.mjs`
- Modify: `tests/bridge-component-sheet.test.mjs`
- Modify: `assets/bridge-study/bridge-component-sheet.png`

### Steps

1. generatorがV2 core、標準52/22/14、`detailLevel: auto`を使う失敗テストを書く。
2. 36方向の原寸96×96とnearest-neighbor拡大を、既存の6列×6行の1枚へ維持する。
3. 透明開口越しにチェック背景が見え、橋が開口を暗色で埋めていないことを画素テストする。
4. 角度ラベル、固定パレット、alpha、決定性、切れなしを維持する。
5. 生成前に全36方向の構造、透明開口、boundsを検証し、1件でも失敗したら既存PNGを置き換えない。
6. 出力一覧が`bridge-component-sheet.png`の1件だけで、個別PNGとmanifestを含まないことを確認する。
7. 一時出力で新しい比較シートを目視確認した後、既定成果物を再生成する。
8. `--check`でrepository成果物と共有コアが一致することを確認する。

### Verification

```bash
node tools/generate-bridge-component-sheet.mjs --output /tmp/bridge-component-sheet-v2.png
node --test tests/bridge-component-sheet.test.mjs
node tools/generate-bridge-component-sheet.mjs
node tools/generate-bridge-component-sheet.mjs --check
```

### Commit checkpoint

```bash
git add -- tools/generate-bridge-component-sheet.mjs tests/bridge-component-sheet.test.mjs assets/bridge-study/bridge-component-sheet.png
git diff --cached --check
git commit -m "assets: regenerate bridge v2 comparison sheet"
```

## Task 9: 橋研究ページをV2表示へ更新し、test-onlyログを記録する

### Files

- Modify: `variants/map-08-bridge-study.html`
- Modify: `tests/bridge-study-page.test.mjs`
- Modify: `log.html`

### Steps

1. coreとpreviewのscript version queryをV2へ更新する失敗テストを書く。
2. 水面、地面、チェック背景のラッパーとLOD操作欄が橋単体モードだけに現れるCSSを追加する。
3. `render=bridge-components`が橋単体プレビューだけを起動し、Pbf、MVT、位置情報、地図用橋分類へ到達しない既存分岐を維持する。
4. `render=cell2`と`render=cell3`の地図研究モードを変更しない。
5. `window.PixelMapBridgeComponentStudy`のready、36方向、9サイズ、LOD、透明開口、fallback、boundsをページテストから確認できる契約にする。
6. `log.html`の先頭へ2026-09-02 JSTの新しいtest-only項目を追加する。
7. ログへ構造の1から2px誇張、透明アーチ、3段階LOD、36方向、地図未接続、本番影響なしを記録する。
8. 検証件数と公開URLは実行後の実数だけを書く。計画段階の件数を固定しない。
9. `map-02-refined.html`と本番1・2・4マップが変更されていないことをテストとgit diffで確認する。

### Verification

```bash
node --test tests/bridge-study-page.test.mjs tests/bridge-component-preview.test.mjs tests/change-log.test.mjs
git diff --exit-code -- variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
```

### Commit checkpoint

```bash
git add -- variants/map-08-bridge-study.html tests/bridge-study-page.test.mjs log.html
git diff --cached --check
git commit -m "feat: update isolated bridge study to v2"
```

## Task 10: 全自動検証、生成同期、ビルド、差分境界を確認する

### Files

- No additional source files expected
- Generated but do not stage: `dist/`

### Steps

1. V2 core、描画、キャッシュ、preview、比較シート、研究ページの対象テストをまとめて実行する。
2. 地図用橋分類と地図用橋レンダラーの既存テストを実行し、未接続境界を確認する。
3. 表示方位、ピクセルラスタ、PNG入出力の関連テストを実行する。
4. repositoryの全Nodeテストを実行する。
5. 比較シート`--check`を実行する。
6. `node build.mjs`を実行し、静的成果物へV2 core、preview、比較シート、研究ページが含まれることを確認する。
7. `git diff --check`を実行する。
8. ビルド前後の`git status --short`を比較し、`mobile/`、共有地図アセット、productionページへ新しい差分を作っていないことを確認する。
9. `map-02-refined.html`、地図用橋分類、地図用橋描画、本番ページが未変更であることを明示的に確認する。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-cache.test.mjs tests/bridge-component-preview.test.mjs tests/bridge-component-sheet.test.mjs tests/bridge-study-page.test.mjs
node --test tests/bridge-classifier.test.mjs tests/bridge-renderer.test.mjs tests/map-bearing.test.mjs tests/pixel-raster.test.mjs tests/rgba-png.test.mjs
node --test tests/*.test.mjs
node tools/generate-bridge-component-sheet.mjs --check
node build.mjs
git diff --check
git status --short
git diff --exit-code -- assets/bridge-classifier.js assets/bridge-renderer.js variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
```

失敗時は該当Taskの失敗テストへ戻る。全体テストまたは既存契約を緩めて通さない。

### Commit checkpoint

自動検証だけで追加コミットは作らない。同期漏れまたは不具合を直した場合は、該当Taskの明示パスだけをstageし、修正理由が分かる独立コミットにする。

## Task 11: ローカル実画面と原寸を検証し、独立視覚レビューを通す

### Files

- Reference: `assets/bridge-study/bridge-reference-pixel-art-v1.png`
- Review artifact: `assets/bridge-study/bridge-component-sheet.png`
- Generated screenshots, do not stage by default:
  - `screenshots/bridge-v2-45-standard-2026-09-02.png`
  - `screenshots/bridge-v2-directions-2026-09-02.png`
  - `screenshots/bridge-v2-lod-sizes-2026-09-02.png`

### Steps

1. repository rootまたは`dist/`を静的サーバーで配信し、橋単体V2 URLを開く。
2. `bridgeComponentReady=1`、36方向、9サイズ、採用LOD、透明開口、fallbackなしを確認する。
3. コンソールエラーがなく、`.pbf`、地図タイル、位置情報、MVT橋分類が起動していないことを確認する。
4. 45→50→45度を再読込なしで変更し、Canvas、診断値、URLが同期することを確認する。
5. 水面、地面、チェック背景を切り替え、アーチ穴から背景が見え、穴全体が暗色で塗られていないことを確認する。
6. `detail=small|medium|large|auto`を切り替え、床版、開口中心、橋脚中心、橋台境界が変わらず、細部だけが追加されることを確認する。
7. 原寸でSが輪郭、穴、笠石、橋脚として読めることを確認する。nearest-neighbor拡大だけで合否を決めない。
8. 0度、30度、45度、60度、90度、135度と、崩れやすい5度、85度、175度を確認する。
9. 45度標準で、大きな2連アーチ、張り出し中央橋脚、厚い笠石、太い端柱、段階的橋台、弱い石積みを参照画像と比較する。
10. 45度標準、36方向一覧、LOD・9サイズを実ブラウザからスクリーンショットへ保存する。
11. 最新スクリーンショット、比較シート、参照画像、元の問題「参照画像と全く違う」「角度・大きさが変わっても同じ立体感」を独立サブエージェントへ渡す。
12. 独立レビューへ、承認済み条件「構造を画面上1から2px誇張」「小サイズ判読性優先」「地図未接続」も明記する。
13. 不合格なら方向別出力を直接修正せず、Task 2からTask 5の共通投影、構造、LOD、誇張、微細模様を修正する。
14. 修正後は対象テスト、全テスト、比較シート、スクリーンショット、独立レビューを繰り返す。
15. 最新スクリーンショットが独立レビューを通るまで公開しない。

### Verification

- 45度標準のV2が参照画像の主要構造を満たす。
- 36方向が同じ橋、同じ画面垂直押し出し、同じ固定光源として読める。
- S、M、Lが同じ幾何を共有し、Sで微細模様が消える。
- 透明開口越しに3背景が見える。
- 最新スクリーンショットが独立レビュー合格になる。

### Commit checkpoint

視覚修正が必要な場合だけ、修正したV2対象ファイルと対応テストを明示的にstageする。スクリーンショットと`.superpowers/`はstageしない。

```bash
git diff --cached --check
git commit -m "fix: improve bridge v2 structural readability"
```

## Task 12: 清潔な公開worktreeで再検証し、GitHub Pagesへtest-only公開する

### Files

- No new source files expected
- Temporary clean worktree outside the dirty checkout

### Steps

1. `git fetch origin main`で公開基点を再取得する。
2. `git cherry -v origin/main HEAD`とV2のコミット一覧を照合する。
3. 最新`origin/main`から一時worktreeを作り、公開用一時branchを作る。
4. V2設計書`ca6bdeb`、この計画、Task 1からTask 11のV2コミットだけを古い順に明示してcherry-pickする。
5. Android設計・計画、dirty worktree、`.omc/`、`.superpowers/`、スクリーンショットを含めない。
6. cherry-pick後に全対象テスト、全Nodeテスト、比較シート同期、ビルド、差分境界を清潔なworktreeで再実行する。
7. `git diff origin/main..HEAD --name-status`で、V2設計、計画、core、preview、比較シート、研究ページ、テスト、`log.html`だけであることを確認する。
8. `git merge-base --is-ancestor origin/main HEAD`でfast-forward可能であることを確認する。
9. forceを使わず`HEAD:main`へpushする。push直前にoriginが進んでいた場合はpushを止め、新しい`origin/main`起点のworktreeを作り直す。
10. GitHub Pagesのlatest buildが公開コミットを処理し、statusがbuiltになるまで確認する。
11. 公開URLへcache-busterを付けて開き、`bridgeComponentReady=1`、36方向、9サイズ、透明開口、fallbackなし、コンソールエラーなしを再確認する。
12. 公開ページで45度標準と背景切替をスクリーンショット確認する。ローカルと異なる場合は完了にしない。
13. 公開後も`map-02-refined.html`と本番1・2・4マップにV2が含まれないことを確認する。
14. 一時worktreeは検証記録を確認してから`git worktree remove`で片付ける。dirty checkoutは変更しない。

### Verification

```bash
node --test tests/bridge-component-core.test.mjs tests/bridge-component-render.test.mjs tests/bridge-component-cache.test.mjs tests/bridge-component-preview.test.mjs tests/bridge-component-sheet.test.mjs tests/bridge-study-page.test.mjs
node --test tests/*.test.mjs
node tools/generate-bridge-component-sheet.mjs --check
node build.mjs
git diff --check
git diff --exit-code origin/main -- assets/bridge-classifier.js assets/bridge-renderer.js variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
git merge-base --is-ancestor origin/main HEAD
git push origin HEAD:main
gh api repos/keng0o/PixelMap/pages/builds/latest --jq '{status:.status,commit:.commit}'
```

公開確認URL:

```text
https://keng0o.github.io/PixelMap/variants/map-08-bridge-study.html?render=bridge-components&angle=45&length=52&width=22&roadWidth=14&detail=auto&background=water
```

### Commit checkpoint

公開worktreeではcherry-pickしたV2コミット以外を新規作成しない。Pages公開確認のためだけの空コミットも作らない。

## 完成条件

1. 45度標準橋が、参照画像の大きな2連アーチ、張り出し橋脚、厚い笠石、太い端柱を持つ。
2. アーチ開口が側壁から除外され、背景が見える。
3. S、M、Lが同じ幾何を共有し、小サイズで微細模様が構造を上書きしない。
4. 1から2pxの誇張が全36方向と可変寸法へ共通適用される。
5. 全36方向で高さ、壁深さ、光源が画面に対して固定される。
6. 全自動テスト、比較シート同期、ビルド、差分境界が合格する。
7. 最新ローカルスクリーンショットが独立視覚レビューを通過する。
8. GitHub Pages上の橋単体V2でready、診断、透明開口、コンソールを再確認できる。
9. `log.html`にtest-only、地図未接続、本番影響なし、実際の検証結果が記録される。
10. `variants/map-02-refined.html`、地図用橋分類、地図用橋描画、本番1・2・4マップに差分がない。
