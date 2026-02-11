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
import { useViewStore } from '@/stores/view-store'
import type { FieldDefinition, FieldType } from '@/types/task'
import { Eye, EyeOff, Trash2, Plus, GripVertical, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n, translateFieldName } from '@/i18n'
import { FieldOptionEditor } from '@/components/fields/FieldOptionEditor'

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
                  <div className="ml-6 mt-1">
                    <FieldOptionEditor field={field} onUpdateOptions={updateFieldOptions} />
                  </div>
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
        'group grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/50 text-sm',
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
      <span className={cn('truncate', !field.visible && 'text-muted-foreground/50')}>
        {translateFieldName(t, field.id, field.name)}
      </span>
      <div className="flex items-center justify-end gap-1">
        {(field.type === 'select' || field.type === 'multi_select') && (
          <button
            onClick={onToggleOptions}
            className="rounded p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
            title={showOptions ? t.common.close : t.fieldManager.editOptions}
          >
            <SlidersHorizontal size={12} />
          </button>
        )}
        <button
          onClick={onToggleVisibility}
          className="rounded p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
          title={field.visible ? t.fieldManager.hide : t.fieldManager.show}
        >
          {field.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        {!field.isSystem && (
          <button
            onClick={onDelete}
            className="rounded p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-destructive"
            title={t.fieldManager.deleteField}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
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
