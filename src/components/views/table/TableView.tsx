import { useState, useCallback, useRef, useEffect } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import { useViewStore } from '@/stores/view-store'
import { useFilteredTasks } from '@/hooks/useFilteredTasks'
import type { FieldDefinition, Task } from '@/types/task'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeUrl, sanitizeColor } from '@/lib/sanitize'
import { TaskCheckButton } from '@/components/ui/TaskCheckButton'
import { useI18n, translateFieldName, translateOptionLabel } from '@/i18n'
import type { Locale } from '@/i18n/locales/ja'

export function TableView() {
  const { addTask, deleteTask, updateTask, updateField } = useTaskStore()
  const { filteredTasks, fields } = useFilteredTasks()
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)
  const activeView = useViewStore((s) => s.getActiveView())
  const { setSorts } = useViewStore()
  const { t } = useI18n()

  const visibleFields = fields
    .filter((f) => activeView.visibleFieldIds.includes(f.id))
    .sort((a, b) => {
      const idxA = activeView.visibleFieldIds.indexOf(a.id)
      const idxB = activeView.visibleFieldIds.indexOf(b.id)
      return idxA - idxB
    })

  // フィルタ適用済み → ソート適用
  const sortedTasks = applySorts(filteredTasks, activeView.sorts, fields)

  // 行追加
  const handleAddTask = useCallback(() => {
    addTask({
      [SYSTEM_FIELD_IDS.TITLE]: '',
      [SYSTEM_FIELD_IDS.STATUS]: 'not_started',
    })
  }, [addTask])

  // ソートトグル
  const handleSort = useCallback(
    (fieldId: string) => {
      const current = activeView.sorts.find((s) => s.fieldId === fieldId)
      if (!current) {
        setSorts([{ fieldId, direction: 'asc' }])
      } else if (current.direction === 'asc') {
        setSorts([{ fieldId, direction: 'desc' }])
      } else {
        setSorts([])
      }
    },
    [activeView.sorts, setSorts]
  )

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
            {/* 行操作カラム（完了チェック＋削除） */}
            <th className="w-16 px-2 py-2 text-left text-xs font-medium text-muted-foreground">{t.common.done}</th>
            {visibleFields.map((field) => {
              const sort = activeView.sorts.find((s) => s.fieldId === field.id)
              return (
                <th
                  key={field.id}
                  className="group/th relative cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground hover:text-foreground select-none"
                  style={{ width: field.width ?? 150, minWidth: 80 }}
                  onClick={() => handleSort(field.id)}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{translateFieldName(t, field.id, field.name)}</span>
                    {sort ? (
                      sort.direction === 'asc' ? (
                        <ArrowUp size={14} className="text-primary flex-shrink-0" />
                      ) : (
                        <ArrowDown size={14} className="text-primary flex-shrink-0" />
                      )
                    ) : (
                      <ArrowUpDown
                        size={14}
                        className="opacity-0 group-hover/th:opacity-50 flex-shrink-0"
                      />
                    )}
                  </div>
                  {/* リサイズハンドル */}
                  <ColumnResizeHandle
                    currentWidth={field.width ?? 150}
                    onResize={(w) => updateField(field.id, { width: w })}
                  />
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              visibleFields={visibleFields}
              updateTask={updateTask}
              deleteTask={deleteTask}
              openDetailPanel={openDetailPanel}
              t={t}
            />
          ))}
          {/* 新規行追加 */}
          <tr>
            <td colSpan={visibleFields.length + 1}>
              <button
                onClick={handleAddTask}
                className="flex w-full items-center gap-2 px-5 py-2 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                <Plus size={14} />
                {t.common.newTask}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** テーブル行（完了フェードアウト対応） */
function TaskRow({
  task,
  visibleFields,
  updateTask,
  deleteTask,
  openDetailPanel,
  t,
}: {
  task: Task
  visibleFields: FieldDefinition[]
  updateTask: (taskId: string, fieldId: string, value: unknown) => void
  deleteTask: (taskId: string) => void
  openDetailPanel: (taskId: string) => void
  t: Locale
}) {
  const [fadingOut, setFadingOut] = useState(false)

  // 開始日が変更されたときに期限を自動設定する
  const handleUpdateTask = (taskId: string, fieldId: string, value: unknown) => {
    updateTask(taskId, fieldId, value)

    // 開始日が変更され、期限が未設定の場合は自動設定
    if (fieldId === SYSTEM_FIELD_IDS.START_DATE && value) {
      const dueDate = task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE]
      if (!dueDate) {
        updateTask(taskId, SYSTEM_FIELD_IDS.DUE_DATE, value)
      }
    }
  }

  return (
    <tr
      className={cn(
        'group border-b border-border hover:bg-muted/30 transition-colors',
        fadingOut && 'animate-check-row-fade'
      )}
    >
      {/* 行操作 */}
      <td className="px-2 py-1">
        <div className="flex items-center gap-0.5">
          {/* 完了チェックボックス */}
          <TaskCheckButton
            taskId={task.id}
            status={task.fieldValues[SYSTEM_FIELD_IDS.STATUS] as string}
            onBeforeComplete={() => setFadingOut(true)}
            onAfterComplete={() => setFadingOut(false)}
          />
          <button
            onClick={() => deleteTask(task.id)}
            className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
            title={t.table.deleteTask}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
      {visibleFields.map((field) => (
        <td key={field.id} className="px-3 py-1.5">
          <EditableCell
            taskId={task.id}
            field={field}
            value={task.fieldValues[field.id]}
            onUpdate={handleUpdateTask}
            onOpenDetail={
              field.id === SYSTEM_FIELD_IDS.TITLE
                ? () => openDetailPanel(task.id)
                : undefined
            }
          />
        </td>
      ))}
    </tr>
  )
}

/** インライン編集可能なセル */
function EditableCell({
  taskId,
  field,
  value,
  onUpdate,
  onOpenDetail,
}: {
  taskId: string
  field: FieldDefinition
  value: unknown
  onUpdate: (taskId: string, fieldId: string, value: unknown) => void
  onOpenDetail?: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <CellEditor
        field={field}
        value={value}
        onSave={(newValue) => {
          onUpdate(taskId, field.id, newValue)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  // タイトルフィールドの場合は詳細画面アクセス用のUIを追加
  if (field.id === SYSTEM_FIELD_IDS.TITLE && onOpenDetail) {
    return (
      <div className="group relative">
        <div
          className={cn(
            'min-h-[24px] cursor-pointer rounded px-1 py-0.5 hover:bg-accent/50 transition-colors font-medium'
          )}
          onClick={() => setEditing(true)}
          onDoubleClick={onOpenDetail}
          title="ダブルクリックで詳細を開く"
        >
          <CellRenderer value={value} field={field} />
        </div>
        {/* ホバー時のヒントアイコン */}
        <button
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail()
          }}
          title="詳細を開く"
        >
          <ExternalLink size={12} className="text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-[24px] cursor-pointer rounded px-1 py-0.5 hover:bg-accent/50 transition-colors',
        field.id === SYSTEM_FIELD_IDS.TITLE && 'font-medium'
      )}
      onClick={() => {
        if (field.type === 'checkbox') {
          onUpdate(taskId, field.id, !value)
        } else {
          setEditing(true)
        }
      }}
      onDoubleClick={onOpenDetail}
    >
      <CellRenderer value={value} field={field} />
    </div>
  )
}

/** セル表示 */
function CellRenderer({
  value,
  field,
}: {
  value: unknown
  field: FieldDefinition
}) {
  const { t } = useI18n()
  if (value == null || value === '') {
    return <span className="text-muted-foreground/40">-</span>
  }

  switch (field.type) {
    case 'select': {
      const option = field.options?.find((o) => o.id === value)
      if (!option) return <span className="text-muted-foreground">{String(value)}</span>
      return (
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: sanitizeColor(option.color) + '20', color: sanitizeColor(option.color) }}
        >
          {translateOptionLabel(t, field.id, option.id, option.label)}
        </span>
      )
    }
    case 'multi_select': {
      const values = Array.isArray(value) ? value : []
      if (values.length === 0) return <span className="text-muted-foreground/40">-</span>
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v: string) => (
            <span
              key={v}
              className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs"
            >
              {v}
            </span>
          ))}
        </div>
      )
    }
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          readOnly
          className="h-4 w-4 accent-primary cursor-pointer"
        />
      )
    case 'progress': {
      const num = Number(value) || 0
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-full max-w-[80px] rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(num, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{num}%</span>
        </div>
      )
    }
    case 'date':
      return <span className="tabular-nums">{String(value)}</span>
    case 'url': {
      const safeHref = sanitizeUrl(String(value))
      return safeHref ? (
        <a
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline text-xs truncate block max-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">{String(value)}</span>
      )
    }
    case 'person':
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {String(value).charAt(0)}
          </div>
          <span className="text-sm">{String(value)}</span>
        </div>
      )
    default:
      return <span className="text-sm">{String(value)}</span>
  }
}

/** セルエディタ */
function CellEditor({
  field,
  value,
  onSave,
  onCancel,
}: {
  field: FieldDefinition
  value: unknown
  onSave: (value: unknown) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    // フォーカスを当てる
    const el = inputRef.current ?? textareaRef.current
    if (el) {
      el.focus()
      if ('select' in el) el.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  switch (field.type) {
    case 'text':
    case 'person':
    case 'url':
      return (
        <input
          ref={inputRef}
          type="text"
          defaultValue={value != null ? String(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(e.target.value || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value || undefined)
            handleKeyDown(e)
          }}
        />
      )
    case 'number':
      return (
        <input
          ref={inputRef}
          type="number"
          defaultValue={value != null ? Number(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(e.target.value ? Number(e.target.value) : undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value
              onSave(v ? Number(v) : undefined)
            }
            handleKeyDown(e)
          }}
        />
      )
    case 'progress':
      return (
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          defaultValue={value != null ? Number(value) : 0}
          className="w-20 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = Number((e.target as HTMLInputElement).value) || 0
              onSave(Math.min(100, Math.max(0, v)))
            }
            handleKeyDown(e)
          }}
        />
      )
    case 'date':
      return (
        <input
          ref={inputRef}
          type="date"
          defaultValue={value != null ? String(value) : ''}
          className="rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(e.target.value || undefined)}
          onChange={(e) => onSave(e.target.value || undefined)}
          onKeyDown={handleKeyDown}
        />
      )
    case 'select':
      return (
        <select
          defaultValue={value != null ? String(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => onSave(e.target.value || undefined)}
          onBlur={() => onCancel()}
          autoFocus
        >
          <option value="">-</option>
          {field.options?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {translateOptionLabel(t, field.id, opt.id, opt.label)}
            </option>
          ))}
        </select>
      )
    case 'multi_select': {
      const current = Array.isArray(value) ? (value as string[]) : []
      return (
        <MultiSelectEditor
          options={field.options ?? []}
          value={current}
          onSave={onSave}
          onCancel={onCancel}
        />
      )
    }
    default:
      return (
        <input
          ref={inputRef}
          type="text"
          defaultValue={value != null ? String(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(e.target.value || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value || undefined)
            handleKeyDown(e)
          }}
        />
      )
  }
}

/** マルチセレクトエディタ */
function MultiSelectEditor({
  options,
  value,
  onSave,
  onCancel,
}: {
  options: { id: string; label: string; color: string }[]
  value: string[]
  onSave: (value: unknown) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<string[]>(value)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const toggle = (v: string) => {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (inputValue.trim()) {
        setSelected((prev) => [...prev, inputValue.trim()])
        setInputValue('')
      } else {
        onSave(selected.length > 0 ? selected : undefined)
      }
    }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="rounded border border-input bg-background p-1.5 shadow-lg">
      {/* 選択済み */}
      <div className="flex flex-wrap gap-1 mb-1">
        {selected.map((v) => (
          <span
            key={v}
            className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs cursor-pointer hover:bg-destructive/10"
            onClick={() => toggle(v)}
          >
            {v} &times;
          </span>
        ))}
      </div>
      {/* 入力 */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(selected.length > 0 ? selected : undefined)}
        placeholder={t.table.enterToAdd}
        className="w-full text-xs px-1 py-0.5 outline-none bg-transparent"
      />
      {/* 既存オプション */}
      {options.length > 0 && (
        <div className="mt-1 border-t border-border pt-1 max-h-24 overflow-y-auto">
          {options
            .filter((o) => !selected.includes(o.label))
            .map((o) => (
              <button
                key={o.id}
                className="block w-full text-left px-1 py-0.5 text-xs hover:bg-accent rounded"
                onMouseDown={(e) => {
                  e.preventDefault()
                  toggle(o.label)
                }}
              >
                {o.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

/** ソート適用 */
function applySorts(
  tasks: Task[],
  sorts: { fieldId: string; direction: 'asc' | 'desc' }[],
  _fields: FieldDefinition[]
): Task[] {
  if (sorts.length === 0) return tasks

  return [...tasks].sort((a, b) => {
    for (const sort of sorts) {
      const valA = a.fieldValues[sort.fieldId]
      const valB = b.fieldValues[sort.fieldId]

      let cmp = 0
      if (valA == null && valB == null) cmp = 0
      else if (valA == null) cmp = 1
      else if (valB == null) cmp = -1
      else if (typeof valA === 'number' && typeof valB === 'number') cmp = valA - valB
      else cmp = String(valA).localeCompare(String(valB), 'ja')

      if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

/** カラムリサイズハンドル */
function ColumnResizeHandle({
  currentWidth,
  onResize,
}: {
  currentWidth: number
  onResize: (width: number) => void
}) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startWidth = currentWidth

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        const newWidth = Math.max(80, startWidth + delta)
        onResize(newWidth)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [currentWidth, onResize]
  )

  return (
    <div
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 hover:opacity-100 group-hover/th:opacity-50 bg-primary/40 transition-opacity"
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
