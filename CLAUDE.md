# Task Management Tool

## プロジェクト概要

React 19 + TypeScript + Vite + Zustand + Tailwind CSS のクライアントサイドSPA。
全データはブラウザ内（localStorage）またはローカルファイル（JSON/Excel）に保存。サーバーサイドAPIなし。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — TypeScriptビルド + Viteビルド（`tsc -b && vite build`）
- `npm run lint` — ESLint実行
- `npm run preview` — ビルド結果のプレビュー

## アーキテクチャ

### エントリポイント

- `src/main.tsx` → `src/App.tsx` → `src/components/layout/AppShell.tsx`
- ビュー切替: `src/components/views/ViewContainer.tsx`

### 状態管理（Zustand）

- `src/stores/task-store.ts` — タスク・フィールド・ビュー設定・isDirty
- `src/stores/view-store.ts` — アクティブビュー・ソート・フィルター・グループ
- `src/stores/ui-store.ts` — テーマ・サイドバー・選択状態
- `src/stores/connection-store.ts` — アダプター・接続状態・最終保存
- `src/stores/toast-store.ts` — トースト通知（APIは `addToast()` を使用）

### データアダプター

- `src/adapters/` — DataAdapterパターン
  - `MemoryAdapter`: デモデータセット
  - `LocalFileAdapter`: JSON/Excel（File System Access API経由）

### ビュー

テーブル、カンバン、ガント、カレンダーの4ビュー。

### i18n

日英バイリンガル対応済み。

## セキュリティ規約

- `src/lib/sanitize.ts` にセキュリティユーティリティを集約
- `sanitizeUrl()` — URL XSS防御（TableViewのhrefで使用）
- `sanitizeColor()` — CSSインジェクション防御（`option.color`をstyleに使う箇所は必ず通す）
- `validateTaskDataSet()` — ファイルインポート時のスキーマ検証
- `MAX_FILE_SIZE` — 50MB上限
- ファイルインポートは信頼境界 — 新フィールド追加時はバリデーション考慮

## 依存関係機能

- `src/lib/dependency-utils.ts` — getDependencies, buildDependencyGraph, wouldCreateCycle, getAllDependencyEdges
- 循環依存はDFS検出、追加時にトースト警告でブロック
- GanttView: SVGオーバーレイでベジェ曲線矢印（`pointer-events-none`）
- タスク削除時は依存関係の自動クリーンアップ済み（task-store）

## 注意事項

- xlsxライブラリ (v0.18.5) は非OSS化済み、将来的に代替検討が必要
- 依存関係フィールドの値はタスクID配列 — 表示時は必ずタスク名に解決

## ドキュメント

- `docs/architecture.md` — コンポーネント構成・データフロー図（Mermaid）
- `docs/security-hardening-log.md` — セキュリティ対策の記録
- `docs/screen-map.svg` — 画面マップ
- README.md — プロジェクト概要（要更新: 現在はViteテンプレートのデフォルト）

IMPORTANT: README.mdは現在Viteテンプレートのデフォルト内容のまま。次回の作業機会でプロジェクトの実態に合わせた内容に更新すること。
