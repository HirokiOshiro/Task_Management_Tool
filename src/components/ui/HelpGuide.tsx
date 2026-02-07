import { useState } from 'react'
import {
  X,
  HelpCircle,
  Table2,
  LayoutGrid,
  GanttChart,
  CalendarDays,
  Plus,
  FileDown,
  FileUp,
  Filter,
  GripVertical,
  MousePointerClick,
  ChevronRight,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: 'overview',
    title: 'はじめに',
    icon: <HelpCircle size={16} />,
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>
          このアプリはタスクを管理するためのツールです。
          テーブル・カンバン・ガントチャート・カレンダーの4つのビューでタスクを確認・編集できます。
        </p>
        <div className="rounded-lg bg-primary/5 p-3 text-xs">
          <p className="font-medium text-primary mb-1">💡 ヒント</p>
          <p>左下のサイドバーからデモデータを読み込むと、すぐに機能を試すことができます。</p>
        </div>
      </div>
    ),
  },
  {
    id: 'task',
    title: 'タスクの作成と編集',
    icon: <Plus size={16} />,
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>
          ヘッダー右上の<span className="font-medium text-primary">「新規タスク」</span>ボタンをクリックすると新しいタスクが追加されます。
        </p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <MousePointerClick size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span>テーブルビューではセルをクリックして直接編集できます</span>
          </li>
          <li className="flex items-start gap-2">
            <MousePointerClick size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span>タスク名やガントバーをクリックすると詳細パネルが開きます</span>
          </li>
          <li className="flex items-start gap-2">
            <StickyNote size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span>詳細パネルの下部にあるメモ欄に自由にメモを書き込めます</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'views',
    title: '4つのビュー',
    icon: <Table2 size={16} />,
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>ヘッダーのタブでビューを切り替えられます。</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2">
            <Table2 size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <div className="font-medium text-foreground">テーブル</div>
              <div className="text-xs text-muted-foreground">スプレッドシートのようにタスクを一覧表示。セルをクリックして直接編集、カラム幅の調整ができます。</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2">
            <LayoutGrid size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
            <div>
              <div className="font-medium text-foreground">カンバン</div>
              <div className="text-xs text-muted-foreground">ステータスごとにカードを表示。ドラッグ＆ドロップでステータスを変更できます。</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2">
            <GanttChart size={16} className="mt-0.5 flex-shrink-0 text-orange-500" />
            <div>
              <div className="font-medium text-foreground">ガントチャート</div>
              <div className="text-xs text-muted-foreground">
                タスクの開始日〜期限をバーで表示。バーをドラッグして日程を移動したり、バーの端をドラッグして期間を調整できます。
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2">
            <CalendarDays size={16} className="mt-0.5 flex-shrink-0 text-purple-500" />
            <div>
              <div className="font-medium text-foreground">カレンダー</div>
              <div className="text-xs text-muted-foreground">月間カレンダーに期限のあるタスクを表示。タスクをクリックすると詳細を確認できます。</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'filter',
    title: 'フィルタとソート',
    icon: <Filter size={16} />,
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>ヘッダー下部のフィルタバーでタスクを絞り込めます。</p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">フィルタ追加：</span>「+ フィルタ」をクリックし、フィールド・条件・値を選択</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">ソート：</span>テーブルビューのカラムヘッダーをクリックするとソートできます</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'sidebar',
    title: 'サイドバーの機能',
    icon: <GripVertical size={16} />,
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>左側のサイドバーでは以下の操作ができます。</p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">ビュー管理：</span>ビューの追加・名前変更・削除</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">フィールド管理：</span>カスタムフィールドの追加やドラッグ並び替え、表示/非表示の切り替え</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">テーマ切替：</span>ライト/ダークモードの切り替え</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'data',
    title: 'データの保存と読み込み',
    icon: <FileDown size={16} />,
    content: (
      <div className="space-y-3 text-sm text-foreground/80">
        <p>サイドバーの「データソース」セクションからファイルの操作ができます。</p>
        <ul className="space-y-2 pl-1">
          <li className="flex items-start gap-2">
            <FileUp size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">ファイルを開く：</span>JSON または Excel（.xlsx）ファイルを読み込み</span>
          </li>
          <li className="flex items-start gap-2">
            <FileDown size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">保存：</span>現在のデータをJSONファイルとして保存</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
            <span><span className="font-medium">デモデータ：</span>サンプルデータを読み込んで機能を試すことができます</span>
          </li>
        </ul>
      </div>
    ),
  },
]

export function HelpGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('overview')

  if (!open) return null

  const current = sections.find((s) => s.id === activeSection) ?? sections[0]

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onClose} />
      {/* モーダル */}
      <div className="fixed inset-4 z-[61] flex items-center justify-center sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl">
        <div className="flex h-[480px] w-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl sm:flex-row">
          {/* サイドナビ */}
          <div className="flex flex-shrink-0 flex-col border-b border-border bg-muted/30 sm:w-48 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <HelpCircle size={18} className="text-primary" />
              <h2 className="text-sm font-semibold">使い方ガイド</h2>
            </div>
            <nav className="flex flex-row overflow-x-auto p-1 sm:flex-col sm:overflow-x-visible sm:p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs transition-colors sm:text-sm',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* コンテンツ */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {current.icon}
                {current.title}
              </h3>
              <button
                onClick={onClose}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                title="閉じる"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {current.content}
            </div>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground text-center">
              ガイドはヘッダーの <HelpCircle size={12} className="inline" /> ボタンからいつでも開けます
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
