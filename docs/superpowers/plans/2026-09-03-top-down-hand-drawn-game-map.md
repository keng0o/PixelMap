# 真上視点の手描きピクセルゲーム地図 実装計画

> 対応設計: `docs/superpowers/specs/2026-09-03-top-down-hand-drawn-game-map-design.md`

## 目標

実地図の地理形状を維持しながら、ユーザー提供の参考画像1寄りの青緑の水、深い森林、青系屋根、砂色道路を持つ、真上視点の手描きピクセルゲーム地図を新規standalone testへ実装する。

屋根、木、森林、道路、水面、地表には複数の決定論的patternを用意する。名称と浮いたPOIアイコンは表示しない。操作はドラッグと一回限りの現在地取得だけとし、北向きへ固定する。

完成境界は`variants/map-09-top-down-game.html`のGitHub Pages公開までとする。`variants/map-02-refined.html`、本番1・2・4マップ、mobileは変更しない。

## 実装原則

- 各Taskは失敗テスト、最小実装、対象テスト合格、リファクタリングの順で進める。
- 地物座標を論理ピクセル、map cell、cell2、cell3へ丸めない。
- 実形状は変更せず、手描き感は副線、色欠け、hard-edge stamp、限定paletteで作る。
- `Math.random()`を使わず、地物keyと世界座標から安定seedを作る。
- pattern選択、描画命令生成、runtime状態遷移をDOMから分離し、Nodeで検証できる純粋関数にする。
- データにない屋根形式、道路素材、水際模様はゲーム上の視覚variationとして扱い、実在情報と混同しない。
- 表示不能な詳細はneutral patternへ縮退し、例外でページ全体を停止させない。
- 参考画像をrepositoryへコピーせず、視覚レビュー入力としてのみ使う。
- 視覚修正後は最新スクリーンショットと独立サブエージェントレビューを必須とする。
- 既存の無関係なdirty変更を編集またはstageせず、`git add .`を使わない。

## 現在の作業ツリー境界

計画作成時点で、次はユーザーまたは別作業の変更・生成物である。変更、削除、stageを行わない。

- `.gitignore`
- `AGENTS.md`
- `mobile/`配下の変更、生成物、QRコード、スクリーンショット
- `.omc/`
- `.superpowers/`
- `docs/releases/`
- 既存の`screenshots/`配下

今回の新しい検証スクリーンショットは、既存ファイルを上書きしない固有名で作る。source commitへ含めず、検証成果として保持する。

各コミット前に`git status --short`と`git diff --cached --name-only`を確認し、そのTaskで列挙したpathだけをstageする。

## Git履歴と公開境界

計画作成時点のローカル`main`は`origin/main`に対してahead 22 / behind 18である。橋関連の多くはpatch-equivalentだが、Android設計・計画など今回と無関係な固有commitも含む。設計書commit `942d0b3`だけが今回の既知の新規commitである。

現在のdirty worktreeでrebase、reset、force pushを行わない。実装はtop-down map関連だけを小さなcommitへ分ける。公開時は最新`origin/main`から清潔な一時worktreeを作り、次をcommit IDで明示してcherry-pickする。

- 設計書commit `942d0b3`
- この実装計画のcommit
- 下記Taskで作るtop-down map実装commit

公開用worktreeで全検証を再実行し、`origin/main`のfast-forwardであることを確認してからforceなしでpushする。

## Task 0: 基準状態と保護対象を固定する

### Files

- No source changes

### Steps

1. `git fetch origin main`で公開基点を最新化する。
2. `git status --short`、`git branch -vv`、`git cherry -v origin/main HEAD`を記録する。
3. `variants/map-09-top-down-game.html`と3つの新規asset module、top-down専用testがまだ存在しないことを確認する。
4. `variants/map-02-refined.html`、本番1・2・4マップ、mobileの開始時tree objectまたはdiffを記録し、完了時比較に使う。
5. 全Nodeテストとbuildを実行し、開始前失敗がないことを確認する。
6. 開始前失敗があれば新機能と混ぜず、既存失敗として報告する。

### Verification

```bash
node --test tests/*.test.mjs
node build.mjs
git diff --exit-code -- variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
```

### Commit checkpoint

変更しない。基準確認だけを行う。

## Task 1: Pattern catalogと安定seedをテスト先行で作る

### Files

- Create: `assets/top-down-game-patterns.js`
- Create: `tests/top-down-game-patterns.test.mjs`

### Steps

1. browserとNodeで共用できる`PixelMapTopDownPatterns` APIの失敗テストを書く。
2. API versionと`top-down-hand-drawn-game-v1` style IDを固定する。
3. 参考画像1寄りのground、forest、water、road、roof、outline paletteを凍結値として定義する。
4. 屋根6種以上、木5種以上、道路4種以上、水域4種以上、地表5種以上のcatalogを作る。
5. 各patternへ一意ID、family、palette、描画primitive、使用条件を持たせる。
6. 文字列を32-bit seedへ変換する安定hashを実装する。
7. MVT layer、feature ID、意味分類、正規化boundsからfeature keyを作る。IDがなくても配列indexへ依存しない。
8. 建物の面積、縦横比、主軸、輪郭複雑度を入力に、利用可能な屋根familyを限定する。
9. 道路class、landcover class、water geometry typeから利用可能なfamilyを限定する。
10. 同じ入力は同じvariantを返し、feature配列順、viewport原点、再描画回数では変わらないことを確認する。
11. 未知値はneutral patternへ縮退し、理由をdiagnosticsへ返す。
12. `Math.random()`がsourceに存在しないことを契約テストで固定する。

### Verification

```bash
node --test tests/top-down-game-patterns.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/top-down-game-patterns.js tests/top-down-game-patterns.test.mjs
git diff --cached --check
git commit -m "feat: add top-down game pattern catalog"
```

## Task 2: 連続座標のscene modelと基底描画を作る

### Files

- Create: `assets/top-down-game-renderer.js`
- Create: `tests/top-down-game-renderer.test.mjs`

### Steps

1. `PixelMapTopDownRenderer` APIと固定compositor順の失敗テストを書く。
2. 投影済みpolygon、polyline、pointを浮動小数のまま受け取るscene入力を定義する。
3. `buildScene()`がlayer別の純粋な描画命令とstatsを返し、`paintScene()`だけがCanvas contextへ依存する境界を作る。
4. neutral groundを黄緑の固定面として生成する。
5. forest、park、farmland、open groundのarea fillとpattern stamp命令を生成する。
6. water areaとwaterway corridorを分け、青緑基底、水際明色帯、濃い輪郭、波紋、浅瀬patternを生成する。
7. local、regional、major、pathの道路classごとに幅とpatternを分け、外縁、副輪郭、砂色面、内部stampを生成する。
8. 同class交差部を一つのmaskとして扱い、継ぎ目を作らない。異なるclassは細い道路から太い道路の順で合成する。
9. railwayを低彩度路盤と二本の暗線として生成し、地下鉄とtunnelは既定sceneへ含めない。
10. bridge属性を持つcorridorだけへ短い構造命令を追加し、構造形式や材質を推測しない。
11. 外周の手描き感を実形状の変形ではなく、副線、色欠け、短いhard-edge stampで表す。
12. 基準geometryが論理ピクセルまたはmap cellへ丸められないことを数値テストで固定する。
13. `paintScene()`が命令を安定sortし、alpha、line join、clip、save/restoreを漏らさないことをmock contextで確認する。

### Verification

```bash
node --test tests/top-down-game-renderer.test.mjs tests/top-down-game-patterns.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/top-down-game-renderer.js tests/top-down-game-renderer.test.mjs
git diff --cached --check
git commit -m "feat: render top-down game terrain"
```

## Task 3: 複数patternの屋根を作る

### Files

- Modify: `assets/top-down-game-renderer.js`
- Modify: `tests/top-down-game-renderer.test.mjs`
- Modify: `tests/top-down-game-patterns.test.mjs`

### Steps

1. 6種類の屋根patternがgeometry条件と安定seedから選ばれる失敗テストを書く。
2. 建物polygonの画面右下へ短い接地影を作る。影は元polygonを動かさず、数screen unit以内へ制限する。
3. 実polygonを屋根外周とし、濃い輪郭、青系基底、面分割、highlight、副線の順で命令を作る。
4. 主軸または最長方向へ棟線を置く。棟線がpolygon外へ出ないようclipする。
5. 強い縦横比は長屋、十分な面積と複雑度は複合棟または大型施設を候補にする。
6. 小建物は2色屋根へ縮退し、読めない棟線や細部を描かない。
7. 建物用途が利用可能ならpaletteと細部密度だけに使い、実形状を大型spriteへ置換しない。
8. 壁面、窓、高さ押し出し、消失点、浮いた施設iconの描画命令が0件であることを固定する。
9. 十分なfixture集合で複数屋根patternが実際に選ばれ、単一variantへ偏らないことを確認する。

### Verification

```bash
node --test tests/top-down-game-patterns.test.mjs tests/top-down-game-renderer.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/top-down-game-renderer.js tests/top-down-game-renderer.test.mjs tests/top-down-game-patterns.test.mjs
git diff --cached --check
git commit -m "feat: add varied top-down roof patterns"
```

## Task 4: 決定論的な樹冠群と衝突maskを作る

### Files

- Modify: `assets/top-down-game-renderer.js`
- Modify: `tests/top-down-game-renderer.test.mjs`

### Steps

1. forest、wood、park、grass area内だけへ候補点を作る失敗テストを書く。
2. 世界座標latticeと安定seedから候補点を生成し、viewport原点へ依存させない。
3. point-in-polygonでarea外候補を除く。
4. water、road、railway、buildingと短いbuilding bufferのmaskに入る候補を除く。衝突候補を別位置へ動かさない。
5. 大樹冠同士の最小間隔を保ち、小樹冠と低木だけを隙間へ許可する。
6. forestは密、parkは疎、grassはごく疎とする意味別密度を固定する。
7. 明るい単独樹、暗い樹冠、小樹、複数樹冠、低木の5patternを描画命令へ変換する。
8. 樹冠は屋根より前へ描き、屋根を覆う命令がないことを確認する。
9. 隣接viewportの共通地理範囲で、候補位置、pattern ID、色、向きが一致することをfingerprintで確認する。

### Verification

```bash
node --test tests/top-down-game-renderer.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/top-down-game-renderer.js tests/top-down-game-renderer.test.mjs
git diff --cached --check
git commit -m "feat: add stable top-down tree clusters"
```

## Task 5: MVT取得・投影・cache runtimeを作る

### Files

- Create: `assets/top-down-game-map.js`
- Create: `tests/top-down-game-runtime.test.mjs`

### Steps

1. browser/Node共用の`PixelMapTopDownMap` APIを要求する失敗テストを書く。
2. PBF primitive、MVT value、geometry command、tile layerをdecodeする純粋関数を実装する。
3. gzip magic bytesを検出し、browserの`DecompressionStream`で展開する。生PBFも受け付ける。
4. z14固定のWeb Mercator緯度経度変換、tile座標、world座標、連続screen座標変換を実装する。
5. 川崎駅周辺の既定中心を固定し、有効な`lat`と`lon` queryだけを初期中心として受け付ける。
6. OpenFreeMap TileJSONを優先し、取得不能時だけ固定fallback templateを使う。
7. viewportと短いbufferに必要なtileだけを取得する。経度方向wrapと緯度方向上限を処理する。
8. tile cache、進行中request deduplication、generation IDを作り、古いviewport requestの完了を新frameへ混ぜない。
9. landcover、landuse、park、water、waterway、transportation、buildingなど必要layerだけを保持する。place、POI名称、label用入力を保持しない。
10. tile offsetを世界座標へ変換し、feature IDまたは安定geometry keyで重複を除く。
11. runtimeが投影済みscene入力をrendererへ渡し、完成frameとdiagnosticsを一度に更新する。
12. 初回、一部tile失敗、全tile失敗、decode失敗、古いgeneration完了、retryの状態遷移をテストする。
13. 同じ地理範囲のfeature/pattern fingerprintが取得順で変わらないことを確認する。

### Verification

```bash
node --test tests/top-down-game-runtime.test.mjs tests/top-down-game-patterns.test.mjs tests/top-down-game-renderer.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/top-down-game-map.js tests/top-down-game-runtime.test.mjs
git diff --cached --check
git commit -m "feat: add standalone top-down map runtime"
```

## Task 6: ドラッグ・現在地・error recoveryを実装する

### Files

- Modify: `assets/top-down-game-map.js`
- Modify: `tests/top-down-game-runtime.test.mjs`

### Steps

1. pointer dragの開始、preview、offset更新、終了後再描画を状態機械としてテストする。
2. mouse左buttonと単一pointerだけでdragを開始し、pointer captureを使う。
3. drag中は直前の完成frameを画面移動量だけ平行移動し、pointer up後に世界座標viewportを更新する。
4. drag終了後に必要tileを追加取得し、共通範囲のpattern fingerprintを維持する。
5. runtimeのbearingを常に0、`bearingLocked:true`とし、query、gesture、端末方位から変更できないことをテストする。
6. `getCurrentPosition`を一回だけ呼ぶ現在地状態を作る。継続watchを作らない。
7. 位置取得成功時は現在地へ再中心化し、tile取得成功後に現在地markerを最前面へ描く。
8. 緯度経度の生値はruntime memoryだけへ保持し、telemetry、独自API、localStorage、sessionStorageへ渡さない。現在地周辺のOpenFreeMap tile requestには、座標から導出したz14 tile番号が現れることを仕様とtestで明示する。
9. permission denied、position unavailable、timeout、非secure context、APIなしを個別messageへ変換する。
10. 現在地取得後のtile失敗では直前viewportとframeへ戻し、現在地buttonを再操作可能にする。
11. 通信retryは失敗tileだけを再取得し、成功済みcacheと完成frameを維持する。
12. status、retry action、location button state、diagnosticsをDOM非依存のview stateとして返す。

### Verification

```bash
node --test tests/top-down-game-runtime.test.mjs
```

### Commit checkpoint

```bash
git add -- assets/top-down-game-map.js tests/top-down-game-runtime.test.mjs
git diff --cached --check
git commit -m "feat: add top-down map navigation states"
```

## Task 7: 全画面の新規testページを接続する

### Files

- Create: `variants/map-09-top-down-game.html`
- Create: `tests/top-down-game-page.test.mjs`
- Modify: `assets/top-down-game-map.js`

### Steps

1. 新ページのtitle、Canvas、現在地button、状態panel、retry button、帰属表示、3module読込を要求する失敗テストを書く。
2. header、設定panel、方位UI、POI UI、名称UIを持たない最小DOMを作る。
3. Canvasを`100vw × 100dvh`へ広げ、CSS viewportと最大2倍のdevice pixel ratioに同期する。
4. 現在地buttonを44 CSS px以上とし、右下safe-areaを避け、`aria-label`とfocus-visibleを付ける。
5. 帰属表示を左下へ低contrastで置き、OpenStreetMap、OpenFreeMap、OpenMapTilesへのlinkを残す。
6. 状態panelを通常時は隠し、初回読込、位置情報失敗、tile失敗、再試行時だけ表示する。
7. Canvasへ地図内容、ドラッグ可能、名称を表示しないことを説明する`aria-label`を付ける。
8. runtime boot成功時に`window.PixelMapTopDownStudy`とroot datasetへ仕様のdiagnosticsを公開する。
9. `labelCount:0`、`poiMarkerCount:0`、`buildingExtrusionEnabled:false`、`bearingLocked:true`をpage contractで固定する。
10. 既存`map-02-refined.html`と本番ページが新module、style ID、profile名を参照しない保護テストを追加する。
11. mobileのsafe area、reduced motion、touch action、desktop resizeをCSS契約で固定する。

### Verification

```bash
node --test tests/top-down-game-page.test.mjs tests/top-down-game-runtime.test.mjs tests/top-down-game-renderer.test.mjs tests/top-down-game-patterns.test.mjs
```

### Commit checkpoint

```bash
git add -- variants/map-09-top-down-game.html assets/top-down-game-map.js tests/top-down-game-page.test.mjs
git diff --cached --check
git commit -m "feat: add top-down hand-drawn map page"
```

## Task 8: Change logと全品質gateを通す

### Files

- Modify: `log.html`
- Modify: `tests/change-log.test.mjs`
- Modify if required by discovered defect: top-down専用source/testだけ

### Steps

1. `tests/change-log.test.mjs`へ2026-09-03項目の必須文言を要求する失敗テストを書く。
2. `log.html`へ最新順でJST日付、変更概要、対象`testのみ`、本番影響なし、実施済み検証を記録する。
3. 検証未実施の項目を完了済みとして書かない。Task 9完了後に最終結果へ更新する。
4. top-down専用testをまとめて実行する。
5. 全Nodeテストを実行する。
6. `node build.mjs`を実行し、新ページと3moduleが`dist/server/index.js`へ含まれることを確認する。
7. `git diff --exit-code`で`map-02`と本番ページに差分がないことを確認する。
8. sourceに`Math.random()`、論理ピクセルへの量子化、label/POI描画、building extrusionがないことを契約testと検索で監査する。

### Verification

```bash
node --test tests/top-down-game-patterns.test.mjs tests/top-down-game-renderer.test.mjs tests/top-down-game-runtime.test.mjs tests/top-down-game-page.test.mjs tests/change-log.test.mjs
node --test tests/*.test.mjs
node build.mjs
git diff --exit-code -- variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
```

### Commit checkpoint

```bash
git add -- log.html tests/change-log.test.mjs
git diff --cached --check
git commit -m "docs: record top-down map test page"
```

## Task 9: 実ブラウザと独立視覚レビューで仕上げる

### Files

- Modify if required by verified defect: top-down専用source/testと`log.html`だけ
- Create validation artifacts with unique names: `screenshots/test-top-down-hand-drawn-*.png`

### Steps

1. localhostの未使用portで静的serverを起動する。
2. desktop viewportで`variants/map-09-top-down-game.html`を開き、load/DOM条件と短い描画待ちで`mapReady=1`を待つ。`networkidle`は使わない。
3. 川崎駅周辺の屋根、木、道路、水面、地表に複数patternが出ていることをdiagnosticsと画面で確認する。
4. root dataset、style ID、bearing 0、bearing lock、label 0、POI marker 0、building extrusion falseを確認する。
5. dragし、render count、viewport、追加tile取得、共通地理範囲のpattern fingerprint維持を確認する。
6. geolocationを川崎市内座標でmockし、button、再中心化、現在地markerを確認する。
7. geolocation拒否をmockし、地図維持、短いmessage、button復帰を確認する。
8. tile requestを一度失敗させ、前frame、retry、復帰を確認する。
9. desktop完成状態を固有名で撮影する。
10. 390×844でsafe area、現在地button、帰属、状態panel、地図密度を確認し、完成状態を撮影する。
11. console warning / errorがないことを確認する。
12. 通常`map-02-refined.html`と本番embeddedを開き、新moduleを要求せず従来診断値を維持することを確認する。
13. 最新desktop/mobile画像、ユーザー提供の参考画像1、元の要望、設計の合否6項目を独立サブエージェントへ渡す。
14. 未解決または新しい視覚回帰があれば、top-down専用sourceだけを修正し、対象test、全test、build、再撮影、再レビューを繰り返す。
15. 最新画像がPASSした後だけ`log.html`の検証結果を確定する。

### Verification

```bash
node --test tests/top-down-game-patterns.test.mjs tests/top-down-game-renderer.test.mjs tests/top-down-game-runtime.test.mjs tests/top-down-game-page.test.mjs tests/change-log.test.mjs
node --test tests/*.test.mjs
node build.mjs
git diff --exit-code -- variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html
```

### Commit checkpoint

視覚修正またはlog確定差分がある場合だけ、対象pathを明示してcommitする。検証スクリーンショットと参考画像はstageしない。

```bash
git add -- assets/top-down-game-patterns.js assets/top-down-game-renderer.js assets/top-down-game-map.js variants/map-09-top-down-game.html tests/top-down-game-patterns.test.mjs tests/top-down-game-renderer.test.mjs tests/top-down-game-runtime.test.mjs tests/top-down-game-page.test.mjs log.html tests/change-log.test.mjs
git diff --cached --check
git commit -m "fix: refine top-down game map visuals"
```

## Task 10: 清潔なworktreeからGitHub Pagesへtest限定公開する

### Files

- No new feature scope
- Release worktree contains only approved design, plan, top-down implementation, tests, and log commits

### Steps

1. `git fetch origin main`で公開基点を更新する。
2. 現在のdirty worktreeの`git status --short`を保存し、変更しない。
3. `mktemp -d`で明示的な一時directoryを作り、最新`origin/main`からrelease branchのclean worktreeを作る。
4. 設計書`942d0b3`、この計画、Task 1から9の実装commitを作成順にcommit IDで明示してcherry-pickする。
5. `git diff origin/main...HEAD --name-status`が承認済みpathだけであることを確認する。
6. release worktreeでtop-down専用test、全Nodeテスト、buildを再実行する。
7. release worktreeのlocalhostからdesktopと390×844を再確認し、公開対象commitでも`mapReady=1`になることを確認する。
8. release branchが最新`origin/main`のfast-forwardであることを確認し、forceなしで`HEAD:main`をpushする。
9. pushed SHAに対応するGitHub Pages buildを特定し、完了まで待つ。
10. repositoryのPages `html_url`をAPIから再取得し、`variants/map-09-top-down-game.html`をcache-buster付きで開く。
11. 公開URLでHTTP 200、`mapReady=1`、style ID、bearing lock、pattern件数、label 0、POI marker 0、drag、console errorなしを確認する。
12. 公開ページのdesktopまたは390×844スクリーンショットを取得し、ローカル承認画像から視覚退行がないことを確認する。
13. 元のdirty worktreeへ戻り、開始時の無関係な変更が保持されていることを確認する。

### Verification

```bash
node --test tests/top-down-game-patterns.test.mjs tests/top-down-game-renderer.test.mjs tests/top-down-game-runtime.test.mjs tests/top-down-game-page.test.mjs tests/change-log.test.mjs
node --test tests/*.test.mjs
node build.mjs
git diff --exit-code origin/main...HEAD -- variants/map-02-refined.html index.html compare.html four-maps.html variants/height-stack-four-map.html mobile
```

### Commit checkpoint

新しい変更は作らない。検証済みcommitを`origin/main`へfast-forward pushする。

## 最終報告

完了報告では次を分けて示す。

1. 新ページで実装した視覚と操作
2. pattern catalogの種類数と決定性
3. 対象test、全test、buildの結果
4. desktop、390×844、drag、現在地、error recoveryの実ブラウザ結果
5. 独立視覚レビュー結果と最終スクリーンショット
6. 本番1・2・4マップ、標準test、mobileが変更されていない証拠
7. pushed commit SHA、GitHub Pages build、公開URLの検証結果
8. test公開であり本番リリースではないこと
