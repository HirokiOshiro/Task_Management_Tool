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
import type { FieldDefinition } from '@/types/task'
import { GripVertical, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n'
import { generateId } from '@/lib/id'
import { sanitizeColor } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

type Option = { id: string; label: string; color: string }

export function FieldOptionEditor({
  field,
  onUpdateOptions,
  showTitle = true,
}: {
  field: FieldDefinition
  onUpdateOptions: (fieldId: string, options: Option[]) => void
  showTitle?: boolean
}) {
  const { t } = useI18n()
  const [newLabel, setNewLabel] = useState('')
  const options = useMemo(() => field.options ?? [], [field.options])
  const optionIds = options.map((o) => o.id)
  const allowColor = field.type === 'select'

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
    <div className="rounded border border-border bg-background/50 p-2">
      {showTitle && (
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          {t.fieldManager.optionsLabel}
        </div>
      )}
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
                allowColor={allowColor}
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
  option: Option
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
