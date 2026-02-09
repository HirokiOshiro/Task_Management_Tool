// ─────────────────────────────────────────
// Task Management Tool — Figma Screen Map Generator
// ─────────────────────────────────────────
// このプラグインは、タスク管理ツールの画面構成・遷移関係を
// Figma キャンバス上にフレーム・テキスト・コネクタとして自動生成します。

figma.showUI(__html__, { width: 320, height: 420 });

// ── カラーパレット ──
const COLORS = {
  purple:     { r: 0.54, g: 0.39, b: 0.96 },  // #8b5cf6
  blue:       { r: 0.23, g: 0.51, b: 0.96 },  // #3b82f6
  green:      { r: 0.13, g: 0.77, b: 0.37 },  // #22c55e
  orange:     { r: 0.98, g: 0.45, b: 0.09 },  // #f97316
  amber:      { r: 0.96, g: 0.62, b: 0.04 },  // #f59e0b
  red:        { r: 0.94, g: 0.27, b: 0.27 },  // #ef4444
  slate:      { r: 0.58, g: 0.64, b: 0.72 },  // #94a3b8
  indigo:     { r: 0.39, g: 0.40, b: 0.95 },  // #6366f1
  white:      { r: 1,    g: 1,    b: 1    },
  bgLight:    { r: 0.97, g: 0.98, b: 0.99 },  // #f8fafc
  bgMuted:    { r: 0.95, g: 0.96, b: 0.97 },  // #f1f5f9
  textDark:   { r: 0.12, g: 0.16, b: 0.21 },  // #1e293b
  textMuted:  { r: 0.39, g: 0.45, b: 0.53 },  // #64748b
  border:     { r: 0.89, g: 0.91, b: 0.94 },  // #e2e8f0
  purpleLight:{ r: 0.93, g: 0.91, b: 0.99 },  // #ede9fe
  blueLight:  { r: 0.94, g: 0.96, b: 1    },  // #eff6ff
  greenLight: { r: 0.94, g: 0.99, b: 0.95 },  // #f0fdf4
  orangeLight:{ r: 1,    g: 0.97, b: 0.93 },  // #fff7ed
  amberLight: { r: 1,    g: 0.95, b: 0.78 },  // #fef3c7
  purplePale: { r: 0.98, g: 0.96, b: 1    },  // #faf5ff
};

// ── ヘルパー関数 ──
async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
}

function createText(
  text: string,
  x: number,
  y: number,
  size: number,
  color: RGB,
  weight: "Regular" | "Medium" | "Semi Bold" | "Bold" = "Regular",
  width?: number
): TextNode {
  const node = figma.createText();
  node.x = x;
  node.y = y;
  node.fontName = { family: "Inter", style: weight };
  node.fontSize = size;
  node.fills = [{ type: "SOLID", color }];
  node.characters = text;
  if (width) {
    node.resize(width, node.height);
    node.textAutoResize = "HEIGHT";
  }
  return node;
}

function createRoundedRect(
  x: number, y: number, w: number, h: number,
  fill: RGB, stroke?: RGB, strokeWeight?: number, radius?: number
): RectangleNode {
  const rect = figma.createRectangle();
  rect.x = x;
  rect.y = y;
  rect.resize(w, h);
  rect.cornerRadius = radius ?? 8;
  rect.fills = [{ type: "SOLID", color: fill }];
  if (stroke) {
    rect.strokes = [{ type: "SOLID", color: stroke }];
    rect.strokeWeight = strokeWeight ?? 1.5;
  }
  return rect;
}

function createLine(
  x1: number, y1: number, x2: number, y2: number,
  color: RGB, weight: number = 2, dash?: number[]
): LineNode {
  const line = figma.createLine();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  line.x = x1;
  line.y = y1;
  line.resize(length, 0);
  line.rotation = -angle * (180 / Math.PI);
  line.strokes = [{ type: "SOLID", color }];
  line.strokeWeight = weight;
  if (dash) {
    line.dashPattern = dash;
  }
  // 矢印
  line.strokeCap = "ARROW_LINES";
  return line;
}

function createFrame(
  name: string, x: number, y: number, w: number, h: number,
  fill?: RGB
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(w, h);
  frame.clipsContent = false;
  if (fill) {
    frame.fills = [{ type: "SOLID", color: fill }];
  } else {
    frame.fills = [];
  }
  return frame;
}

// ── カード作成ヘルパー ──
function createCard(
  parent: FrameNode,
  x: number, y: number, w: number, h: number,
  headerText: string,
  headerBg: RGB,
  bodyBg: RGB,
  borderColor: RGB,
  bodyLines: { text: string; size: number; color: RGB; weight?: "Regular" | "Medium" | "Semi Bold" | "Bold"; y: number }[]
) {
  // カード背景
  const bg = createRoundedRect(x, y, w, h, bodyBg, borderColor, 2);
  parent.appendChild(bg);

  // ヘッダー背景
  const header = createRoundedRect(x, y, w, 36, headerBg);
  header.cornerRadius = 0;
  // 上部のみ丸角
  header.topLeftRadius = 8;
  header.topRightRadius = 8;
  header.bottomLeftRadius = 0;
  header.bottomRightRadius = 0;
  parent.appendChild(header);

  // ヘッダーテキスト
  const headerLabel = createText(headerText, x + 16, y + 10, 13, COLORS.white, "Semi Bold");
  parent.appendChild(headerLabel);

  // ボディテキスト
  for (const line of bodyLines) {
    const t = createText(line.text, x + 16, y + 36 + line.y, line.size, line.color, line.weight ?? "Regular", w - 32);
    parent.appendChild(t);
  }
}

// ── セクション：レイアウト構成図 ──
function generateLayout(root: FrameNode) {
  const section = createFrame("1. レイアウト構成図", 0, 0, 1600, 920, COLORS.bgLight);
  root.appendChild(section);

  // タイトル
  section.appendChild(createText("📐 AppShell — レイアウト構成図", 40, 30, 24, COLORS.textDark, "Bold"));
  section.appendChild(createText("SPA構成：Sidebar | Header + ViewContainer + StatusBar | TaskDetailPanel（オーバーレイ）", 40, 62, 12, COLORS.textMuted));

  // 外枠
  const shell = createRoundedRect(40, 100, 1520, 780, COLORS.white, COLORS.purple, 2, 12);
  section.appendChild(shell);
  section.appendChild(createText("AppShell (flex h-screen)", 60, 108, 11, COLORS.purple, "Semi Bold"));

  // ── Sidebar ──
  const sidebarBg = createRoundedRect(55, 140, 240, 720, COLORS.bgMuted, COLORS.indigo, 1.5);
  section.appendChild(sidebarBg);
  section.appendChild(createText("Sidebar (w-60)", 70, 150, 12, COLORS.indigo, "Bold"));
  section.appendChild(createText("開閉: UIStore.sidebarOpen", 70, 168, 9, COLORS.textMuted));

  // Sidebar sections
  const sidebarItems = [
    { y: 190, h: 40, label: "🏷️ アプリタイトル + 閉じるボタン", bg: COLORS.white },
    { y: 240, h: 90, label: "📋 ビュー一覧\n• ガント / テーブル / カレンダー / カンバン\n• 追加 / リネーム / 削除", bg: COLORS.blueLight },
    { y: 340, h: 75, label: "💾 DataSourceSelector\n• ファイルを開く / 保存\n• インポート / エクスポート", bg: COLORS.amberLight },
    { y: 425, h: 65, label: "🔧 FieldManager\n• 表示切替 / D&D並び替え / 追加", bg: COLORS.greenLight },
    { y: 500, h: 35, label: "🌓 テーマ切替（ライト/ダーク）", bg: COLORS.white },
  ];
  for (const item of sidebarItems) {
    const rect = createRoundedRect(65, item.y, 220, item.h, item.bg, COLORS.border, 1, 6);
    section.appendChild(rect);
    section.appendChild(createText(item.label, 75, item.y + 10, 10, COLORS.textDark, "Medium", 200));
  }

  // ── Main Area ──
  // Header
  const headerBg = createRoundedRect(310, 140, 830, 110, COLORS.white, COLORS.blue, 1.5);
  section.appendChild(headerBg);
  section.appendChild(createText("Header", 325, 150, 12, COLORS.blue, "Bold"));

  // Header tabs
  const tabs = [
    { x: 325, label: "☰", w: 35, active: false },
    { x: 368, label: "ガント", w: 65, active: true },
    { x: 440, label: "テーブル", w: 70, active: false },
    { x: 518, label: "カレンダー", w: 80, active: false },
    { x: 605, label: "カンバン", w: 70, active: false },
    { x: 830, label: "EN/JA", w: 50, active: false },
    { x: 888, label: "❓", w: 28, active: false },
    { x: 924, label: "＋ タスク追加", w: 95, active: false },
  ];
  for (const tab of tabs) {
    const tabBg = createRoundedRect(tab.x, 172, tab.w, 26, tab.active ? COLORS.indigo : COLORS.blueLight, tab.active ? COLORS.indigo : COLORS.border, 1, 5);
    section.appendChild(tabBg);
    section.appendChild(createText(tab.label, tab.x + 6, 178, 9, tab.active ? COLORS.white : COLORS.textDark, tab.active ? "Semi Bold" : "Regular"));
  }

  // FilterBar
  const filterBg = createRoundedRect(325, 210, 800, 28, COLORS.purplePale, COLORS.border, 1, 4);
  section.appendChild(filterBg);
  section.appendChild(createText("🔍 FilterBar — ステータスフィルタ / 日付クイックフィルタ / カスタム条件", 335, 216, 9, COLORS.textMuted, "Medium"));

  // ViewContainer
  const viewBg = createRoundedRect(310, 265, 830, 530, COLORS.white, COLORS.purple, 1.5);
  viewBg.dashPattern = [8, 4];
  section.appendChild(viewBg);
  section.appendChild(createText("📺 ViewContainer", 325, 275, 12, COLORS.purple, "Bold"));
  section.appendChild(createText("activeView.type で切替（switch文）", 325, 293, 9, COLORS.textMuted));

  // 4 views inside ViewContainer
  const views = [
    { x: 325, y: 315, w: 390, h: 110, label: "📊 テーブルビュー", desc: "スプレッドシート形式\nインライン編集 / ソート / リサイズ", color: COLORS.blue, bg: COLORS.blueLight },
    { x: 725, y: 315, w: 390, h: 110, label: "📋 カンバンビュー", desc: "ステータス別カラム表示\nD&Dでカラム間移動", color: COLORS.green, bg: COLORS.greenLight },
    { x: 325, y: 440, w: 390, h: 120, label: "📅 ガントビュー", desc: "タイムラインにバー表示\nD&D移動 / リサイズ / マーキー選択", color: COLORS.orange, bg: COLORS.orangeLight },
    { x: 725, y: 440, w: 390, h: 120, label: "📆 カレンダービュー", desc: "月表示カレンダー\n期限日でタスク配置", color: COLORS.purple, bg: COLORS.purplePale },
  ];
  for (const v of views) {
    const vBg = createRoundedRect(v.x, v.y, v.w, v.h, v.bg, v.color, 1.5, 6);
    section.appendChild(vBg);
    section.appendChild(createText(v.label, v.x + 12, v.y + 12, 11, v.color, "Bold"));
    section.appendChild(createText(v.desc, v.x + 12, v.y + 32, 10, COLORS.textMuted, "Regular", v.w - 24));
  }

  // 共通フィルタ注記
  const sharedBg = createRoundedRect(325, 580, 790, 28, COLORS.purplePale, COLORS.border, 1, 4);
  section.appendChild(sharedBg);
  section.appendChild(createText("全ビュー共通: フィルタ＆ソート条件はアクティブビュー(ViewConfig)ごとに独立管理", 335, 586, 9, COLORS.textMuted));

  // StatusBar
  const statusBg = createRoundedRect(310, 810, 830, 40, COLORS.white, COLORS.slate, 1);
  section.appendChild(statusBg);
  section.appendChild(createText("📊 StatusBar — 接続状態 / データソース名 / 自動保存 / タスク数 / エクスポート状態", 325, 823, 10, COLORS.textMuted, "Medium"));

  // ── TaskDetailPanel (overlay) ──
  const detailBg = createRoundedRect(1160, 140, 380, 540, COLORS.white, COLORS.orange, 2);
  section.appendChild(detailBg);
  const detailHeader = createRoundedRect(1160, 140, 380, 36, COLORS.orange);
  detailHeader.topLeftRadius = 8;
  detailHeader.topRightRadius = 8;
  detailHeader.bottomLeftRadius = 0;
  detailHeader.bottomRightRadius = 0;
  section.appendChild(detailHeader);
  section.appendChild(createText("📝 TaskDetailPanel（スライドイン）", 1175, 148, 11, COLORS.white, "Semi Bold"));

  section.appendChild(createText("右サイドオーバーレイ (z-50)", 1175, 188, 9, COLORS.textMuted));
  section.appendChild(createText("UIStore.detailPanelOpen で開閉", 1175, 202, 9, COLORS.textMuted));

  const detailSections = [
    { y: 225, h: 30, label: "🏷️ ヘッダー: 削除 + 閉じるボタン" },
    { y: 260, h: 80, label: "📋 フィールド一覧\n• タイトル / ステータス / 担当者 / 期限 ...\n• クリックでインライン編集" },
    { y: 350, h: 55, label: "📝 メモセクション\n• Markdown対応 / 表示切替" },
    { y: 415, h: 25, label: "📅 フッター: 作成日時 / 更新日時" },
  ];
  for (const s of detailSections) {
    const r = createRoundedRect(1175, s.y, 350, s.h, COLORS.orangeLight, COLORS.border, 1, 4);
    section.appendChild(r);
    section.appendChild(createText(s.label, 1185, s.y + 8, 9, COLORS.textDark, "Medium", 330));
  }

  // ── Toast ──
  const toastBg = createRoundedRect(1160, 700, 380, 80, COLORS.white, COLORS.green, 1.5);
  section.appendChild(toastBg);
  section.appendChild(createText("🔔 ToastContainer（右下固定 z-100）", 1175, 712, 11, COLORS.green, "Bold"));
  section.appendChild(createText("• success / error / info の3タイプ\n• ToastStore で管理、自動消去", 1175, 732, 9, COLORS.textMuted, "Regular", 340));
}

// ── セクション：各画面ワイヤーフレーム ──
function generateScreens(root: FrameNode) {
  const section = createFrame("2. 画面ワイヤーフレーム", 0, 980, 1600, 1200, COLORS.bgLight);
  root.appendChild(section);

  section.appendChild(createText("📱 各画面ワイヤーフレーム", 40, 30, 24, COLORS.textDark, "Bold"));

  // ── テーブルビュー ──
  const tableFrame = createFrame("TableView", 40, 80, 720, 500, COLORS.white);
  tableFrame.cornerRadius = 12;
  tableFrame.strokes = [{ type: "SOLID", color: COLORS.blue }];
  tableFrame.strokeWeight = 2;
  section.appendChild(tableFrame);

  tableFrame.appendChild(createText("📊 テーブルビュー", 20, 16, 16, COLORS.blue, "Bold"));
  tableFrame.appendChild(createText("src/components/views/table/TableView.tsx", 20, 38, 9, COLORS.textMuted));

  // Table header
  const thBg = createRoundedRect(20, 60, 680, 30, COLORS.bgMuted, COLORS.border, 1, 4);
  tableFrame.appendChild(thBg);
  const thCols = ["✓", "タイトル", "ステータス", "開始日", "期限日", "担当者", "タグ"];
  const thWidths = [30, 150, 80, 80, 80, 80, 80];
  let thX = 28;
  for (let i = 0; i < thCols.length; i++) {
    tableFrame.appendChild(createText(thCols[i], thX, 68, 9, COLORS.textMuted, "Semi Bold"));
    thX += thWidths[i] + 10;
  }

  // Table rows
  for (let row = 0; row < 6; row++) {
    const rowY = 95 + row * 32;
    const rowBg = createRoundedRect(20, rowY, 680, 30, row % 2 === 0 ? COLORS.white : COLORS.bgLight, COLORS.border, 0.5, 2);
    tableFrame.appendChild(rowBg);

    tableFrame.appendChild(createText("☑", 28, rowY + 8, 9, COLORS.green));
    tableFrame.appendChild(createText(`タスク ${row + 1} のタイトル`, 68, rowY + 8, 9, COLORS.textDark));
    tableFrame.appendChild(createText(row < 2 ? "進行中" : row < 4 ? "未着手" : "完了", 228, rowY + 8, 9, row < 2 ? COLORS.blue : row < 4 ? COLORS.slate : COLORS.green));
  }

  // Add row button
  tableFrame.appendChild(createText("＋ タスクを追加", 28, 295, 10, COLORS.textMuted, "Medium"));

  // 特徴
  tableFrame.appendChild(createText("特徴:", 20, 340, 11, COLORS.textDark, "Semi Bold"));
  const tableFeatures = [
    "• インラインセル編集（クリックで直接入力）",
    "• カラムヘッダークリックでソート切替（↑↓）",
    "• カラムリサイズハンドル（ドラッグで幅調整）",
    "• 行クリック → TaskDetailPanel が右にスライドイン",
    "• 完了チェックボタンで即座にステータス変更",
    "• 行の一括削除対応",
  ];
  for (let i = 0; i < tableFeatures.length; i++) {
    tableFrame.appendChild(createText(tableFeatures[i], 20, 358 + i * 18, 10, COLORS.textMuted, "Regular", 680));
  }

  // ── カンバンビュー ──
  const kanbanFrame = createFrame("KanbanView", 800, 80, 720, 500, COLORS.white);
  kanbanFrame.cornerRadius = 12;
  kanbanFrame.strokes = [{ type: "SOLID", color: COLORS.green }];
  kanbanFrame.strokeWeight = 2;
  section.appendChild(kanbanFrame);

  kanbanFrame.appendChild(createText("📋 カンバンビュー", 20, 16, 16, COLORS.green, "Bold"));
  kanbanFrame.appendChild(createText("src/components/views/kanban/KanbanView.tsx", 20, 38, 9, COLORS.textMuted));

  // Kanban columns
  const kanbanCols = [
    { label: "未着手", color: COLORS.slate, count: 3 },
    { label: "進行中", color: COLORS.blue, count: 2 },
    { label: "完了", color: COLORS.green, count: 1 },
  ];
  for (let i = 0; i < kanbanCols.length; i++) {
    const colX = 20 + i * 225;
    const colBg = createRoundedRect(colX, 60, 210, 300, COLORS.bgLight, COLORS.border, 1, 8);
    kanbanFrame.appendChild(colBg);

    // Column header
    const colHeaderDot = createRoundedRect(colX + 12, 72, 8, 8, kanbanCols[i].color, undefined, undefined, 4);
    kanbanFrame.appendChild(colHeaderDot);
    kanbanFrame.appendChild(createText(`${kanbanCols[i].label} (${kanbanCols[i].count})`, colX + 26, 68, 11, COLORS.textDark, "Semi Bold"));

    // Cards
    for (let j = 0; j < kanbanCols[i].count; j++) {
      const cardY = 92 + j * 65;
      const card = createRoundedRect(colX + 8, cardY, 194, 55, COLORS.white, COLORS.border, 1, 6);
      kanbanFrame.appendChild(card);
      kanbanFrame.appendChild(createText(`タスク名`, colX + 18, cardY + 10, 10, COLORS.textDark, "Medium"));
      kanbanFrame.appendChild(createText(`担当: ユーザー${j + 1}`, colX + 18, cardY + 28, 8, COLORS.textMuted));
      kanbanFrame.appendChild(createText(`期限: 2026/02/${10 + j}`, colX + 18, cardY + 40, 8, COLORS.textMuted));
    }

    // Add button
    kanbanFrame.appendChild(createText("＋ 追加", colX + 80, 92 + kanbanCols[i].count * 65, 9, COLORS.textMuted));
  }

  kanbanFrame.appendChild(createText("特徴:", 20, 380, 11, COLORS.textDark, "Semi Bold"));
  const kanbanFeatures = [
    "• D&Dでカード移動 → ステータス自動更新",
    "• @dnd-kit ライブラリ使用",
    "• グループフィールドはビュー設定で変更可能",
    "• カードクリック → TaskDetailPanel 表示",
    "• 各列にタスク追加ボタン",
  ];
  for (let i = 0; i < kanbanFeatures.length; i++) {
    kanbanFrame.appendChild(createText(kanbanFeatures[i], 20, 398 + i * 18, 10, COLORS.textMuted, "Regular", 680));
  }

  // ── ガントビュー ──
  const ganttFrame = createFrame("GanttView", 40, 620, 720, 530, COLORS.white);
  ganttFrame.cornerRadius = 12;
  ganttFrame.strokes = [{ type: "SOLID", color: COLORS.orange }];
  ganttFrame.strokeWeight = 2;
  section.appendChild(ganttFrame);

  ganttFrame.appendChild(createText("📅 ガントビュー", 20, 16, 16, COLORS.orange, "Bold"));
  ganttFrame.appendChild(createText("src/components/views/gantt/GanttView.tsx", 20, 38, 9, COLORS.textMuted));

  // Gantt left panel (task names)
  const ganttLeft = createRoundedRect(20, 60, 180, 200, COLORS.bgMuted, COLORS.border, 1, 4);
  ganttFrame.appendChild(ganttLeft);
  ganttFrame.appendChild(createText("タスク名", 30, 68, 9, COLORS.textMuted, "Semi Bold"));
  for (let i = 0; i < 5; i++) {
    ganttFrame.appendChild(createText(`✓ タスク ${i + 1}`, 30, 88 + i * 32, 9, COLORS.textDark));
  }

  // Gantt timeline
  const ganttRight = createRoundedRect(210, 60, 490, 200, COLORS.white, COLORS.border, 1, 4);
  ganttFrame.appendChild(ganttRight);

  // Month headers
  ganttFrame.appendChild(createText("2月", 300, 68, 10, COLORS.textDark, "Semi Bold"));
  ganttFrame.appendChild(createText("3月", 480, 68, 10, COLORS.textDark, "Semi Bold"));

  // Day headers
  for (let d = 0; d < 14; d++) {
    ganttFrame.appendChild(createText(`${d + 1}`, 225 + d * 32, 82, 7, COLORS.textMuted));
  }

  // Gantt bars
  const barColors = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.red];
  const barData = [
    { startCol: 1, width: 5 },
    { startCol: 3, width: 4 },
    { startCol: 0, width: 8 },
    { startCol: 6, width: 3 },
    { startCol: 2, width: 6 },
  ];
  for (let i = 0; i < 5; i++) {
    const barX = 225 + barData[i].startCol * 32;
    const barW = barData[i].width * 32;
    const barY = 98 + i * 32;
    const bar = createRoundedRect(barX, barY, barW, 20, barColors[i], undefined, undefined, 4);
    bar.opacity = 0.8;
    ganttFrame.appendChild(bar);
  }

  ganttFrame.appendChild(createText("特徴:", 20, 290, 11, COLORS.textDark, "Semi Bold"));
  const ganttFeatures = [
    "• D&Dでバー移動 / 両端リサイズで日程変更",
    "• マーキー（範囲選択）→ 複数タスク一括移動",
    "• タイムライン空白ダブルクリック → インライン作成",
    "• 進捗率バー表示（バー内に進捗色）",
    "• 完了チェックボタン付き",
    "• タスク名クリック → TaskDetailPanel",
    "• 月/日ヘッダー付きタイムライン",
    "• 週末（土日）グレー背景表示",
    "• 今日ラインの赤色表示",
  ];
  for (let i = 0; i < ganttFeatures.length; i++) {
    ganttFrame.appendChild(createText(ganttFeatures[i], 20, 308 + i * 18, 10, COLORS.textMuted, "Regular", 680));
  }

  // ── カレンダービュー ──
  const calFrame = createFrame("CalendarView", 800, 620, 720, 530, COLORS.white);
  calFrame.cornerRadius = 12;
  calFrame.strokes = [{ type: "SOLID", color: COLORS.purple }];
  calFrame.strokeWeight = 2;
  section.appendChild(calFrame);

  calFrame.appendChild(createText("📆 カレンダービュー", 20, 16, 16, COLORS.purple, "Bold"));
  calFrame.appendChild(createText("src/components/views/calendar/CalendarView.tsx", 20, 38, 9, COLORS.textMuted));

  // Navigation
  calFrame.appendChild(createText("◀   2026年2月   ▶   今日", 20, 65, 12, COLORS.textDark, "Semi Bold"));

  // Weekday headers
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const wColors = [COLORS.red, COLORS.textMuted, COLORS.textMuted, COLORS.textMuted, COLORS.textMuted, COLORS.textMuted, COLORS.blue];
  for (let i = 0; i < 7; i++) {
    calFrame.appendChild(createText(weekdays[i], 30 + i * 95, 92, 10, wColors[i], "Medium"));
  }

  // Calendar grid
  let day = 1;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      if (day <= 28) {
        const cellX = 20 + col * 95;
        const cellY = 108 + row * 55;
        const cellBg = createRoundedRect(cellX, cellY, 90, 50, COLORS.white, COLORS.border, 0.5, 4);
        calFrame.appendChild(cellBg);
        calFrame.appendChild(createText(`${day}`, cellX + 5, cellY + 5, 9, day === 9 ? COLORS.white : COLORS.textDark, "Medium"));

        if (day === 9) {
          const todayDot = createRoundedRect(cellX + 2, cellY + 2, 16, 16, COLORS.blue, undefined, undefined, 8);
          calFrame.appendChild(todayDot);
          calFrame.appendChild(createText("9", cellX + 5, cellY + 5, 9, COLORS.white, "Medium"));
        }

        // Some tasks on calendar
        if (day === 10 || day === 15 || day === 20) {
          const taskBadge = createRoundedRect(cellX + 4, cellY + 24, 82, 16, COLORS.blueLight, COLORS.blue, 0.5, 3);
          calFrame.appendChild(taskBadge);
          calFrame.appendChild(createText("タスク名", cellX + 8, cellY + 27, 7, COLORS.blue, "Medium"));
        }

        day++;
      }
    }
  }

  calFrame.appendChild(createText("特徴:", 20, 400, 11, COLORS.textDark, "Semi Bold"));
  const calFeatures = [
    "• 月表示カレンダーに期限日(DUE_DATE)でタスク配置",
    "• 前月/翌月ナビゲーション",
    "• 「今日」ボタンで当日にジャンプ",
    "• タスクバッジクリック → TaskDetailPanel",
    "• 今日の日付ハイライト表示",
    "• 日曜（赤）/ 土曜（青）色分け",
  ];
  for (let i = 0; i < calFeatures.length; i++) {
    calFrame.appendChild(createText(calFeatures[i], 20, 418 + i * 18, 10, COLORS.textMuted, "Regular", 680));
  }
}

// ── セクション：遷移フロー図 ──
function generateFlow(root: FrameNode) {
  const section = createFrame("3. 遷移フロー図", 0, 2240, 1600, 1000, COLORS.bgLight);
  root.appendChild(section);

  section.appendChild(createText("🔄 画面遷移フロー（状態駆動）", 40, 30, 24, COLORS.textDark, "Bold"));
  section.appendChild(createText("すべての遷移はURL変更なし。Zustand Store の状態変更によるコンポーネント出し分けで実現。", 40, 60, 12, COLORS.textMuted));

  // ── Flow 1: ビュー切替 ──
  createCard(section, 40, 100, 460, 220, "① ビュー切替フロー", COLORS.purple, COLORS.purpleLight, COLORS.purple, [
    { text: "トリガー:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 12 },
    { text: "• Header のビュータブをクリック", size: 10, color: COLORS.textMuted, y: 28 },
    { text: "• Sidebar のビュー一覧から選択", size: 10, color: COLORS.textMuted, y: 42 },
    { text: "", size: 8, color: COLORS.textMuted, y: 54 },
    { text: "処理:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 62 },
    { text: "ViewStore.setActiveView(viewId)", size: 10, color: COLORS.indigo, weight: "Medium", y: 78 },
    { text: "  ↓", size: 10, color: COLORS.textMuted, y: 92 },
    { text: "ViewContainer が activeView.type を読み取り", size: 10, color: COLORS.textMuted, y: 106 },
    { text: "  ↓", size: 10, color: COLORS.textMuted, y: 120 },
    { text: "switch文で描画コンポーネントを切替", size: 10, color: COLORS.textMuted, y: 134 },
    { text: "Table → Kanban → Gantt → Calendar", size: 10, color: COLORS.indigo, weight: "Medium", y: 150 },
  ]);

  // ── Flow 2: タスク詳細 ──
  createCard(section, 540, 100, 460, 220, "② タスク詳細表示フロー", COLORS.orange, COLORS.orangeLight, COLORS.orange, [
    { text: "トリガー:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 12 },
    { text: "• テーブル: 行クリック", size: 10, color: COLORS.textMuted, y: 28 },
    { text: "• カンバン: カードクリック", size: 10, color: COLORS.textMuted, y: 42 },
    { text: "• ガント: タスク名クリック", size: 10, color: COLORS.textMuted, y: 56 },
    { text: "• カレンダー: バッジクリック", size: 10, color: COLORS.textMuted, y: 70 },
    { text: "", size: 8, color: COLORS.textMuted, y: 80 },
    { text: "処理:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 88 },
    { text: "UIStore.openDetailPanel(taskId)", size: 10, color: COLORS.orange, weight: "Medium", y: 104 },
    { text: "  ↓", size: 10, color: COLORS.textMuted, y: 118 },
    { text: "TaskDetailPanel 右からスライドイン", size: 10, color: COLORS.textMuted, y: 132 },
    { text: "背景オーバーレイ表示（クリックで閉じる）", size: 10, color: COLORS.textMuted, y: 148 },
  ]);

  // ── Flow 3: タスク追加 ──
  createCard(section, 1040, 100, 460, 220, "③ タスク追加フロー", COLORS.green, COLORS.greenLight, COLORS.green, [
    { text: "トリガー:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 12 },
    { text: "• Header「＋タスク追加」ボタン", size: 10, color: COLORS.textMuted, y: 28 },
    { text: "• テーブル: 行追加ボタン", size: 10, color: COLORS.textMuted, y: 42 },
    { text: "• カンバン: 列内＋ボタン", size: 10, color: COLORS.textMuted, y: 56 },
    { text: "• ガント: 空白ダブルクリック", size: 10, color: COLORS.textMuted, y: 70 },
    { text: "", size: 8, color: COLORS.textMuted, y: 80 },
    { text: "処理:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 88 },
    { text: "TaskStore.addTask({title:'', status:'not_started'})", size: 10, color: COLORS.green, weight: "Medium", y: 104 },
    { text: "  ↓", size: 10, color: COLORS.textMuted, y: 118 },
    { text: "UIStore.openDetailPanel(newTaskId)", size: 10, color: COLORS.green, weight: "Medium", y: 132 },
    { text: "→ 即座に詳細パネルが開いて編集可能", size: 10, color: COLORS.textMuted, y: 148 },
  ]);

  // ── Flow 4: フィルタ/ソート ──
  createCard(section, 40, 360, 460, 200, "④ フィルタ & ソートフロー", COLORS.purple, COLORS.purplePale, COLORS.purple, [
    { text: "トリガー:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 12 },
    { text: "• FilterBar でフィルタ条件追加/変更/削除", size: 10, color: COLORS.textMuted, y: 28 },
    { text: "• テーブルヘッダーでソート切替", size: 10, color: COLORS.textMuted, y: 42 },
    { text: "• クイックフィルタ（完了非表示 / 日付範囲）", size: 10, color: COLORS.textMuted, y: 56 },
    { text: "", size: 8, color: COLORS.textMuted, y: 66 },
    { text: "処理:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 74 },
    { text: "ViewStore.setFilters() / setSorts()", size: 10, color: COLORS.indigo, weight: "Medium", y: 90 },
    { text: "  ↓ useFilteredTasks() Hook", size: 10, color: COLORS.textMuted, y: 104 },
    { text: "フィルタ済みタスクで各ビュー再レンダリング", size: 10, color: COLORS.textMuted, y: 120 },
  ]);

  // ── Flow 5: データI/O ──
  createCard(section, 540, 360, 460, 200, "⑤ データ入出力フロー", COLORS.amber, COLORS.amberLight, COLORS.amber, [
    { text: "入力:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 12 },
    { text: "• ファイルを開く → LocalFileAdapter", size: 10, color: COLORS.textMuted, y: 28 },
    { text: "• インポート → parseImportFile → プレビュー → 確定", size: 10, color: COLORS.textMuted, y: 42 },
    { text: "• 初回: MemoryAdapter でデモデータ自動ロード", size: 10, color: COLORS.textMuted, y: 56 },
    { text: "", size: 8, color: COLORS.textMuted, y: 66 },
    { text: "出力:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 74 },
    { text: "• JSON保存 / Excel保存（fileSave API）", size: 10, color: COLORS.textMuted, y: 90 },
    { text: "• 上書き保存（既存ファイルハンドル再利用）", size: 10, color: COLORS.textMuted, y: 104 },
    { text: "• エクスポートスコープ: 全件 / グループ指定", size: 10, color: COLORS.textMuted, y: 118 },
  ]);

  // ── Flow 6: サイドバー/テーマ/言語 ──
  createCard(section, 1040, 360, 460, 200, "⑥ UI切替フロー", COLORS.slate, COLORS.bgMuted, COLORS.slate, [
    { text: "サイドバー開閉:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 12 },
    { text: "Header ☰ → setSidebarOpen(true)", size: 10, color: COLORS.textMuted, y: 28 },
    { text: "Sidebar ＜ → toggleSidebar()", size: 10, color: COLORS.textMuted, y: 42 },
    { text: "幅: w-60 ↔ w-0（アニメーション遷移）", size: 10, color: COLORS.textMuted, y: 56 },
    { text: "", size: 8, color: COLORS.textMuted, y: 66 },
    { text: "テーマ:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 74 },
    { text: "Sidebar → UIStore.toggleTheme() → dark class 切替", size: 10, color: COLORS.textMuted, y: 90 },
    { text: "", size: 8, color: COLORS.textMuted, y: 100 },
    { text: "言語:", size: 10, color: COLORS.textDark, weight: "Semi Bold", y: 108 },
    { text: "Header EN/JA → i18n.toggleLang() → 即時反映", size: 10, color: COLORS.textMuted, y: 124 },
  ]);

  // ── 遷移図（視覚的な矢印付き） ──
  section.appendChild(createText("🗺️ 状態遷移ダイアグラム", 40, 600, 18, COLORS.textDark, "Bold"));

  // Central node
  const centerX = 500, centerY = 760;
  const centerBg = createRoundedRect(centerX - 80, centerY - 25, 160, 50, COLORS.indigo, undefined, undefined, 25);
  section.appendChild(centerBg);
  section.appendChild(createText("ViewContainer", centerX - 55, centerY - 8, 13, COLORS.white, "Bold"));

  // View nodes
  const viewNodes = [
    { label: "テーブル", x: centerX - 350, y: centerY - 80, color: COLORS.blue },
    { label: "カンバン", x: centerX - 350, y: centerY + 30, color: COLORS.green },
    { label: "ガント", x: centerX + 230, y: centerY - 80, color: COLORS.orange },
    { label: "カレンダー", x: centerX + 230, y: centerY + 30, color: COLORS.purple },
  ];
  for (const node of viewNodes) {
    const bg = createRoundedRect(node.x, node.y, 110, 36, node.color, undefined, undefined, 18);
    section.appendChild(bg);
    section.appendChild(createText(node.label, node.x + 20, node.y + 10, 11, COLORS.white, "Semi Bold"));
  }

  // Detail panel node
  const detailNode = createRoundedRect(centerX - 80, centerY + 100, 160, 40, COLORS.orange, undefined, undefined, 20);
  section.appendChild(detailNode);
  section.appendChild(createText("TaskDetailPanel", centerX - 58, centerY + 112, 11, COLORS.white, "Semi Bold"));

  // Overlay nodes
  const overlayNodes = [
    { label: "HelpGuide", x: centerX + 260, y: centerY + 100, color: COLORS.purple },
    { label: "Toast", x: centerX - 320, y: centerY + 140, color: COLORS.green },
    { label: "Import/Export", x: centerX - 90, y: centerY + 180, color: COLORS.amber },
  ];
  for (const node of overlayNodes) {
    const bg = createRoundedRect(node.x, node.y, 120, 32, node.color, undefined, undefined, 16);
    section.appendChild(bg);
    section.appendChild(createText(node.label, node.x + 12, node.y + 9, 9, COLORS.white, "Semi Bold"));
  }

  // Labels
  section.appendChild(createText("setActiveView()", centerX - 200, centerY - 55, 9, COLORS.indigo, "Medium"));
  section.appendChild(createText("setActiveView()", centerX + 110, centerY - 55, 9, COLORS.indigo, "Medium"));
  section.appendChild(createText("openDetailPanel()", centerX + 45, centerY + 65, 9, COLORS.orange, "Medium"));
  section.appendChild(createText("← 全ビューから呼出可能", centerX + 85, centerY + 125, 9, COLORS.textMuted));
  section.appendChild(createText("常時表示（z-100）→", centerX - 320, centerY + 128, 9, COLORS.textMuted));
}

// ── セクション：状態管理マップ ──
function generateStores(root: FrameNode) {
  const section = createFrame("4. 状態管理マップ", 0, 3300, 1600, 550, COLORS.bgLight);
  root.appendChild(section);

  section.appendChild(createText("⚡ 状態管理（Zustand Stores）マップ", 40, 30, 24, COLORS.textDark, "Bold"));
  section.appendChild(createText("全5つの Store でアプリ状態を管理。すべての画面遷移とデータ更新は Store 経由で行われる。", 40, 60, 12, COLORS.textMuted));

  const stores = [
    {
      name: "UIStore",
      file: "src/stores/ui-store.ts",
      color: COLORS.indigo,
      bg: COLORS.purpleLight,
      x: 40,
      props: [
        "sidebarOpen: boolean",
        "theme: 'light' | 'dark'",
        "selectedTaskId: string | null",
        "detailPanelOpen: boolean",
      ],
      actions: [
        "toggleSidebar()",
        "toggleTheme()",
        "openDetailPanel(taskId)",
        "closeDetailPanel()",
      ],
      consumers: "Sidebar, Header, TaskDetailPanel, 各View",
    },
    {
      name: "ViewStore",
      file: "src/stores/view-store.ts",
      color: COLORS.purple,
      bg: COLORS.purplePale,
      x: 340,
      props: [
        "activeViewId: string",
        "views: ViewConfig[]",
      ],
      actions: [
        "setActiveView(viewId)",
        "addView() / deleteView()",
        "setFilters() / setSorts()",
        "updateView()",
      ],
      consumers: "Header, Sidebar, ViewContainer, FilterBar",
    },
    {
      name: "TaskStore",
      file: "src/stores/task-store.ts (persist)",
      color: COLORS.green,
      bg: COLORS.greenLight,
      x: 640,
      props: [
        "tasks: Task[]",
        "fields: FieldDefinition[]",
        "isDirty: boolean",
        "isLoaded: boolean",
      ],
      actions: [
        "addTask() / deleteTask()",
        "updateTask(id, field, value)",
        "loadDataSet() / getDataSet()",
        "importTasks() / addField()",
      ],
      consumers: "全View, DetailPanel, FieldManager",
    },
    {
      name: "ConnectionStore",
      file: "src/stores/connection-store.ts",
      color: COLORS.amber,
      bg: COLORS.amberLight,
      x: 940,
      props: [
        "status: ConnectionStatus",
        "connection: ConnectionInfo",
        "adapter: DataAdapter",
        "lastSaved: Date | null",
      ],
      actions: [
        "setAdapter()",
        "setConnection()",
        "setStatus()",
        "setLastSaved()",
      ],
      consumers: "DataSourceSelector, StatusBar",
    },
    {
      name: "ToastStore",
      file: "src/stores/toast-store.ts",
      color: COLORS.red,
      bg: { r: 1, g: 0.95, b: 0.95 },
      x: 1240,
      props: [
        "toasts: Toast[]",
      ],
      actions: [
        "addToast(msg, type)",
        "removeToast(id)",
        "※自動消去タイマー付き",
      ],
      consumers: "ToastContainer, DataSourceSelector",
    },
  ];

  for (const store of stores) {
    const cardW = 270;
    const cardH = 400;
    const x = store.x;
    const y = 100;

    // Card background
    const bg = createRoundedRect(x, y, cardW, cardH, COLORS.white, store.color, 2);
    section.appendChild(bg);

    // Header
    const header = createRoundedRect(x, y, cardW, 40, store.color);
    header.topLeftRadius = 8;
    header.topRightRadius = 8;
    header.bottomLeftRadius = 0;
    header.bottomRightRadius = 0;
    section.appendChild(header);
    section.appendChild(createText(store.name, x + 16, y + 12, 14, COLORS.white, "Bold"));

    // File path
    section.appendChild(createText(store.file, x + 16, y + 52, 8, COLORS.textMuted));

    // Properties
    section.appendChild(createText("State:", x + 16, y + 75, 10, COLORS.textDark, "Semi Bold"));
    for (let i = 0; i < store.props.length; i++) {
      section.appendChild(createText(`• ${store.props[i]}`, x + 16, y + 92 + i * 16, 9, COLORS.textMuted, "Regular", cardW - 32));
    }

    // Actions
    const actionsY = y + 92 + store.props.length * 16 + 12;
    section.appendChild(createText("Actions:", x + 16, actionsY, 10, COLORS.textDark, "Semi Bold"));
    for (let i = 0; i < store.actions.length; i++) {
      section.appendChild(createText(`• ${store.actions[i]}`, x + 16, actionsY + 17 + i * 16, 9, store.color, "Medium", cardW - 32));
    }

    // Consumers
    const consumersY = actionsY + 17 + store.actions.length * 16 + 12;
    section.appendChild(createText("利用コンポーネント:", x + 16, consumersY, 10, COLORS.textDark, "Semi Bold"));
    section.appendChild(createText(store.consumers, x + 16, consumersY + 17, 9, COLORS.textMuted, "Regular", cardW - 32));
  }
}

// ── メイン処理 ──
figma.ui.onmessage = async (msg) => {
  if (msg.type === "cancel") {
    figma.closePlugin();
    return;
  }

  if (msg.type === "generate") {
    try {
      await loadFonts();

      const root = createFrame("Task Management Tool - Screen Map", 0, 0, 1600, 3900, COLORS.bgLight);
      root.cornerRadius = 16;

      const options = msg.options;

      if (options.layout) generateLayout(root);
      if (options.screens) generateScreens(root);
      if (options.flow) generateFlow(root);
      if (options.stores) generateStores(root);

      figma.currentPage.appendChild(root);
      figma.viewport.scrollAndZoomIntoView([root]);

      figma.ui.postMessage({ type: "done" });
    } catch (err) {
      figma.notify(`エラー: ${err}`, { error: true });
      figma.closePlugin();
    }
  }
};
