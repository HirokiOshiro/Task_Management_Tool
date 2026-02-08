export const ja = {
  // ── Common ──
  common: {
    loading: '読み込み中...',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    add: '追加',
    close: '閉じる',
    untitled: '無題',
    yes: 'はい',
    no: 'いいえ',
    items: '件',
    today: '今日',
    newTask: '新規タスク',
    markDone: '完了にする',
    markInProgress: '進行中に戻す',
    done: '完了',
  },

  // ── Field Types ──
  fieldTypes: {
    text: 'テキスト',
    number: '数値',
    select: 'セレクト',
    multi_select: 'マルチセレクト',
    date: '日付',
    person: '担当者',
    checkbox: 'チェックボックス',
    url: 'URL',
    progress: '進捗',
  },

  // ── Field Names ──
  fieldNames: {
    title: 'タイトル',
    status: 'ステータス',
    assignee: '担当者',
    dueDate: '期限',
    priority: '優先度',
    description: '説明',
    tags: 'タグ',
    progress: '進捗',
    startDate: '開始日',
    dependencies: '依存関係',
    notes: 'メモ',
    category: '業務',
  },

  // ── Status Options ──
  status: {
    not_started: '未着手',
    in_progress: '進行中',
    done: '完了',
    on_hold: '保留',
  },

  // ── Priority Options ──
  priority: {
    high: '高',
    medium: '中',
    low: '低',
  },

  // ── Views ──
  views: {
    table: 'テーブル',
    kanban: 'カンバン',
    gantt: 'ガント',
    calendar: 'カレンダー',
    addView: 'ビューを追加',
    viewLabel: 'ビュー',
    newViewSuffix: '(新規)',
  },

  // ── Header ──
  header: {
    openSidebar: 'サイドバーを開く',
    helpGuide: '使い方ガイド',
  },

  // ── Sidebar ──
  sidebar: {
    appTitle: 'タスク管理',
    closeSidebar: 'サイドバーを閉じる',
    addViewTitle: 'ビューを追加',
    confirmTitle: '確定',
    cancelTitle: 'キャンセル',
    renameTitle: '名前を変更',
    deleteViewTitle: 'ビューを削除',
    darkMode: 'ダークモード',
    lightMode: 'ライトモード',
  },

  // ── Status Bar ──
  statusBar: {
    autoSaveOn: '自動保存 ON',
    tasksCount: 'タスク',
    notExported: 'ファイル未エクスポート',
    lastExport: '最終エクスポート:',
    memory: 'メモリ',
    local: 'ローカル',
    memoryDemo: 'メモリ（デモ）',
  },

  // ── Filter Bar ──
  filter: {
    filter: 'フィルタ',
    excludeDone: '完了以外',
    showAll: '全て',
    hideDoneTitle: '完了タスクを非表示',
    showAllTitle: '全タスクを表示',
    thisWeek: '今週',
    thisMonth: '今月',
    nextTwoMonths: '2カ月',
    clearDateFilter: '日付フィルターをクリア',
    selectField: 'フィールドを選択...',
    valuePlaceholder: '値...',
    operators: {
      equals: '等しい',
      not_equals: '等しくない',
      contains: '含む',
      not_contains: '含まない',
      is_empty: '空',
      is_not_empty: '空でない',
      greater_than: 'より大きい',
      less_than: 'より小さい',
      before: 'より前',
      after: 'より後',
      in: 'いずれか',
      not_in: 'いずれでもない',
    },
  },

  // ── Field Manager ──
  fieldManager: {
    title: 'フィールド管理',
    addField: 'フィールドを追加',
    hide: '非表示にする',
    show: '表示する',
    deleteField: 'フィールドを削除',
    fieldNamePlaceholder: 'フィールド名',
  },

  // ── Task Detail Panel ──
  taskDetail: {
    title: 'タスク詳細',
    deleteTask: 'タスクを削除',
    created: '作成:',
    updated: '更新:',
    empty: '空欄',
    memoLabel: 'メモ',
    memoPlaceholder: 'メモを入力...',
    memoClickToAdd: 'クリックしてメモを追加...',
    tagsPlaceholder: 'タグを入力してEnter...',
  },

  // ── Table View ──
  table: {
    deleteTask: 'タスクを削除',
    enterToAdd: '入力してEnter...',
  },

  // ── Kanban View ──
  kanban: {
    uncategorized: '未分類',
  },

  // ── Gantt View ──
  gantt: {
    emptyMessage: 'ガントチャートを表示するにはタスクに開始日または期限を設定してください。',
    taskName: 'タスク名',
    monthFormat: 'yyyy年M月',
    scrollToToday: '今日の位置にスクロール',
    selectedCount: '件選択中 — ドラッグで一括移動',
    clearSelection: '解除',
    taskNamePlaceholder: 'タスク名を入力…',
  },

  // ── Calendar View ──
  calendar: {
    monthFormat: 'yyyy年 M月',
    weekDays: ['日', '月', '火', '水', '木', '金', '土'],
    moreItems: '件',
  },

  // ── Data Source ──
  data: {
    label: 'データ',
    taskDataFile: 'タスクデータファイル',
    noFileConnected: 'ファイルが接続されていません',
    openFile: 'ファイルを開く',
    save: '上書き保存',
    saveJson: 'JSONで保存',
    saveAsJson: '別名でJSON保存',
    saveExcel: 'Excelで保存',
    saveAsExcel: '別名でExcel保存',
    demoData: 'デモデータ',
    loadedFile: (name: string) => `${name} を読み込みました`,
    loadFailed: 'ファイルの読み込みに失敗しました',
    savedFile: (name: string) => `${name} を保存しました`,
    savedJson: 'JSONファイルを保存しました',
    saveFailed: '保存に失敗しました',
    savedExcel: 'Excelファイルを保存しました',
    loadedDemo: 'デモデータを読み込みました',
    demoDataTitle: 'デモデータ',
    noFileToSave: '保存するファイルがありません',
    importTasks: 'タスクをインポート',
    importTemplate: 'テンプレートダウンロード',
    importAppend: '既存に追加',
    importReplace: '全て置換',
    importSuccess: (count: number) => `${count} 件のタスクをインポートしました`,
    importFailed: 'インポートに失敗しました',
    importPreview: 'インポートプレビュー',
    importPreviewInfo: (count: number, fieldCount: number) =>
      `${count} 件のタスク、${fieldCount} 個のフィールドが見つかりました`,
    importConfirm: 'インポート実行',
    importCancel: 'キャンセル',
    supportedFormats: '対応形式: .xlsx, .csv',
  },

  // ── Help Guide ──
  help: {
    title: '使い方ガイド',
    reopenHint: (icon: string) => `ガイドはヘッダーの ${icon} ボタンからいつでも開けます`,
    sections: {
      overview: {
        title: 'はじめに',
        description: 'このアプリはタスクを管理するためのツールです。',
        viewTypes: 'テーブル・カンバン・ガントチャート・カレンダーの4つのビューでタスクを確認・編集できます。',
        hint: '💡 ヒント',
        hintText: '左下のサイドバーからデモデータを読み込むと、すぐに機能を試すことができます。',
      },
      task: {
        title: 'タスクの作成と編集',
        addTask: 'ヘッダー右上の「新規タスク」ボタンをクリックすると新しいタスクが追加されます。',
        items: [
          'テーブルビューではセルをクリックして直接編集できます',
          'タスク名やガントバーをクリックすると詳細パネルが開きます',
          '詳細パネルの下部にあるメモ欄に自由にメモを書き込めます',
        ],
      },
      views: {
        title: '4つのビュー',
        switchTabs: 'ヘッダーのタブでビューを切り替えられます。',
        table: { name: 'テーブル', desc: 'スプレッドシートのようにタスクを一覧表示。セルをクリックして直接編集、カラム幅の調整ができます。' },
        kanban: { name: 'カンバン', desc: 'ステータスごとにカードを表示。ドラッグ＆ドロップでステータスを変更できます。' },
        gantt: { name: 'ガントチャート', desc: 'タスクの開始日〜期限をバーで表示。バーをドラッグして日程を移動したり、バーの端をドラッグして期間を調整できます。' },
        calendar: { name: 'カレンダー', desc: '月間カレンダーに期限のあるタスクを表示。タスクをクリックすると詳細を確認できます。' },
      },
      filterSort: {
        title: 'フィルタとソート',
        description: 'ヘッダー下部のフィルタバーでタスクを絞り込めます。',
        addFilter: 'フィルタ追加：',
        addFilterDesc: '「+ フィルタ」をクリックし、フィールド・条件・値を選択',
        sort: 'ソート：',
        sortDesc: 'テーブルビューのカラムヘッダーをクリックするとソートできます',
      },
      sidebarHelp: {
        title: 'サイドバーの機能',
        description: '左側のサイドバーでは以下の操作ができます。',
        viewManagement: 'ビュー管理：',
        viewManagementDesc: 'ビューの追加・名前変更・削除',
        fieldManagement: 'フィールド管理：',
        fieldManagementDesc: 'カスタムフィールドの追加やドラッグ並び替え、表示/非表示の切り替え',
        themeToggle: 'テーマ切替：',
        themeToggleDesc: 'ライト/ダークモードの切り替え',
      },
      dataSection: {
        title: 'データの保存と読み込み',
        intro: 'サイドバーの「データ」セクションからファイルの操作ができます。',
        storageTitle: 'データの保存先について',
        storageDesc1: 'このツールはブラウザ上で動作するアプリです。タスクデータは',
        storageHighlight: 'ブラウザのローカルストレージに自動保存',
        storageDesc2: 'されるため、',
        storageDesc3: 'ページを閉じても次回アクセス時にデータが復元されます。',
        storageWarning: 'ただしブラウザのデータ削除を行うと消えるため、大切なデータはファイルにもエクスポートしてください。',
        operationsTitle: '操作一覧',
        openFileTitle: 'ファイルを開く',
        openFileDesc: 'JSON または Excel（.xlsx）ファイルを選択して読み込みます。以前保存したファイルを開いて作業を再開できます。',
        saveJsonTitle: 'JSONで保存',
        saveJsonDesc: 'すべてのタスク・フィールド設定・ビュー設定をJSON形式でダウンロードします。',
        saveJsonRecommend: '推奨の保存形式',
        saveJsonNote: 'です。フィールド構成やメモなど全ての情報が保存されます。',
        saveExcelTitle: 'Excelで保存',
        saveExcelDesc: 'タスクデータをExcelファイル（.xlsx）としてダウンロードします。ExcelやGoogleスプレッドシートでの開覧・共有に便利です。',
        demoTitle: 'デモデータ',
        demoDesc: 'サンプルのタスクデータを読み込みます。初めて使う方はまずこちらを読み込んで、操作を試してみてください。',
        statusHint: '💡 保存状態の確認方法',
        statusHintDesc: '画面下部のステータスバーに接続状態が表示されます。サイドバーの保存ボタン横に...が表示されている場合は未保存の変更があります。',
      },
      safety: {
        title: '安全性について',
        intro: 'このツールはプライバシーとセキュリティを重視して設計されています。',
        items: [
          { title: '完全ローカル動作', desc: 'すべてのデータはお使いのブラウザ内でのみ処理されます。外部サーバーへのデータ送信は一切行われません。' },
          { title: 'アカウント不要', desc: 'ユーザー登録やログインは不要です。個人情報の入力も必要ありません。' },
          { title: 'ファイルアクセス', desc: 'ファイルの読み書きはブラウザ標準のAPIを使用し、ユーザーが明示的に選択したファイルのみにアクセスします。勝手にファイルを読み取ったり、他のファイルにアクセスすることはありません。' },
          { title: 'Cookie・トラッキングなし', desc: 'Cookieやトラッキングは使用していません。ローカルストレージはテーマ設定とタスクデータの自動保存のみに使用されます。' },
        ],
      },
      caution: {
        title: '利用上の注意点',
        items: [
          { title: 'ブラウザ内自動保存', desc: 'タスクデータはブラウザのローカルストレージに自動保存されます。ページを閉じても、次回アクセス時にデータが自動的に復元されます。' },
          { title: 'ファイルへのバックアップを推奨', desc: '自動保存はブラウザ内のみです。ブラウザのデータ削除やキャッシュクリアを行うとデータが消えます。重要なデータは定期的に「JSONで保存」や「Excelで保存」でファイルにエクスポートしてください。' },
          { title: 'デモデータの上書きに注意', desc: '「デモデータ」をクリックすると現在のデータがサンプルデータに置き換わります。大切なデータがある場合は先に保存してください。' },
          { title: '対応ブラウザ', desc: '最新版のChrome・Edge・Safari・Firefoxを推奨します。古いブラウザでは一部の機能が正常に動作しない場合があります。' },
        ],
      },
    },
  },
}

export type Locale = {
  common: {
    loading: string
    cancel: string
    save: string
    delete: string
    add: string
    close: string
    untitled: string
    yes: string
    no: string
    items: string
    today: string
    newTask: string
    markDone: string
    markInProgress: string
    done: string
  }
  fieldTypes: Record<string, string>
  fieldNames: Record<string, string>
  status: Record<string, string>
  priority: Record<string, string>
  views: {
    table: string
    kanban: string
    gantt: string
    calendar: string
    addView: string
    viewLabel: string
    newViewSuffix: string
  }
  header: { openSidebar: string; helpGuide: string }
  sidebar: {
    appTitle: string
    closeSidebar: string
    addViewTitle: string
    confirmTitle: string
    cancelTitle: string
    renameTitle: string
    deleteViewTitle: string
    darkMode: string
    lightMode: string
  }
  statusBar: {
    autoSaveOn: string
    tasksCount: string
    notExported: string
    lastExport: string
    memory: string
    local: string
    memoryDemo: string
  }
  filter: {
    filter: string
    excludeDone: string
    showAll: string
    hideDoneTitle: string
    showAllTitle: string
    thisWeek: string
    thisMonth: string
    nextTwoMonths: string
    clearDateFilter: string
    selectField: string
    valuePlaceholder: string
    operators: Record<string, string>
  }
  fieldManager: {
    title: string
    addField: string
    hide: string
    show: string
    deleteField: string
    fieldNamePlaceholder: string
  }
  taskDetail: {
    title: string
    deleteTask: string
    created: string
    updated: string
    empty: string
    memoLabel: string
    memoPlaceholder: string
    memoClickToAdd: string
    tagsPlaceholder: string
  }
  table: {
    deleteTask: string
    enterToAdd: string
  }
  kanban: { uncategorized: string }
  gantt: {
    emptyMessage: string
    taskName: string
    monthFormat: string
    scrollToToday: string
    selectedCount: string
    clearSelection: string
    taskNamePlaceholder: string
  }
  calendar: {
    monthFormat: string
    weekDays: string[]
    moreItems: string
  }
  data: {
    label: string
    taskDataFile: string
    noFileConnected: string
    openFile: string
    save: string
    saveJson: string
    saveAsJson: string
    saveExcel: string
    saveAsExcel: string
    demoData: string
    loadedFile: (name: string) => string
    loadFailed: string
    savedFile: (name: string) => string
    savedJson: string
    saveFailed: string
    savedExcel: string
    loadedDemo: string
    noFileToSave: string
    demoDataTitle: string
    importTasks: string
    importTemplate: string
    importAppend: string
    importReplace: string
    importSuccess: (count: number) => string
    importFailed: string
    importPreview: string
    importPreviewInfo: (count: number, fieldCount: number) => string
    importConfirm: string
    importCancel: string
    supportedFormats: string
  }
  help: {
    title: string
    reopenHint: (icon: string) => string
    sections: {
      overview: {
        title: string
        description: string
        viewTypes: string
        hint: string
        hintText: string
      }
      task: {
        title: string
        addTask: string
        items: string[]
      }
      views: {
        title: string
        switchTabs: string
        table: { name: string; desc: string }
        kanban: { name: string; desc: string }
        gantt: { name: string; desc: string }
        calendar: { name: string; desc: string }
      }
      filterSort: {
        title: string
        description: string
        addFilter: string
        addFilterDesc: string
        sort: string
        sortDesc: string
      }
      sidebarHelp: {
        title: string
        description: string
        viewManagement: string
        viewManagementDesc: string
        fieldManagement: string
        fieldManagementDesc: string
        themeToggle: string
        themeToggleDesc: string
      }
      dataSection: {
        title: string
        intro: string
        storageTitle: string
        storageDesc1: string
        storageHighlight: string
        storageDesc2: string
        storageDesc3: string
        storageWarning: string
        operationsTitle: string
        openFileTitle: string
        openFileDesc: string
        saveJsonTitle: string
        saveJsonDesc: string
        saveJsonRecommend: string
        saveJsonNote: string
        saveExcelTitle: string
        saveExcelDesc: string
        demoTitle: string
        demoDesc: string
        statusHint: string
        statusHintDesc: string
      }
      safety: {
        title: string
        intro: string
        items: { title: string; desc: string }[]
      }
      caution: {
        title: string
        items: { title: string; desc: string }[]
      }
    }
  }
}
