import { useState, useCallback, useMemo } from 'react'
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
import { useViewStore } from '@/stores/view-store'
import type { FieldType, FieldDefinition } from '@/types/task'
import { Eye, EyeOff, Trash2, Plus, GripVertical, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n, translateFieldName } from '@/i18n'
import { generateId } from '@/lib/id'
import { sanitizeColor } from '@/lib/sanitize'

export function FieldManager() {
  const { fields, addField, updateField, updateFieldOptions, deleteField, reorderFields } = useTaskStore()
  const { views, updateView } = useViewStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [openFieldIds, setOpenFieldIds] = useState<string[]>([])
  const { t } = useI18n()

  /** フィールドの表示/非表示を切り替え、全ビューの visibleFieldIds にも反映する */
  const toggleVisibility = useCallback(
    (field: FieldDefinition) => {
      const newVisible = !field.visible
      updateField(field.id, { visible: newVisible })
      for (const view of views) {
        const ids = view.visibleFieldIds
        if (newVisible && !ids.includes(field.id)) {
          updateView(view.id, { visibleFieldIds: [...ids, field.id] })
        } else if (!newVisible && ids.includes(field.id)) {
          updateView(view.id, { visibleFieldIds: ids.filter((id) => id !== field.id) })
        }
      }
    },
    [updateField, views, updateView]
  )

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

  const toggleOptions = useCallback((fieldId: string) => {
    setOpenFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    )
  }, [])

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t.fieldManager.title}
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title={t.fieldManager.addField}
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
              <div key={field.id}>
                <SortableFieldItem
                  field={field}
                  showOptions={openFieldIds.includes(field.id)}
                  onToggleOptions={() => toggleOptions(field.id)}
                  onToggleVisibility={() => toggleVisibility(field)}
                  onDelete={() => deleteField(field.id)}
                />
                {openFieldIds.includes(field.id) && (field.type === 'select' || field.type === 'multi_select') && (
                  <OptionEditor field={field} onUpdateOptions={updateFieldOptions} />
                )}
              </div>
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
            // 新しいフィールドを全ビューの visibleFieldIds に追加
            const newField = useTaskStore.getState().fields.at(-1)
            if (newField) {
              for (const view of useViewStore.getState().views) {
                if (!view.visibleFieldIds.includes(newField.id)) {
                  updateView(view.id, {
                    visibleFieldIds: [...view.visibleFieldIds, newField.id],
                  })
                }
              }
            }
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
  showOptions,
  onToggleOptions,
  onToggleVisibility,
  onDelete,
}: {
  field: FieldDefinition
  showOptions: boolean
  onToggleOptions: () => void
  onToggleVisibility: () => void
  onDelete: () => void
}) {
  const { t } = useI18n()
  const FIELD_TYPE_LABELS: Record<FieldType, string> = t.fieldTypes
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
        {translateFieldName(t, field.id, field.name)}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {FIELD_TYPE_LABELS[field.type]}
      </span>
      {(field.type === 'select' || field.type === 'multi_select') && (
        <button
          onClick={onToggleOptions}
          className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
          title={showOptions ? t.common.close : t.fieldManager.editOptions}
        >
          <SlidersHorizontal size={12} />
        </button>
      )}
      {/* 表示/非表示 */}
      <button
        onClick={onToggleVisibility}
        className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
        title={field.visible ? t.fieldManager.hide : t.fieldManager.show}
      >
        {field.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>
      {/* 削除（システムフィールド以外） */}
      {!field.isSystem && (
        <button
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
          title={t.fieldManager.deleteField}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function OptionEditor({
  field,
  onUpdateOptions,
}: {
  field: FieldDefinition
  onUpdateOptions: (fieldId: string, options: { id: string; label: string; color: string }[]) => void
}) {
  const { t } = useI18n()
  const [newLabel, setNewLabel] = useState('')
  const options = useMemo(() => field.options ?? [], [field.options])
  const optionIds = options.map((o) => o.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = optionIds.indexOf(String(active.id))
      const newIndex = optionIds.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return

      const next = [...options]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      onUpdateOptions(field.id, next)
    },
    [field.id, onUpdateOptions, optionIds, options]
  )

  const handleAdd = useCallback(() => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const next = [
      ...options,
      { id: generateId(), label: trimmed, color: '#94a3b8' },
    ]
    onUpdateOptions(field.id, next)
    setNewLabel('')
  }, [field.id, newLabel, onUpdateOptions, options])

  const handleDelete = useCallback(
    (optionId: string) => {
      if (!window.confirm(t.fieldManager.deleteOptionConfirm)) return
      onUpdateOptions(field.id, options.filter((o) => o.id !== optionId))
    },
    [field.id, onUpdateOptions, options, t]
  )

  return (
    <div className="ml-4 mt-1 rounded border border-border bg-background/50 p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
        {t.fieldManager.optionsLabel}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={optionIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {options.map((option) => (
              <SortableOptionItem
                key={option.id}
                option={option}
                allowColor={field.type === 'select'}
                onDelete={() => handleDelete(option.id)}
                onUpdate={(updates) => {
                  const next = options.map((o) =>
                    o.id === option.id ? { ...o, ...updates } : o
                  )
                  onUpdateOptions(field.id, next)
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder={
            field.type === 'multi_select'
              ? t.fieldManager.tagOptionPlaceholder
              : t.fieldManager.optionPlaceholder
          }
          className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleAdd}
          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          {t.common.add}
        </button>
      </div>
    </div>
  )
}

function SortableOptionItem({
  option,
  allowColor,
  onUpdate,
  onDelete,
}: {
  option: { id: string; label: string; color: string }
  allowColor: boolean
  onUpdate: (updates: { label?: string; color?: string }) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const safeColor = sanitizeColor(option.color ?? '#94a3b8')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded border border-border bg-background px-2 py-1 text-xs',
        isDragging && 'opacity-50'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={12} className="text-muted-foreground/40" />
      </div>
      <input
        key={`${option.id}-${option.label}`}
        defaultValue={option.label}
        className="flex-1 rounded border border-input bg-background px-2 py-0.5 text-xs outline-none focus:ring-2 focus:ring-ring"
        onBlur={(e) => {
          const trimmed = e.currentTarget.value.trim()
          if (!trimmed) {
            e.currentTarget.value = option.label
            return
          }
          if (trimmed !== option.label) {
            onUpdate({ label: trimmed })
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
      />
      {allowColor && (
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onUpdate({ color: sanitizeColor(e.target.value) })}
          className="h-5 w-6 border border-border rounded"
          aria-label="Option color"
        />
      )}
      <button
        onClick={onDelete}
        className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
        title="Delete option"
      >
        <Trash2 size={12} />
      </button>
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
  const { t } = useI18n()
  const FIELD_TYPE_LABELS: Record<FieldType, string> = t.fieldTypes

  return (
    <div className="mt-2 rounded border border-border bg-background p-2 space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.fieldManager.fieldNamePlaceholder}
        className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
        autoFocus
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as FieldType)}
        className="w-full rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-1">
        <button
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          {t.common.cancel}
        </button>
        <button
          onClick={() => {
            if (name.trim()) onAdd(name.trim(), type)
          }}
          disabled={!name.trim()}
          className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {t.common.add}
        </button>
      </div>
    </div>
  )
}
