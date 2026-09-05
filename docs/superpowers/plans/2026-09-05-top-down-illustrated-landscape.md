# 彩色ゲーム地図の実装手順

承認済み設計：`../specs/2026-09-05-top-down-illustrated-landscape-design.md`

1. `origin/main` を土台に、standaloneの明示profileだけから専用ページへ接続する。
2. 既存のMVTデコードと座標変換を再利用し、専用runtimeで取得・世代管理・再試行・現在地・ドラッグを扱う。
3. MVTのポリゴン断片を穴を保って結合し、棟単位の表示判定、屋根構造、植生領域と通路の衝突判定を実装する。
4. 共通色と線で地表・水・道路・樹冠・屋根を描き、架空と明示した構成見本および実地図で確認する。
5. 地理保持、描画pixel、配置安定性、失敗復帰を検証し、736×952と390×844の最新画像を独立レビューする。
6. `log.html` と検証記録を更新し、対象ファイルだけをcommit・pushする。Pages buildと公開画面を確認する。

公開中の旧topdown、通常standalone、本番1・2・4マップ、mobile、既存素材ラボには反映しない。

再現用のブラウザ検証は `scripts/check-illustrated-landscape.cjs`。`PIXELMAP_BASE_URL` でローカルとPagesを切り替え、`PIXELMAP_QA_OUTPUT` へ画像とreport.jsonを保存する。playwrightをNodeのモジュール検索パスに用意する。
