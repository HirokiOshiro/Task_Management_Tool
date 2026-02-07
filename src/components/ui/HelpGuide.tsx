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
  ShieldCheck,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  Database,
  HardDrive,
  Info,
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
      <div className="space-y-4 text-sm text-foreground/80">
        <p>サイドバーの「データ」セクションからファイルの操作ができます。</p>

        {/* データの保存先 */}
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <HardDrive size={14} className="text-primary" />
            <span>データの保存先について</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            このツールはブラウザ上で動作するアプリです。タスクデータは
            <span className="font-medium text-green-600 dark:text-green-400">ブラウザのローカルストレージに自動保存</span>されるため、
            ページを閉じても次回アクセス時にデータが復元されます。
            ただしブラウザのデータ削除を行うと消えるため、大切なデータはファイルにもエクスポートしてください。
          </p>
        </div>

        {/* 操作一覧 */}
        <div className="space-y-2.5">
          <div className="font-medium text-foreground text-xs">操作一覧</div>

          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
            <FileUp size={15} className="mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <div className="font-medium text-foreground text-xs">ファイルを開く</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                JSON または Excel（.xlsx）ファイルを選択して読み込みます。
                以前保存したファイルを開いて作業を再開できます。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
            <FileJson size={15} className="mt-0.5 flex-shrink-0 text-green-500" />
            <div>
              <div className="font-medium text-foreground text-xs">JSONで保存</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                すべてのタスク・フィールド設定・ビュー設定をJSON形式でダウンロードします。
                <span className="font-medium text-foreground">推奨の保存形式</span>です。フィールド構成やメモなど全ての情報が保存されます。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
            <FileSpreadsheet size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
            <div>
              <div className="font-medium text-foreground text-xs">Excelで保存</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                タスクデータをExcelファイル（.xlsx）としてダウンロードします。
                ExcelやGoogleスプレッドシートでの開覧・共有に便利です。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
            <Database size={15} className="mt-0.5 flex-shrink-0 text-violet-500" />
            <div>
              <div className="font-medium text-foreground text-xs">デモデータ</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                サンプルのタスクデータを読み込みます。初めて使う方はまずこちらを読み込んで、
                操作を試してみてください。
              </div>
            </div>
          </div>
        </div>

        {/* 保存状態の見方 */}
        <div className="rounded-lg bg-primary/5 p-3 text-xs space-y-1">
          <p className="font-medium text-primary">💡 保存状態の確認方法</p>
          <p>
            画面下部のステータスバーに接続状態が表示されます。
            サイドバーの保存ボタン横に<span className="inline-flex items-center mx-0.5"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /></span>が表示されている場合は未保存の変更があります。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'safety',
    title: '安全性について',
    icon: <ShieldCheck size={16} />,
    content: (
      <div className="space-y-4 text-sm text-foreground/80">
        <p>このツールはプライバシーとセキュリティを重視して設計されています。</p>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 rounded-md bg-green-500/10 p-2.5">
            <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <div className="font-medium text-foreground text-xs">完全ローカル動作</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                すべてのデータはお使いのブラウザ内でのみ処理されます。
                外部サーバーへのデータ送信は一切行われません。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-green-500/10 p-2.5">
            <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <div className="font-medium text-foreground text-xs">アカウント不要</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                ユーザー登録やログインは不要です。個人情報の入力も必要ありません。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-green-500/10 p-2.5">
            <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <div className="font-medium text-foreground text-xs">ファイルアクセス</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                ファイルの読み書きはブラウザ標準のAPIを使用し、ユーザーが明示的に選択したファイルのみにアクセスします。
                勝手にファイルを読み取ったり、他のファイルにアクセスすることはありません。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-green-500/10 p-2.5">
            <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <div className="font-medium text-foreground text-xs">Cookie・トラッキングなし</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Cookieやトラッキングは使用していません。ローカルストレージはテーマ設定とタスクデータの自動保存のみに使用されます。
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'caution',
    title: '利用上の注意点',
    icon: <AlertTriangle size={16} />,
    content: (
      <div className="space-y-4 text-sm text-foreground/80">
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 rounded-md bg-green-500/10 p-2.5">
            <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <div className="font-medium text-foreground text-xs">ブラウザ内自動保存</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                タスクデータはブラウザのローカルストレージに自動保存されます。
                ページを閉じても、次回アクセス時にデータが自動的に復元されます。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-amber-500/10 p-2.5">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <div className="font-medium text-foreground text-xs">ファイルへのバックアップを推奨</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                自動保存はブラウザ内のみです。ブラウザのデータ削除やキャッシュクリアを行うとデータが消えます。
                重要なデータは定期的に「JSONで保存」や「Excelで保存」でファイルにエクスポートしてください。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-amber-500/10 p-2.5">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <div className="font-medium text-foreground text-xs">デモデータの上書きに注意</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                「デモデータ」をクリックすると現在のデータがサンプルデータに置き換わります。
                大切なデータがある場合は先に保存してください。
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
            <Info size={15} className="mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <div className="font-medium text-foreground text-xs">対応ブラウザ</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                最新版のChrome・Edge・Safari・Firefoxを推奨します。
                古いブラウザでは一部の機能が正常に動作しない場合があります。
              </div>
            </div>
          </div>
        </div>
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
        <div className="flex h-[560px] w-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl sm:flex-row">
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
