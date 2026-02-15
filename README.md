# Task Management Tool

ブラウザ上で動作する、ローカル完結型のタスク管理ツールです。  
テーブル / カンバン / ガント / カレンダーの4ビューで同じデータを管理できます。

## 主な特徴

- 完全クライアントサイド動作（サーバー保存なし）
- タスク・フィールド・ビュー設定を一元管理
- JSON / Excel（.xlsx）で保存・再読み込み
- CSV / Excel（.xlsx）インポート対応
- 日本語 / 英語 UI 切り替え

## クイックスタート（開発）

```bash
npm install
npm run dev
```

ビルド確認:

```bash
npm run build
```

## データ保存とセキュリティ上の注意

- データは `localStorage` に自動保存されます（ページ再訪時に復元）。
- 重要データは定期的に JSON でバックアップしてください（復元用途の推奨形式）。
- 共有端末では利用後に保存し、必要に応じてブラウザ保存データを削除してください。
- インポート時は安全性検証を行うため、不正構造や未対応キーを含むデータは取り込まれない場合があります。
- Excelエクスポート時は Formula Injection 対策として、先頭が `=`, `+`, `-`, `@` の文字列をテキストとして保存します。

## 想定利用上の補足

- 機密情報を長期間 `localStorage` に保持する運用は非推奨です。
- ブラウザデータ削除・端末変更時は `localStorage` 上のデータが失われます。

## ドキュメント

- アーキテクチャ: [docs/architecture.md](docs/architecture.md)
- セキュリティ対策ログ: [docs/security-hardening-log.md](docs/security-hardening-log.md)

## 技術スタック

- React 19 / TypeScript / Vite
- Zustand
- Tailwind CSS
