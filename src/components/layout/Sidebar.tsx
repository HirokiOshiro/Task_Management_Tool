import { useState } from 'react'
import {
  LayoutGrid,
  Table2,
  GanttChart,
  CalendarDays,
  ChevronLeft,
  Database,
  Sun,
  Moon,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useViewStore } from '@/stores/view-store'
import { useI18n, translateViewName } from '@/i18n'
import { FieldManager } from '@/components/fields/FieldManager'
import { DataSourceSelector } from '@/components/data-source/DataSourceSelector'
import type { ViewType } from '@/types/view'
import { SYSTEM_FIELD_IDS } from '@/types/task'

const VIEW_TYPES: ViewType[] = ['table', 'kanban', 'gantt', 'calendar']

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()
  const { views, activeViewId, setActiveView, addView, deleteView, updateView } = useViewStore()
  const { t } = useI18n()
  const [editingViewId, setEditingViewId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showAddView, setShowAddView] = useState(false)

  const VIEW_TYPE_META: Record<ViewType, { label: string; icon: React.ReactNode }> = {
    table: { label: t.views.table, icon: <Table2 size={18} /> },
    kanban: { label: t.views.kanban, icon: <LayoutGrid size={18} /> },
    gantt: { label: t.views.gantt, icon: <GanttChart size={18} /> },
    calendar: { label: t.views.calendar, icon: <CalendarDays size={18} /> },
  }

  const startRename = (viewId: string, currentName: string) => {
    setEditingViewId(viewId)
    setEditingName(currentName)
  }

  const commitRename = () => {
    if (editingViewId && editingName.trim()) {
      updateView(editingViewId, { name: editingName.trim() })
    }
    setEditingViewId(null)
  }

  const handleAddView = (type: ViewType) => {
    const meta = VIEW_TYPE_META[type]
    const newView = addView({
      name: `${meta.label} ${t.views.newViewSuffix}`,
      type,
      sorts: [],
      filters: [],
      visibleFieldIds: [
        SYSTEM_FIELD_IDS.TITLE,
        SYSTEM_FIELD_IDS.STATUS,
        SYSTEM_FIELD_IDS.ASSIGNEE,
        SYSTEM_FIELD_IDS.DUE_DATE,
      ],
      kanbanGroupFieldId: type === 'kanban' ? SYSTEM_FIELD_IDS.STATUS : undefined,
      ganttStartFieldId: type === 'gantt' ? SYSTEM_FIELD_IDS.START_DATE : undefined,
      ganttEndFieldId: type === 'gantt' ? SYSTEM_FIELD_IDS.DUE_DATE : undefined,
    })
    setActiveView(newView.id)
    setShowAddView(false)
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
      )}
    >
      {/* ヘッダー */}
      <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-primary" />
          <span className="text-sm font-semibold">{t.sidebar.appTitle}</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded p-1 hover:bg-accent"
          title={t.sidebar.closeSidebar}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* ビュー一覧 + フィールド管理 */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-xs font-medium text-muted-foreground">{t.views.viewLabel}</span>
            <button
              onClick={() => setShowAddView(!showAddView)}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title={t.sidebar.addViewTitle}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* ビュー追加パネル */}
          {showAddView && (
            <div className="mb-1 rounded border border-border bg-background p-1.5 space-y-0.5">
              {VIEW_TYPES.map((type) => {
                const meta = VIEW_TYPE_META[type]
                return (
                  <button
                    key={type}
                    onClick={() => handleAddView(type)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
                  >
                    {meta.icon}
                    {meta.label} {t.views.addView}
                  </button>
                )
              })}
            </div>
          )}

          {/* ビュー一覧 */}
          {views.map((view) => {
            const meta = VIEW_TYPE_META[view.type]
            const isActive = activeViewId === view.id
            const isEditing = editingViewId === view.id

            return (
              <div
                key={view.id}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-accent/50'
                )}
              >
                <button
                  className="flex flex-1 items-center gap-2 min-w-0"
                  onClick={() => setActiveView(view.id)}
                >
                  {meta?.icon}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setEditingViewId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-transparent border-b border-primary text-sm outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{translateViewName(t, view.name)}</span>
                  )}
                </button>

                {/* 操作ボタン */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={commitRename}
                        className="rounded p-0.5 text-green-500 hover:bg-accent"
                        title={t.sidebar.confirmTitle}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingViewId(null)}
                        className="rounded p-0.5 text-muted-foreground hover:bg-accent"
                        title={t.sidebar.cancelTitle}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startRename(view.id, view.name)
                        }}
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        title={t.sidebar.renameTitle}
                      >
                        <Pencil size={12} />
                      </button>
                      {views.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteView(view.id)
                          }}
                          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                          title={t.sidebar.deleteViewTitle}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* データソース */}
        <div className="border-t border-sidebar-border">
          <DataSourceSelector />
        </div>

        {/* フィールド管理 */}
        <div className="border-t border-sidebar-border">
          <FieldManager />
        </div>
      </nav>

      {/* フッター */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {theme === 'light' ? t.sidebar.darkMode : t.sidebar.lightMode}
        </button>
      </div>
    </aside>
  )
}
