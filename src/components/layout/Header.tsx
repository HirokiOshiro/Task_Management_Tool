import { useState } from 'react'
import {
  Menu,
  Plus,
  Table2,
  LayoutGrid,
  GanttChart,
  CalendarDays,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useViewStore } from '@/stores/view-store'
import { useTaskStore } from '@/stores/task-store'
import { FilterBar } from '@/components/filter-sort/FilterBar'
import { HelpGuide } from '@/components/ui/HelpGuide'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import type { ViewType } from '@/types/view'

const viewTabs: { type: ViewType; label: string; icon: React.ReactNode }[] = [
  { type: 'table', label: 'テーブル', icon: <Table2 size={16} /> },
  { type: 'kanban', label: 'カンバン', icon: <LayoutGrid size={16} /> },
  { type: 'gantt', label: 'ガント', icon: <GanttChart size={16} /> },
  { type: 'calendar', label: 'カレンダー', icon: <CalendarDays size={16} /> },
]

export function Header() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { views, activeViewId, setActiveView } = useViewStore()
  const addTask = useTaskStore((s) => s.addTask)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <>
    <HelpGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
    <header className="border-b border-border bg-background">
      <div className="flex h-12 items-center px-4">
        {/* サイドバートグル */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded p-1 hover:bg-accent"
            title="サイドバーを開く"
          >
            <Menu size={18} />
          </button>
        )}

        {/* ビュー切替タブ */}
        <div className="flex items-center gap-1">
          {viewTabs.map((tab) => {
            const view = views.find((v) => v.type === tab.type)
            if (!view) return null
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  activeViewId === view.id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* スペーサー */}
        <div className="flex-1" />

        {/* アクションボタン */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHelpOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="使い方ガイド"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => addTask({ [SYSTEM_FIELD_IDS.TITLE]: '', [SYSTEM_FIELD_IDS.STATUS]: 'not_started' })}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新規タスク</span>
          </button>
        </div>
      </div>

      {/* フィルタバー */}
      <div className="px-4 pb-2">
        <FilterBar />
      </div>
    </header>
    </>
  )
}
