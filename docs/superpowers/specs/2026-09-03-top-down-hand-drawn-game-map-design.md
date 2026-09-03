# 真上視点の手描きピクセルゲーム地図 test 設計

- 日付: 2026-09-03
- 対象: 新規 standalone test `variants/map-09-top-down-game.html`
- 状態: チャット設計承認済み、文書レビュー待ち
- 参考: ユーザー提供画像1の、青緑の水、深い森林、青系屋根、砂色の道を持つ真上視点ゲーム地図

## 背景

現在の PixelMap は、OpenFreeMap の MVT を独自に読み込み、地形、交通、建物、施設を Canvas 2D へ描く。標準の standalone test と本番1・2・4マップでは、論理ピクセルへ再ラスタライズしたレトロRPG表現と、ADR-0003で採用した画面垂直押し出しによる建物高さ表現を使う。

今回の目的は、その標準描画を置き換えることではない。実地図の地理形状を保ちながら、参考画像1のような真上視点、屋根中心、濃密な自然、手描き感のあるゲーム地図を、独立した新しい test ページで検証することである。

当初は `map-02-refined.html?profile=topdown-game&presentation=art` を新ページから呼び出す案を検討したが、既存testへの隠れた依存と分岐を避けるため採用しない。新ページは専用runtime、pattern catalog、rendererを直接読み込む。`variants/map-02-refined.html`と本番ページは変更しない。

## 承認済み判断

1. 新しい入口は `variants/map-09-top-down-game.html` とする。
2. 参考画像1寄りの、鮮やかな青緑の水、深い緑、青系の屋根、明るい砂色の道を採用する。
3. 地物形状を論理ピクセルグリッドへ揃えない。連続した投影座標を使い、限定色、硬い色面、粒、輪郭、patternで手描きピクセル感を作る。
4. 建物は屋根中心とし、壁面、窓、高さ押し出しを描かない。
5. 屋根、木、森林、道路、水面、地表へ複数の描画patternを用意する。
6. 名称、道路名、浮いたPOIアイコンを表示しない。施設性は屋根や地表の表現へ統合する。
7. 画面は作品表示に特化し、通常時は現在地ボタンと法的に必要な地図データ帰属だけを重ねる。
8. 操作はドラッグ移動と一回限りの現在地取得だけとする。表示方位は北向きに固定し、回転、ピンチズーム、施設選択を提供しない。
9. 地理データにない川、森林、建物は追加しない。データにない屋根形式や素材patternは、実在情報ではなくゲーム上の視覚variationとして扱う。
10. `map-02-refined.html`、本番1・2・4マップ、mobileは変更しない。

## 目的

1. 初見で、真上から見たゲーム世界の地図として読めること。
2. 同じ屋根、木、道路模様が機械的に連続せず、参考画像のような描き込みのvariationを感じられること。
3. 川、海岸、道路、鉄道、建物、森林、公園などの位置関係は実データと一致すること。
4. ドラッグまたは再読込後も、同じ地物のpattern、色、向き、細部が変化しないこと。
5. デスクトップと390×844のモバイル表示で、余計なUIに遮られず地図を鑑賞できること。
6. 既存testと本番の描画経路へ影響を与えず、GitHub Pages上の独立URLで評価できること。

## 対象外

- `variants/map-02-refined.html`へのprofile、query parameter、リンク、描画分岐の追加
- `index.html`、`compare.html`、`four-maps.html`、`variants/height-stack-four-map.html`への反映
- Expo / React Native の `mobile/` 実装
- ADR-0003の標準建物投影を変更または廃止すること
- 論理ピクセル、cell2、cell3への適合
- 表示方位の変更、端末方位追従、移動方位追従
- ピンチズーム、施設選択、経路案内、検索、設定パネル
- 名称、道路名、番地、施設ラベル、浮いたPOIアイコン
- 参考画像そのもの、切り抜き、生成画像、外部bitmap素材を成果物へ含めること
- 実データにない地理的対象を装飾目的で追加すること
- 本番リリース

## 採用方式

### 独立ページと専用module

新ページは既存の大規模HTMLを複製せず、役割別の新規moduleを直接読み込む。

```text
variants/map-09-top-down-game.html
  ├─ assets/top-down-game-map.js
  ├─ assets/top-down-game-patterns.js
  └─ assets/top-down-game-renderer.js
```

- `map-09-top-down-game.html`: Canvas、現在地ボタン、状態表示、帰属表示、全画面CSSを持つ。
- `top-down-game-map.js`: TileJSON/MVT取得、MVT decode、投影、viewport、ドラッグ、現在地、tile cache、再描画、runtime diagnosticsを担当する。
- `top-down-game-patterns.js`: palette、pattern catalog、意味分類、地物ごとの決定論的variant選択を担当する。CanvasやDOMへ依存しない。
- `top-down-game-renderer.js`: 投影済み地物とpattern選択結果を受け取り、地表、水域、交通、植生、屋根、現在地を描く。位置取得やnetwork取得へ依存しない。

`top-down-game-patterns.js`と`top-down-game-renderer.js`は、Nodeテストから読み込めるUMD形式または同等のbrowser/Node共用形式とする。pattern選択と描画命令生成は純粋関数として検証できる境界を保つ。

### 採用しない方式

`map-02-refined.html`のquery profileとして実装する方式は採用しない。MVT読込やドラッグを再利用しやすい一方、新しい研究ページが標準testの内部構造へ依存し、標準testと本番embeddedが共有するファイルへ新しい分岐を入れるためである。

`map-02-refined.html`を丸ごと複製する方式も採用しない。新ページに不要な設定、施設選択、複数renderer、互換分岐を引き継ぎ、将来の同期責任が生じるためである。

完成bitmapを1枚表示する方式は採用しない。ドラッグ、現在地、実地図更新、地物ごとの安定variationを実現できないためである。

## データフロー

1. ページ起動時に、川崎駅周辺を初期中心とするz14 viewportを作る。
2. viewportを覆うMVT tileをOpenFreeMapから取得し、tile cacheへ保存する。
3. 必要なarea、line、polygon featureをdecodeし、世界座標へ正規化する。
4. 表示方位0度のまま、世界座標を連続した画面座標へ投影する。
5. featureの意味、幾何特性、安定seedからpattern variantを選ぶ。
6. rendererが固定compositor順でCanvasへ描く。
7. ドラッグ中は既存frameを即座に移動し、終了後に新viewportを取得して再描画する。
8. 現在地取得成功時は緯度経度を新しい中心へ変換し、同じ処理で再描画した後、現在地記号を最前面へ重ねる。

新ページは名称用layerとPOI marker layerを要求または描画しない。施設敷地や建物用途として必要な意味情報だけを、地表または屋根patternの選択へ使う。

## 座標と手描きピクセル表現

MVT頂点は論理ピクセル、map cell、cell2、cell3へ量子化しない。viewportから得た浮動小数の画面座標をCanvas pathへ渡す。地理形状の中心線または境界を装飾のために移動しない。

手描き感は次の方法で付加する。

- 連続gradientではなく、3から5段階の固定色面を使う。
- 輪郭に沿って、短い線、欠け、明暗の重なりを決定論的に配置する。
- 道、水面、屋根、樹冠の内部へ、小さなhard-edge stampを疎に置く。
- stampの位置は世界座標へ固定し、viewport原点へ固定しない。
- 外周の揺らぎは実形状を変形せず、元の輪郭上へ重ねる副線または色欠けとして表現する。
- Canvas解像度はCSS viewportとdevice pixel ratioから決めるが、pattern寸法は視覚用screen unitとして管理し、PixelMapの論理ピクセル契約へ接続しない。
- bitmapの拡大縮小によるぼけ、連続gradient、毎frame変わる乱数は使わない。

## 安定seedとpattern選択

各featureは、可能ならMVT layer名とfeature IDから安定keyを作る。IDがない場合はlayer名、意味分類、正規化した世界座標boundsからkeyを作る。表示位置、読込順、tile内配列indexだけには依存しない。

安定keyから得たseedは次だけを選ぶ。

- pattern ID
- palette内の色variant
- patternの反転または向き
- 粒、棟線、枝葉、波紋などの細部位相

seedは地物の意味分類、実形状、道路幅、建物面積を変更しない。同じfeatureが隣接tileへ重複する場合は世界keyでdeduplicateし、同じ地物を二重描画しない。

pattern選択優先順位は次とする。

1. 実データに地物種別、建物用途、道路class、地表classがあれば対応するpattern familyへ限定する。
2. 建物の面積、縦横比、主軸、輪郭の複雑さから利用可能な屋根構造を限定する。
3. 森林、公園、農地などの意味から植生密度とpattern familyを限定する。
4. 同じfamily内でseedを使いvariantを選ぶ。
5. 矛盾または未知値は、意味を主張しないneutral patternへ縮退する。

## Pattern catalog

初期catalogは、少なくとも次のvariationを持つ。

### 屋根

1. 短い中央棟を持つ切妻風
2. 長い中央棟を持つ長屋風
3. 四辺へ落ちる寄棟風
4. 小さな設備または天窓模様を持つ平屋根風
5. 複数の棟線を持つ複合棟風
6. 大型施設用の強い縁取りと複数面を持つ屋根

色は青、青灰、濃紺を中心とし、意味上必要な場合だけ石灰色または抑えた茶を使う。実roof tagが入力にない場合、切妻、寄棟、素材はゲーム上の視覚variationであり実在の屋根形式を表さない。

### 木と森林

1. 明るい中央を持つ丸い広葉樹風
2. 暗い外周が強い樹冠
3. 小さな単独樹
4. 2から4個の樹冠が重なる群
5. 低木または林縁の小さなまとまり

森林は候補点密度を高くし、公園は疎らにする。候補点は世界座標gridとseedから生成し、水域、道路、鉄道、建物の占有範囲を避ける。建物の輪郭へ軽く近接してもよいが、屋根面を覆わない。

### 道路と小径

1. 明るい砂色の生活道路
2. 踏み固めた色むらを持つ地区道路
3. 疎な石畳風stampを持つ主要道路
4. 細く不均一な小径

道路classは幅とpattern familyを決める。実surface tagがない道路へ、未舗装などの事実を意味する表現は付けない。砂、土、石畳という名称はゲーム上の見た目を示し、runtime diagnosticsでも実surface分類とは分離する。中央線は描かない。

### 水域

1. 開けた青緑の水面
2. 疎な短い流れ線
3. 水際の明色帯と細かな石状stamp
4. 浅瀬風の明暗pattern

水際のstampは岸の装飾であり、島、岩、浅瀬など新しい地理形状を作らない。水面areaとwaterway corridorは別に分類し、合流部で不自然な二重輪郭を避ける。

### 地表

1. 黄緑の草地
2. 深緑の下草
3. 明るい土または広場
4. 農地の短い畝
5. 公園の疎な草模様

pattern catalogはデータだけで表し、renderer内へ地物別の色やstamp配列を散在させない。

## 建物の屋根表現

建物はMVT polygonの実形状を屋根外周として使う。高さ値は壁面または押し出し量へ使わない。描画は次の順とする。

1. 元の輪郭から画面右下へ数screen unit以内の短い接地影
2. 濃い屋根外周
3. 青系の屋根基底面
4. 幾何主軸または最長方向へ沿う棟線
5. pattern固有の面分割、hard-edge highlight、細部stamp
6. 外周の一部へ置く手描き風の副線または色欠け

建物の縦横比が強い場合は長屋風、十分大きく輪郭が複雑な場合は複合棟または大型施設patternを候補にする。小さすぎて棟線を読めない建物は、濃い輪郭と単純な2色屋根へ縮退する。

施設の意味が入力にある場合は、屋根palette、棟線の強さ、周囲の地表patternへ反映できる。ただし浮いたアイコン、文字、実形状を超える大型spriteは置かない。

## 植生配置

樹冠は実データのforest、wood、park、grassなど許可されたarea内部だけへ配置する。候補点は一定の世界間隔で生成し、seedで残す点とpatternを決める。

配置時は次のmaskを確認する。

- 水域
- 道路と小径
- 鉄道
- 建物と短い外周buffer
- 描画済みの大きな樹冠

候補点がmaskと衝突する場合は、地理形状を避けて移動せず、その点を描かない。これにより森林が道路や建物を押し動かさない。森林areaは密な重なり、公園は歩ける余白を残す疎な配置とする。

## 道路・鉄道・橋

道路は実centerlineからCanvas strokeを作り、classごとの幅を使う。最外縁の茶緑、副輪郭、明るい砂色面、疎な内部stampの順に描く。交差点は同じclassのmaskをunionして継ぎ目を消す。異なるclassは細い道路から太い道路の順に合成し、主要道路を連続させる。

鉄道は、参考画像の雰囲気を壊さない低彩度の路盤と二本の暗線で表す。線路中心の実形状を維持し、道路のような砂色面へ同化させない。地下鉄と鉄道トンネルは初期既定では表示しない。

橋はMVTのbridge属性を持つ道路または鉄道だけを対象とする。通過する道路または鉄道のpatternを保ち、岸または水面との境界で短い濃色構造を追加する。構造形式や材質を推測する大型橋spriteは今回導入しない。

## 水域と地表

水域は青緑の基底、水際の明色帯、濃い外周、副輪郭、短い波紋を合成する。海岸または河岸の帯はarea境界に沿って内側または外側へ一定幅で描く。細いwaterwayは水面areaと同じpaletteを使い、幅に応じてpattern数を減らす。

地表は黄緑を基調にする。土地利用polygonは地理分類を読める程度の低いcontrastに抑え、都市全体を灰色の面で覆わない。森林、農地、公園、広場は専用patternで差を作る。patternがない未知分類は黄緑のneutral groundへ縮退する。

## Compositor

固定描画順は次とする。

1. neutral ground
2. landcover / landuse
3. water area / waterway
4. road / path / railway ground corridor
5. bridge structure
6. vegetation canopy
7. building contact shadow
8. building roof
9. current-location marker
10. transient status UI and attribution

植生候補は建物maskを避け、屋根は植生より後に描く。これにより参考画像の密度を持たせつつ、屋根を樹冠で隠さない。名称とPOI markerはcompositorに含めない。

## 画面と操作

`map-09-top-down-game.html`はviewport全体をCanvasで埋める。通常時の可視UIは次だけとする。

- 右下の現在地ボタン
- 左下のOpenStreetMap / OpenFreeMap / OpenMapTiles帰属表示

タイトル、設定パネル、診断表示、名称、POIアイコンは表示しない。診断値はDOM datasetと`window.PixelMapTopDownStudy`から検査可能にし、画面へ常設しない。

現在地ボタンは44 CSS px以上のhit targetとし、セーフエリアを避ける。文字を常設せず現在地記号を使うが、`aria-label`とfocus-visibleを持たせる。

Canvasはpointer dragを受け付ける。ドラッグ中は現在frameを移動して応答し、pointer up後に新しい地理範囲を再描画する。表示方位は常に0度で、bearing query parameterや回転UIを持たない。ピンチ操作はzoomへ割り当てず、ページscrollまたはbrowser既定動作との競合を避ける。

## 現在地

現在地はボタンを押したときだけ`navigator.geolocation.getCurrentPosition`で一回取得する。継続追跡、heading取得、background locationは行わない。

成功時は次を行う。

1. 緯度経度をworld coordinateへ変換する。
2. viewport中心を現在地へ移す。
3. 必要tileを取得して再描画する。
4. 現在地を小さな高contrast記号として最前面へ描く。

取得した座標はページruntime内だけで使い、networkへ送信せず、localStorageへ保存しない。位置情報が利用不能または拒否された場合は地図を維持し、短い状態messageを表示してボタンを再び操作可能に戻す。

## 状態とエラー処理

通常時は状態messageを隠す。必要時だけ画面下部へ小さな高contrast panelを重ねる。

- 初回読込中: 「地図を描いています」を表示し、最初のframe完成後に消す。
- tile取得失敗: 取得済みの前frameを残し、再試行buttonを表示する。
- 一部tile失敗: 描ける範囲を維持し、不完全であることと再試行を表示する。
- MVT decode失敗: 対象tileを失敗として隔離し、ページ全体を停止させない。
- pattern選択失敗: neutral patternへ縮退し、diagnosticsへ理由を残す。
- 描画失敗: 直前の完成frameを残し、再描画を選べる状態にする。
- 位置情報拒否、timeout、利用不能: 原因に合う短いmessageを表示し、地図操作を維持する。

再試行は現在viewportの失敗tileだけを再取得し、成功済みcacheを破棄しない。runtime errorは`window.PixelMapTopDownStudy.diagnostics`へ件数と最終理由を残す。

## Runtime diagnostics

視覚UIを増やさず検証できるよう、少なくとも次を公開する。

```js
window.PixelMapTopDownStudy = {
  ready,
  version,
  styleId: 'top-down-hand-drawn-game-v1',
  tileZoom: 14,
  bearing: 0,
  bearingLocked: true,
  viewport,
  renderCount,
  tileCacheSize,
  featureCounts,
  patternCounts,
  patternFingerprint,
  labelCount: 0,
  poiMarkerCount: 0,
  buildingExtrusionEnabled: false,
  locationState,
  diagnostics
}
```

`document.documentElement.dataset`には`mapReady`、`styleId`、`bearingLocked`、`renderCount`、`patternFingerprint`を反映する。pattern fingerprintは同じ地理範囲とversionで安定し、viewportの単なる画面移動順には依存しない。

## アクセシビリティとresponsive表示

- Canvasは地図であること、ドラッグ可能であること、名称表示を持たないことを`aria-label`で説明する。
- 状態messageは`role="status"`、通信失敗など操作が必要なmessageは適切な再試行buttonを持つ。
- 現在地buttonはkeyboard focusとEnter/Space操作に対応する。
- `prefers-reduced-motion`では読込や現在地の装飾animationを停止する。
- 390×844では現在地button、帰属表示、状態messageが重ならず、safe-area insetを避ける。
- desktopではCanvasをviewport全体へ広げ、余白や外側panelを作らない。

## 自動テスト

新規テストでは少なくとも次を検証する。

### Pattern catalog

- 屋根6種以上、木5種以上、道路4種以上、水域4種以上、地表5種以上が登録される。
- 全patternが一意ID、対応family、固定palette、描画primitiveを持つ。
- 同じfeature keyとgeometryから常に同じvariantが選ばれる。
- viewport位置、feature配列順、再描画回数を変えても選択が変わらない。
- 複数fixtureで単一variantだけに偏らない。
- 未知分類がneutral patternへ安全に縮退する。

### Renderer

- compositorが仕様の固定順を守る。
- 屋根命令に壁面、窓、高さ押し出しが含まれない。
- 名称とPOI marker命令が生成されない。
- 植生候補が水域、道路、鉄道、建物maskへ入らない。
- 地物の基準形状が論理ピクセルまたはmap cellへ丸められない。
- 再描画した共通地理範囲のpattern fingerprintが一致する。
- error時に直前frameを維持し、neutral fallbackまたはretryへ遷移する。

### Page contract

- `map-09-top-down-game.html`が専用3moduleだけを新規地図runtimeとして読み込む。
- 現在地buttonと帰属表示が存在し、設定、名称、POI UI、方位UIが存在しない。
- `map-02-refined.html`、本番1・2・4マップが新しいmodule、style ID、profile名を参照しない。
- `log.html`がJST日付、変更概要、対象モード、本番影響、検証内容を記録する。

全Nodeテストと`node build.mjs`を実行する。

## Browser検証

ローカル実ブラウザで次を確認する。

1. desktop viewportで川崎駅周辺を表示する。
2. 390×844で同じページを表示する。
3. `mapReady=1`、style ID、北向き固定、pattern件数、label 0、POI marker 0を確認する。
4. 屋根、木、道路、水面、地表に複数patternが見えることを確認する。
5. ドラッグ前後の共通地理範囲で、同じ建物と樹木patternが維持されることを確認する。
6. 現在地成功をmockし、再中心化と現在地記号を確認する。
7. 位置情報拒否をmockし、地図維持、message、button復帰を確認する。
8. tile通信失敗と再試行を確認する。
9. console warning / errorがないことを確認する。
10. 通常の`map-02-refined.html`と本番embeddedが変更前の経路を維持することを確認する。

## 視覚検証

最低限、desktopと390×844の完成状態を撮影する。必要に応じて森林、水辺、屋根variationが同時に見える地点も追加撮影する。

最新スクリーンショットとユーザー提供の参考画像1を、元の要望とともに独立サブエージェントへ渡す。レビュー項目は次とする。

1. 真上視点で、壁面や高さ押し出しが見えない。
2. 青緑の水、深い森林、青系屋根、砂色道路が参考画像1寄りにまとまる。
3. 屋根、木、道路、水面、地表に複数variationがあり、単一stampの反復に見えない。
4. 手描き感とピクセル感が両立し、単なる滑らかなベクター地図または既存PixelMapの色替えに見えない。
5. 名称、浮いたPOI、余計なUIが景観を遮らない。
6. desktopとmobileで欠け、重なり、ぼけ、ちらつき、過密による判読不能がない。

未解決または新しい視覚回帰が指摘された場合は、修正、再撮影、再レビューを繰り返す。最新画像がPASSになるまで公開と完了報告を行わない。

## 変更対象

初期実装の変更対象は次に限定する。

- `variants/map-09-top-down-game.html` 新規
- `assets/top-down-game-map.js` 新規
- `assets/top-down-game-patterns.js` 新規
- `assets/top-down-game-renderer.js` 新規
- `tests/top-down-game-map.test.mjs` 新規
- 必要なら責務別の追加test file
- `log.html` 更新

次は変更しない。

- `variants/map-02-refined.html`
- `index.html`
- `compare.html`
- `four-maps.html`
- `variants/height-stack-four-map.html`
- `mobile/`
- 既存の共有描画asset

## Change log

`log.html`へ最新順で2026-09-03 JSTの項目を追加する。

- 変更概要: 真上視点の手描きピクセルゲーム地図を新規ページへ追加
- 対象モード: `testのみ`、`variants/map-09-top-down-game.html`
- 本番影響: なし。標準standalone testと本番1・2・4マップは変更なし
- 検証内容: 自動テスト、build、desktop、390×844、ドラッグ、現在地成功/拒否、通信復帰、console、最新スクリーンショット、独立視覚レビュー

## Deployment

実装と検証後、既存dirty worktreeの無関係な変更を含めず、意図したfileだけを明示的にstageする。test-onlyの変更としてcommitし、`origin/main`へpushする。

GitHub Pages workflowの対象commit成功を待ち、公開された`variants/map-09-top-down-game.html`をcache-buster付きで開く。HTTP 200だけでなく、`mapReady=1`、style ID、北向き固定、複数pattern件数、label 0、POI marker 0、console errorなし、ドラッグを確認する。公開ページのスクリーンショットも取得し、ローカル検証と同じ視覚要件を満たすことを確認する。

これはtestページの公開であり、本番リリースではない。本番1・2・4マップへ反映する場合は、別の明示的な本番リリース依頼と設計判断を必要とする。

## 完了条件

1. 新規URLで実地図が真上視点の手描きピクセルゲーム地図として描画される。
2. 屋根、木、道路、水面、地表に複数の決定論的patternが使われる。
3. 建物は屋根中心で、壁面、窓、高さ押し出しがない。
4. 名称、道路名、浮いたPOIアイコンが表示されない。
5. ドラッグ、現在地成功、位置情報拒否、通信再試行が動作する。
6. 北向き固定と地理形状の維持が診断値と実画面で確認できる。
7. 全自動テストとbuildが成功する。
8. desktopと390×844の最新スクリーンショットが独立視覚レビューでPASSする。
9. `map-02-refined.html`、本番1・2・4マップ、mobileに差分がない。
10. `log.html`が更新され、GitHub Pagesの公開URLで再検証される。
