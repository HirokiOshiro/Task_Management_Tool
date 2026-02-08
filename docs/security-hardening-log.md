# セキュリティ対策 作業ログ

**実施日**: 2026-02-08
**対象**: タスク管理ツール（クライアントサイドSPA）

---

## 背景

コードベース全体のセキュリティ分析を実施し、以下の脅威を特定した。
このアプリケーションは完全クライアントサイドで外部API通信がないため、攻撃面は限定的だが、**悪意のあるファイルのインポート**が最も現実的な脅威となる。

## 特定された脅威と対策

### 1. URL型フィールドのXSS（重要度: 高）

**脅威**: `url`型フィールドの値が`<a href>`に直接挿入されるため、`javascript:alert(...)` 等の悪意あるURLでスクリプトが実行される可能性があった。

**対策**: `sanitizeUrl()` を導入し、`http:`/`https:`/`mailto:` プロトコルのみ許可。不正なURLはリンクではなくプレーンテキストとして表示する。

**変更箇所**:
- `src/lib/sanitize.ts` — `sanitizeUrl()` 新規作成
- `src/components/views/table/TableView.tsx` — URL型セルのレンダリングに適用

### 2. ファイルインポートの無検証パース（重要度: 高）

**脅威**: JSON/Excelファイルの読み込み時にスキーマ検証がなく、型アサーション（`as TaskDataSet`）のみだった。不正な構造のデータがストアに注入される可能性があった。

**対策**: `validateTaskDataSet()` を導入し、インポートデータの構造（version, fields, tasks, viewConfigs, metadata）を検証。不正なデータはエラーをスローする。Excel隠しシート（`_FieldDefs`, `_ViewConfigs`）のパースにも個別検証を追加。

**変更箇所**:
- `src/lib/sanitize.ts` — `validateTaskDataSet()` 新規作成
- `src/adapters/local-file-adapter.ts` — JSONパース時に検証を適用
- `src/lib/excel/parser.ts` — `_FieldDefs`/`_ViewConfigs` の構造検証 + `isValidFieldDef()`, `isValidViewConfig()` 追加

### 3. CSSインジェクション（重要度: 中）

**脅威**: `option.color` が `style` 属性に直接注入されるため、インポートファイル経由で不正なCSS値（例: `red; background-image: url(https://evil.com/track)`）が挿入される可能性があった。

**対策**: `sanitizeColor()` を導入し、`#RGB`/`#RRGGBB`/`#RRGGBBAA` 形式のみ許可。不正な値はフォールバック色（`#94a3b8`）に置換。レンダリング時（防御の多層化）とインポート時の両方で適用。

**変更箇所**:
- `src/lib/sanitize.ts` — `sanitizeColor()` 新規作成
- `src/components/views/table/TableView.tsx` — select型セルの色に適用
- `src/components/views/kanban/KanbanView.tsx` — カラムヘッダー・優先度バッジに適用
- `src/components/task/TaskDetailPanel.tsx` — select型表示に適用
- `src/components/views/calendar/CalendarView.tsx` — ステータス色に適用
- `src/components/views/gantt/GanttView.tsx` — ステータス色・バー色に適用
- `src/lib/excel/parser.ts` — `_FieldDefs` インポート時にオプション色をサニタイズ

### 4. ファイルサイズ制限（重要度: 低）

**脅威**: ファイルサイズの上限がなく、巨大ファイル（数百MB）の読み込みでブラウザタブがクラッシュする可能性があった。

**対策**: `MAX_FILE_SIZE`（50MB）を定義し、ファイル選択直後にサイズチェック。超過時は日本語エラーメッセージと共に例外をスローする。

**変更箇所**:
- `src/lib/sanitize.ts` — `MAX_FILE_SIZE` 定数
- `src/adapters/local-file-adapter.ts` — `connect()` 内でサイズチェック

## 新規ファイル

| ファイル | 内容 |
|---------|------|
| `src/lib/sanitize.ts` | `sanitizeUrl`, `sanitizeColor`, `validateTaskDataSet`, `MAX_FILE_SIZE` |

## 変更ファイル一覧

| ファイル | 変更概要 |
|---------|---------|
| `src/components/views/table/TableView.tsx` | URL・色サニタイズ |
| `src/components/views/kanban/KanbanView.tsx` | 色サニタイズ（2箇所） |
| `src/components/task/TaskDetailPanel.tsx` | 色サニタイズ |
| `src/components/views/calendar/CalendarView.tsx` | 色サニタイズ |
| `src/components/views/gantt/GanttView.tsx` | 色サニタイズ（2箇所） |
| `src/adapters/local-file-adapter.ts` | スキーマ検証 + サイズ制限 |
| `src/lib/excel/parser.ts` | 隠しシート検証 + 色サニタイズ + ヘルパー関数追加 |

## UXへの影響

なし。すべてデータ入力境界（ファイルインポート・レンダリング直前）のバリデーションであり、通常の操作フローには影響しない。

- 正常なJSON/Excelファイルはこれまで通り読み込み可能
- 不正なファイルはエラーメッセージ付きで拒否される
- 不正なURLは安全にプレーンテキストとして表示される
- 不正なカラー値はフォールバック色で表示される

## 対策対象外（現時点でリスク受容）

| 項目 | 理由 |
|------|------|
| localStorage の平文保存 | クライアントサイドツールの設計上の制約。ヘルプガイドで注意喚起済み |
| `xlsx` ライブラリの脆弱性 | `npm audit` で個別対応。ライブラリ自体の置換は別タスク |
| Prototype Pollution（`Object.assign`） | Immerプロキシ経由のため実リスクは極めて低い |

## 検証

- `npm run build` — 型エラー・ビルドエラーなし（確認済み）
- ブラウザ動作確認 — デモデータの表示、ファイルインポート/エクスポート
