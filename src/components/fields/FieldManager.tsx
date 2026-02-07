import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '@/stores/task-store'
import type { FieldType, FieldDefinition } from '@/types/task'
import { Eye, EyeOff, Trash2, Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'テキスト',
  number: '数値',
  select: 'セレクト',
  multi_select: 'マルチセレクト',
  date: '日付',
  person: '担当者',
  checkbox: 'チェックボックス',
  url: 'URL',
  progress: '進捗',
}

export function FieldManager() {
  const { fields, addField, updateField, deleteField, reorderFields } = useTaskStore()
  const [showAddForm, setShowAddForm] = useState(false)

  const sortedFields = [...fields].sort((a, b) => a.order - b.order)
  const fieldIds = sortedFields.map((f) => f.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = fieldIds.indexOf(String(active.id))
      const newIndex = fieldIds.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = [...fieldIds]
      newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, String(active.id))
      reorderFields(newOrder)
    },
    [fieldIds, reorderFields]
  )

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          フィールド管理
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title="フィールドを追加"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* フィールド一覧（D&D対応） */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-0.5">
            {sortedFields.map((field) => (
              <SortableFieldItem
                key={field.id}
                field={field}
                onToggleVisibility={() => updateField(field.id, { visible: !field.visible })}
                onDelete={() => deleteField(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* フィールド追加フォーム */}
      {showAddForm && (
        <AddFieldForm
          onAdd={(name, type) => {
            addField({
              name,
              type,
              required: false,
              visible: true,
              isSystem: false,
              width: 150,
            })
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

/** ソート可能なフィールドアイテム */
function SortableFieldItem({
  field,
  onToggleVisibility,
  onDelete,
}: {
  field: FieldDefinition
  onToggleVisibility: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-1.5 rounded px-1.5 py-1 hover:bg-accent/50 text-sm',
        isDragging && 'opacity-50 bg-accent/30'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={12} className="text-muted-foreground/30 flex-shrink-0" />
      </div>
      <span className={cn('flex-1 truncate', !field.visible && 'text-muted-foreground/50')}>
        {field.name}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {FIELD_TYPE_LABELS[field.type]}
      </span>
      {/* 表示/非表示 */}
      <button
        onClick={onToggleVisibility}
        className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
        title={field.visible ? '非表示にする' : '表示する'}
      >
        {field.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
      {/* 削除（システムフィールド以外） */}
      {!field.isSystem && (
        <button
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
          title="フィールドを削除"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function AddFieldForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, type: FieldType) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<FieldType>('text')

  return (
    <div className="mt-2 rounded border border-border bg-background p-2 space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="フィールド名"
        className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as FieldType)}
        className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([t, label]) => (
          <option key={t} value={t}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-1">
        <button
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          キャンセル
        </button>
        <button
          onClick={() => {
            if (name.trim()) onAdd(name.trim(), type)
          }}
          disabled={!name.trim()}
          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          追加
        </button>
      </div>
    </div>
  )
}
