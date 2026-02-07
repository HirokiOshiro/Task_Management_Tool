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
import { Plus } from 'lucide-react'
import { useI18n, translateOptionLabel } from '@/i18n'

export function KanbanView() {
  const { updateTask, addTask } = useTaskStore()
  const { filteredTasks: tasks, fields } = useFilteredTasks()
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)
  const activeView = useViewStore((s) => s.getActiveView())
  const groupFieldId = activeView.kanbanGroupFieldId ?? SYSTEM_FIELD_IDS.STATUS
  const groupField = fields.find((f) => f.id === groupFieldId)
  const options = groupField?.options ?? []
  const { t } = useI18n()

  const [activeId, setActiveId] = useState<string | null>(null)

  // カラムデータ
  const columns = useMemo(() => {
    const cols = options.map((option) => ({
      ...option,
      tasks: tasks.filter((tk) => tk.fieldValues[groupFieldId] === option.id),
    }))
    // 未分類
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
  }, [tasks, options, groupFieldId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeTask = activeId ? tasks.find((tk) => tk.id === activeId) : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeTaskId = String(active.id)
      const overId = String(over.id)

      // ドロップ先がカラム（column-xxx）の場合
      if (overId.startsWith('column-')) {
        const targetColumnId = overId.replace('column-', '')
        const newValue = targetColumnId === '__unassigned__' ? undefined : targetColumnId
        const task = tasks.find((tk) => tk.id === activeTaskId)
        if (task && task.fieldValues[groupFieldId] !== newValue) {
          updateTask(activeTaskId, groupFieldId, newValue)
        }
      }
    },
    [tasks, groupFieldId, updateTask]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)
      if (!over) return

      const activeTaskId = String(active.id)
      const overId = String(over.id)

      // ドロップ先がカラムの場合
      if (overId.startsWith('column-')) {
        const targetColumnId = overId.replace('column-', '')
        const newValue = targetColumnId === '__unassigned__' ? undefined : targetColumnId
        updateTask(activeTaskId, groupFieldId, newValue)
        return
      }

      // ドロップ先が別のタスクの場合 - そのタスクのカラムに移動
      const overTask = tasks.find((tk) => tk.id === overId)
      if (overTask) {
        const overColumnValue = overTask.fieldValues[groupFieldId]
        const activeTask = tasks.find((tk) => tk.id === activeTaskId)
        if (activeTask && activeTask.fieldValues[groupFieldId] !== overColumnValue) {
          updateTask(activeTaskId, groupFieldId, overColumnValue)
        }
      }
    },
    [tasks, groupFieldId, updateTask]
  )

  const handleAddTask = useCallback(
    (columnId: string) => {
      const value = columnId === '__unassigned__' ? undefined : columnId
      const task = addTask({
        [SYSTEM_FIELD_IDS.TITLE]: '',
        [groupFieldId]: value,
      })
      openDetailPanel(task.id)
    },
    [addTask, groupFieldId, openDetailPanel]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3 overflow-x-auto p-4">
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
  )
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
          style={{ backgroundColor: column.color }}
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

      {task.fieldValues[SYSTEM_FIELD_IDS.ASSIGNEE] != null && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary">
            {String(task.fieldValues[SYSTEM_FIELD_IDS.ASSIGNEE]).charAt(0)}
          </div>
          <span className="text-xs text-muted-foreground">
            {String(task.fieldValues[SYSTEM_FIELD_IDS.ASSIGNEE])}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE] != null && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {String(task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE])}
          </span>
        )}
        {priorityOption && (
          <span
            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: priorityOption.color + '20', color: priorityOption.color }}
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
