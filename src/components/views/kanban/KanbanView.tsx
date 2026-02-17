import { useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useViewStore } from '@/stores/view-store'
import { useUIStore } from '@/stores/ui-store'
import { useFilteredTasks } from '@/hooks/useFilteredTasks'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import type { Task } from '@/types/task'
import { cn } from '@/lib/utils'
import { sanitizeColor } from '@/lib/sanitize'
import { Plus } from 'lucide-react'
import { useI18n, translateFieldName, translateOptionLabel } from '@/i18n'

export function KanbanView() {
  const { updateTask, addTask } = useTaskStore()
  const { filteredTasks: tasks, fields } = useFilteredTasks()
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)
  const activeView = useViewStore((s) => s.getActiveView())
  const setKanbanGroupFieldId = useViewStore((s) => s.setKanbanGroupFieldId)
  const groupFieldId = activeView.kanbanGroupFieldId ?? SYSTEM_FIELD_IDS.STATUS
  const groupField = fields.find((f) => f.id === groupFieldId)
  const options = groupField?.options ?? []
  const { t } = useI18n()

  // グループ化に使えるフィールド（select, multi_select, person型）
  const groupableFields = useMemo(() =>
    fields.filter((f) => f.type === 'select' || f.type === 'multi_select' || f.type === 'person'),
    [fields]
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  // カラムデータ（フィールドタイプ別に分岐）
  const columns = useMemo(() => {
    if (!groupField) return []

    // person型: 全タスクから担当者名を収集してカラム化
    if (groupField.type === 'person') {
      const personSet = new Set<string>()
      tasks.forEach((tk) => {
        const val = tk.fieldValues[groupFieldId]
        if (Array.isArray(val)) {
          (val as string[]).forEach((p) => personSet.add(p))
        } else if (typeof val === 'string' && val) {
          personSet.add(val)
        }
      })
      const cols = Array.from(personSet).sort().map((person) => ({
        id: person,
        label: person,
        color: '#6366f1',
        tasks: tasks.filter((tk) => {
          const val = tk.fieldValues[groupFieldId]
          return Array.isArray(val) ? (val as string[]).includes(person) : val === person
        }),
      }))
      const unassigned = tasks.filter((tk) => {
        const val = tk.fieldValues[groupFieldId]
        return !val || (Array.isArray(val) && (val as string[]).length === 0)
      })
      if (unassigned.length > 0) {
        cols.push({ id: '__unassigned__', label: t.kanban.uncategorized, color: '#94a3b8', tasks: unassigned })
      }
      return cols
    }

    // multi_select型: 各オプションをカラムに（タスクが複数カラムに表示される場合あり）
    if (groupField.type === 'multi_select') {
      const opts = groupField.options ?? []
      const cols = opts.map((option) => ({
        ...option,
        tasks: tasks.filter((tk) => {
          const val = tk.fieldValues[groupFieldId]
          return Array.isArray(val) ? (val as string[]).includes(option.id) : val === option.id
        }),
      }))
      const unassigned = tasks.filter((tk) => {
        const val = tk.fieldValues[groupFieldId]
        return !val || (Array.isArray(val) && (val as string[]).length === 0)
      })
      if (unassigned.length > 0) {
        cols.push({ id: '__unassigned__', label: t.kanban.uncategorized, color: '#94a3b8', tasks: unassigned })
      }
      return cols
    }

    // select型（既存ロジック）
    const cols = options.map((option) => ({
      ...option,
      tasks: tasks.filter((tk) => tk.fieldValues[groupFieldId] === option.id),
    }))
    const unassigned = tasks.filter(
      (tk) => !options.some((o) => o.id === tk.fieldValues[groupFieldId])
    )
    if (unassigned.length > 0) {
      cols.push({
        id: '__unassigned__',
        label: t.kanban.uncategorized,
        color: '#94a3b8',
        tasks: unassigned,
      })
    }
    return cols
  }, [tasks, options, groupFieldId, groupField, t])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeTask = activeId ? tasks.find((tk) => tk.id === activeId) : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  // フィールドタイプに応じた値解決
  const resolveNewValue = useCallback(
    (task: Task, targetColumnId: string): unknown => {
      if (targetColumnId === '__unassigned__') return undefined
      if (!groupField) return targetColumnId

      if (groupField.type === 'person') {
        // 担当者を置換: ドラッグ元カラムの担当者を除去し、ドロップ先の担当者に置換
        const current = task.fieldValues[groupFieldId]
        const arr = Array.isArray(current) ? [...current as string[]] : []
        // 現在のカラム（タスクが表示されているカラム）の担当者を特定するため、
        // arrから対象外の全カラムIDを残し、targetColumnIdを追加
        const sourceColumnId = findSourceColumn(task, columns)
        const filtered = sourceColumnId ? arr.filter((p) => p !== sourceColumnId) : arr
        if (!filtered.includes(targetColumnId)) {
          return [targetColumnId, ...filtered]
        }
        return filtered.length > 0 ? filtered : [targetColumnId]
      }

      if (groupField.type === 'multi_select') {
        // ドラッグ元オプションを除去し、ドロップ先オプションを追加
        const current = task.fieldValues[groupFieldId]
        const arr = Array.isArray(current) ? [...current as string[]] : []
        const sourceColumnId = findSourceColumn(task, columns)
        const filtered = sourceColumnId ? arr.filter((v) => v !== sourceColumnId) : arr
        if (!filtered.includes(targetColumnId)) {
          filtered.push(targetColumnId)
        }
        return filtered
      }

      // select型
      return targetColumnId
    },
    [groupField, groupFieldId, columns]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeTaskId = String(active.id)
      const overId = String(over.id)

      if (overId.startsWith('column-')) {
        const targetColumnId = overId.replace('column-', '')
        const task = tasks.find((tk) => tk.id === activeTaskId)
        if (task) {
          const newValue = resolveNewValue(task, targetColumnId)
          if (JSON.stringify(task.fieldValues[groupFieldId]) !== JSON.stringify(newValue)) {
            updateTask(activeTaskId, groupFieldId, newValue)
          }
        }
      }
    },
    [tasks, groupFieldId, updateTask, resolveNewValue]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      if (!over) return

      const activeTaskId = String(active.id)
      const overId = String(over.id)

      if (overId.startsWith('column-')) {
        const targetColumnId = overId.replace('column-', '')
        const task = tasks.find((tk) => tk.id === activeTaskId)
        if (task) {
          updateTask(activeTaskId, groupFieldId, resolveNewValue(task, targetColumnId))
        }
        return
      }

      // ドロップ先が別のタスクの場合 - そのタスクのカラムに移動
      const overTask = tasks.find((tk) => tk.id === overId)
      if (overTask) {
        const overColumnId = findSourceColumn(overTask, columns)
        if (overColumnId) {
          const activeTaskObj = tasks.find((tk) => tk.id === activeTaskId)
          if (activeTaskObj) {
            updateTask(activeTaskId, groupFieldId, resolveNewValue(activeTaskObj, overColumnId))
          }
        }
      }
    },
    [tasks, groupFieldId, updateTask, resolveNewValue, columns]
  )

  const handleAddTask = useCallback(
    (columnId: string) => {
      const fieldType = groupField?.type
      let value: unknown
      if (columnId === '__unassigned__') {
        value = undefined
      } else if (fieldType === 'person') {
        value = [columnId]
      } else if (fieldType === 'multi_select') {
        value = [columnId]
      } else {
        value = columnId
      }
      const task = addTask({
        [SYSTEM_FIELD_IDS.TITLE]: '',
        [groupFieldId]: value,
      })
      openDetailPanel(task.id)
    },
    [addTask, groupFieldId, groupField, openDetailPanel]
  )

  return (
    <div className="flex h-full flex-col">
      {/* グループ化フィールド選択 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
        <label className="text-xs text-muted-foreground">{t.kanban.groupBy}</label>
        <select
          value={groupFieldId}
          onChange={(e) => setKanbanGroupFieldId(e.target.value)}
          className="rounded border border-input bg-background px-2 py-1 text-xs"
        >
          {groupableFields.map((f) => (
            <option key={f.id} value={f.id}>{translateFieldName(t, f.id, f.name)}</option>
          ))}
        </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-3 overflow-x-auto p-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              groupFieldId={groupFieldId}
              fields={fields}
              onCardClick={openDetailPanel}
              onAddTask={() => handleAddTask(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCardContent task={activeTask} fields={fields} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

/** タスクが表示されているカラムを特定 */
function findSourceColumn(
  task: Task,
  columns: { id: string; tasks: Task[] }[]
): string | undefined {
  const col = columns.find((c) => c.tasks.some((t) => t.id === task.id))
  return col?.id
}

/** カラムコンポーネント */
function KanbanColumn({
  column,
  groupFieldId,
  fields,
  onCardClick,
  onAddTask,
}: {
  column: { id: string; label: string; color: string; tasks: Task[] }
  groupFieldId: string
  fields: ReturnType<typeof useTaskStore.getState>['fields']
  onCardClick: (taskId: string) => void
  onAddTask: () => void
}) {
  const taskIds = column.tasks.map((task) => task.id)
  const { t } = useI18n()
  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-muted/30">
      {/* カラムヘッダー */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: sanitizeColor(column.color) }}
        />
        <span className="text-sm font-medium truncate">{translateOptionLabel(t, groupFieldId, column.id, column.label)}</span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
          {column.tasks.length}
        </span>
      </div>

      {/* ドロップゾーン */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy} id={`column-${column.id}`}>
        <DroppableColumn columnId={column.id}>
          {column.tasks.map((task) => (
            <SortableCard key={task.id} task={task} fields={fields} onClick={() => onCardClick(task.id)} />
          ))}
        </DroppableColumn>
      </SortableContext>

      {/* タスク追加ボタン */}
      <button
        onClick={onAddTask}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <Plus size={14} />
        {t.common.newTask}
      </button>
    </div>
  )
}

/** ドロップ可能カラム領域 */
function DroppableColumn({
  columnId,
  children,
}: {
  columnId: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useSortable({
    id: `column-${columnId}`,
    data: { type: 'column', columnId },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 min-h-[60px] transition-colors rounded',
        isOver && 'bg-primary/5'
      )}
    >
      {children}
    </div>
  )
}

/** ソート可能なカード */
function SortableCard({
  task,
  fields,
  onClick,
}: {
  task: Task
  fields: ReturnType<typeof useTaskStore.getState>['fields']
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(isDragging && 'opacity-30')}
    >
      <KanbanCardContent task={task} fields={fields} />
    </div>
  )
}

/** カードの見た目 */
function KanbanCardContent({
  task,
  fields,
  isDragging = false,
}: {
  task: Task
  fields: ReturnType<typeof useTaskStore.getState>['fields']
  isDragging?: boolean
}) {
  const { t } = useI18n()
  const priorityField = fields.find((f) => f.id === SYSTEM_FIELD_IDS.PRIORITY)
  const priorityOption = priorityField?.options?.find(
    (o) => o.id === task.fieldValues[SYSTEM_FIELD_IDS.PRIORITY]
  )

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-card p-3 shadow-sm cursor-pointer transition-shadow',
        isDragging ? 'shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md'
      )}
    >
      <div className="text-sm font-medium leading-snug">
        {String(task.fieldValues[SYSTEM_FIELD_IDS.TITLE] ?? t.common.untitled)}
      </div>

      {(() => {
        const raw = task.fieldValues[SYSTEM_FIELD_IDS.ASSIGNEE]
        const assignees: string[] = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? [raw] : [])
        return assignees.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {assignees.map((person, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary">
                  {person.charAt(0)}
                </div>
                <span className="text-xs text-muted-foreground">{person}</span>
              </div>
            ))}
          </div>
        )
      })()}

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE] != null && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {String(task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE])}
          </span>
        )}
        {priorityOption && (
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: sanitizeColor(priorityOption.color) + '20', color: sanitizeColor(priorityOption.color) }}
          >
            {translateOptionLabel(t, SYSTEM_FIELD_IDS.PRIORITY, priorityOption.id, priorityOption.label)}
          </span>
        )}
      </div>

      {/* タグ */}
      {Array.isArray(task.fieldValues[SYSTEM_FIELD_IDS.TAGS]) &&
        (task.fieldValues[SYSTEM_FIELD_IDS.TAGS] as string[]).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(task.fieldValues[SYSTEM_FIELD_IDS.TAGS] as string[]).map((tag) => (
              <span
                key={tag}
                className="rounded bg-accent px-1.5 py-0.5 text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
    </div>
  )
}
