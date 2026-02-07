import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import type { FieldDefinition } from '@/types/task'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { X, Trash2, StickyNote } from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useI18n, translateFieldName, translateOptionLabel } from '@/i18n'

export function TaskDetailPanel() {
  const { detailPanelOpen, selectedTaskId } = useUIStore()
  const { tasks, fields } = useTaskStore()

  const task = tasks.find((t) => t.id === selectedTaskId)

  // 開始日を期限の直前に配置する
  const sortedFields = useMemo(() => {
    const base = [...fields].sort((a, b) => a.order - b.order)
    const startIdx = base.findIndex((f) => f.id === SYSTEM_FIELD_IDS.START_DATE)
    const dueIdx = base.findIndex((f) => f.id === SYSTEM_FIELD_IDS.DUE_DATE)
    if (startIdx !== -1 && dueIdx !== -1 && startIdx > dueIdx) {
      const [startField] = base.splice(startIdx, 1)
      const newDueIdx = base.findIndex((f) => f.id === SYSTEM_FIELD_IDS.DUE_DATE)
      base.splice(newDueIdx, 0, startField)
    }
    return base
  }, [fields])

  if (!detailPanelOpen || !task) return null

  return <TaskDetailContent task={task} sortedFields={sortedFields} />
}

function TaskDetailContent({ task, sortedFields }: { task: ReturnType<typeof useTaskStore.getState>['tasks'][number]; sortedFields: ReturnType<typeof useTaskStore.getState>['fields'] }) {
  const { closeDetailPanel } = useUIStore()
  const { updateTask, deleteTask } = useTaskStore()
  const { t, lang } = useI18n()

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={closeDetailPanel}
      />
      {/* パネル */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl animate-in slide-in-from-right duration-200">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{t.taskDetail.title}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                deleteTask(task.id)
                closeDetailPanel()
              }}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title={t.taskDetail.deleteTask}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={closeDetailPanel}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent"
              title={t.common.close}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* フィールド一覧 + メモ */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {sortedFields
              .filter((f) => f.id !== SYSTEM_FIELD_IDS.NOTES)
              .map((field) => (
              <DetailField
                key={field.id}
                taskId={task.id}
                field={field}
                value={task.fieldValues[field.id]}
                onUpdate={updateTask}
              />
            ))}
          </div>

          {/* メモセクション */}
          <MemoSection
            taskId={task.id}
            value={task.fieldValues[SYSTEM_FIELD_IDS.NOTES] as string | undefined}
            onUpdate={updateTask}
          />
        </div>

        {/* フッター */}
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {t.taskDetail.created} {new Date(task.createdAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}
          {' / '}
          {t.taskDetail.updated} {new Date(task.updatedAt).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}
        </div>
      </div>
    </>
  )
}

/** 1フィールドの表示/編集 */
function DetailField({
  taskId,
  field,
  value,
  onUpdate,
}: {
  taskId: string
  field: FieldDefinition
  value: unknown
  onUpdate: (taskId: string, fieldId: string, value: unknown) => void
}) {
  const [editing, setEditing] = useState(false)
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
      <label className="text-xs font-medium text-muted-foreground pt-1.5">
        {translateFieldName(t, field.id, field.name)}
      </label>
      <div>
        {editing ? (
          <DetailEditor
            field={field}
            value={value}
            onSave={(v) => {
              onUpdate(taskId, field.id, v)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div
            className={cn(
              'min-h-[32px] cursor-pointer rounded px-2 py-1 hover:bg-accent/50 transition-colors flex items-center',
              field.type === 'checkbox' && 'cursor-default'
            )}
            onClick={() => {
              if (field.type === 'checkbox') {
                onUpdate(taskId, field.id, !value)
              } else {
                setEditing(true)
              }
            }}
          >
            <DetailValue value={value} field={field} />
          </div>
        )}
      </div>
    </div>
  )
}

/** 詳細パネルの値表示 */
function DetailValue({ value, field }: { value: unknown; field: FieldDefinition }) {
  const { t } = useI18n()
  if (value == null || value === '') {
    return <span className="text-muted-foreground/40 text-sm">{t.taskDetail.empty}</span>
  }

  switch (field.type) {
    case 'select': {
      const option = field.options?.find((o) => o.id === value)
      if (!option) return <span className="text-sm">{String(value)}</span>
      return (
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: option.color + '20', color: option.color }}
        >
          {translateOptionLabel(t, field.id, option.id, option.label)}
        </span>
      )
    }
    case 'multi_select': {
      const values = Array.isArray(value) ? value : []
      if (values.length === 0) return <span className="text-muted-foreground/40 text-sm">{t.taskDetail.empty}</span>
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v: string) => (
            <span key={v} className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs">
              {v}
            </span>
          ))}
        </div>
      )
    }
    case 'checkbox':
      return <input type="checkbox" checked={Boolean(value)} readOnly className="h-4 w-4 accent-primary" />
    case 'progress': {
      const num = Number(value) || 0
      return (
        <div className="flex items-center gap-2 w-full">
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${num}%` }} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{num}%</span>
        </div>
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

/** 詳細パネルのエディタ */
function DetailEditor({
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
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel()
  }

  switch (field.type) {
    case 'text':
    case 'person':
    case 'url':
      return field.id === 'description' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          defaultValue={value != null ? String(value) : ''}
          rows={4}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
          onBlur={(e) => onSave(e.target.value || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          defaultValue={value != null ? String(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(e.target.value || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value || undefined)
            handleKeyDown(e)
          }}
        />
      )
    case 'number':
    case 'progress':
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          min={field.type === 'progress' ? 0 : undefined}
          max={field.type === 'progress' ? 100 : undefined}
          defaultValue={value != null ? Number(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => {
            const v = Number(e.target.value)
            onSave(isNaN(v) ? undefined : field.type === 'progress' ? Math.min(100, Math.max(0, v)) : v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = Number((e.target as HTMLInputElement).value)
              onSave(isNaN(v) ? undefined : field.type === 'progress' ? Math.min(100, Math.max(0, v)) : v)
            }
            handleKeyDown(e)
          }}
        />
      )
    case 'date':
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          defaultValue={value != null ? String(value) : ''}
          className="rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => onSave(e.target.value || undefined)}
          onKeyDown={handleKeyDown}
        />
      )
    case 'select':
      return (
        <select
          defaultValue={value != null ? String(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
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
    case 'multi_select':
      return <DetailMultiSelectEditor field={field} value={value} onSave={onSave} onCancel={onCancel} />
    default:
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          defaultValue={value != null ? String(value) : ''}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          onBlur={(e) => onSave(e.target.value || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value || undefined)
            handleKeyDown(e)
          }}
        />
      )
  }
}

function DetailMultiSelectEditor({
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
  const current = Array.isArray(value) ? (value as string[]) : []
  const [selected, setSelected] = useState<string[]>(current)
  const [inputValue, setInputValue] = useState('')
  const { t } = useI18n()

  const toggle = (v: string) => {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }

  return (
    <div className="rounded border border-input bg-background p-2">
      <div className="flex flex-wrap gap-1 mb-2">
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
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && inputValue.trim()) {
            setSelected((prev) => [...prev, inputValue.trim()])
            setInputValue('')
          } else if (e.key === 'Enter') {
            onSave(selected.length > 0 ? selected : undefined)
          }
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={() => onSave(selected.length > 0 ? selected : undefined)}
        placeholder={t.taskDetail.tagsPlaceholder}
        className="w-full text-sm outline-none bg-transparent"
        autoFocus
      />
      {(field.options ?? []).length > 0 && (
        <div className="mt-1 border-t border-border pt-1 max-h-24 overflow-y-auto">
          {(field.options ?? [])
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

/** メモセクション */
function MemoSection({
  taskId,
  value,
  onUpdate,
}: {
  taskId: string
  value: string | undefined
  onUpdate: (taskId: string, fieldId: string, value: unknown) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { t } = useI18n()

  // value が外部から変わったら draft をリセット
  useEffect(() => {
    if (!editing) {
      setDraft(value ?? '')
    }
  }, [value, editing])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      // カーソルを末尾に
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  const save = () => {
    const trimmed = draft.trim()
    onUpdate(taskId, SYSTEM_FIELD_IDS.NOTES, trimmed || undefined)
    setEditing(false)
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote size={14} className="text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">{t.taskDetail.memoLabel}</span>
      </div>
      {editing ? (
        <div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder={t.taskDetail.memoPlaceholder}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(value ?? '')
                setEditing(false)
              }
            }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setDraft(value ?? '')
                setEditing(false)
              }}
              className="rounded px-3 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={save}
              className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="min-h-[60px] cursor-pointer rounded border border-transparent px-3 py-2 text-sm hover:border-border hover:bg-accent/30 transition-colors whitespace-pre-wrap"
          onClick={() => setEditing(true)}
        >
          {value ? (
            <span className="text-foreground">{value}</span>
          ) : (
            <span className="text-muted-foreground/40">{t.taskDetail.memoClickToAdd}</span>
          )}
        </div>
      )}
    </div>
  )
}
