# Figma プラグイン — 画面構成マップ自動生成

Task Management Tool の画面構成・遷移関係を Figma キャンバス上に自動配置するプラグインです。

## 生成される内容

| セクション | 内容 |
|-----------|------|
| **① レイアウト構成図** | AppShell全体のレイアウト（Sidebar, Header, ViewContainer, StatusBar, TaskDetailPanel） |
| **② 画面ワイヤーフレーム** | テーブル / カンバン / ガント / カレンダー の4ビュー詳細 |
| **③ 遷移フロー図** | 各操作のトリガー → 状態変更 → 画面変化のフロー |
| **④ 状態管理マップ** | 5つのZustand Store（UIStore, ViewStore, TaskStore, ConnectionStore, ToastStore） |

## セットアップ手順

### 1. 依存関係をインストール

```bash
cd figma-plugin
npm install
```

### 2. TypeScript をビルド

```bash
npm run build
```

これで `code.js` が生成されます。

### 3. Figma にプラグインを読み込む

1. **Figma Desktop App** を開く（※ Webブラウザ版では不可）
2. 任意のファイルを開く
3. メニュー → **Plugins** → **Development** → **Import plugin from manifest...**
4. このフォルダの `manifest.json` を選択
5. プラグインが登録される

### 4. プラグインを実行

1. メニュー → **Plugins** → **Development** → **Task Management Tool - Screen Map Generator**
2. UIが表示される
3. 生成したいセクションにチェックを入れる
4. **「🚀 Figma に生成する」** をクリック
5. キャンバスに全画面構成が自動配置される！

## ファイル構成

```
figma-plugin/
├── manifest.json    # プラグイン定義
├── ui.html          # プラグインUI（チェックボックス + 生成ボタン）
├── code.ts          # メインロジック（TypeScript）
├── code.js          # ← ビルドで生成される（Figmaが読み込む）
├── tsconfig.json    # TypeScript設定
├── package.json     # 依存関係
└── README.md        # このファイル
```

## 開発時

ウォッチモードでTypeScriptを自動コンパイル:

```bash
npm run watch
```

コード変更後、Figma で `Cmd + Option + P` でプラグインを再実行できます。
