# PixelMap V2 OSM contract

V2 の表示対象は `rules.js` の `DISPLAY` にある 3 系統だけです。`REFERENCE` は位置の刻印・照合に、`AGGREGATE` は町の性格集計にだけ使い、レンダラーへ渡しません。

抽出は次の形で行います。参照ノード／メンバーは形状構築に必要なため残し、`-t` で抽出条件に直接一致しない参照オブジェクトのタグを除去します。

```sh
osmium tags-filter \
  --expressions=v2/osmium-tags-filter.txt \
  --remove-tags \
  --output=v2.osm.pbf \
  source.osm.pbf
```

レンダリング時の面競合は、低い順に `grass → sand → farmland → forest → water` です。橋区間を含む主要道路と地上鉄道はその後、町とランドマークは最後に置きます。

下流のベクタータイルには、名称のほか `wikidata`、`heritage`、`area_m2`、`religion` を維持します。町の集計結果は `town_character` として city/town にだけ付与し、suburb には付与しません。

現在の GitHub Pages 版は OpenFreeMap の OpenMapTiles 互換レイヤーを V2 のホワイトリストへ射影して表示します。`rules.js` は、生タグ由来の専用タイルへ切り替えても同じ表示契約になる互換境界です。
