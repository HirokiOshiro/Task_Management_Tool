import { useViewStore } from '@/stores/view-store'
import { useTaskStore } from '@/stores/task-store'
import type { FilterRule, FilterOperator } from '@/types/view'
import type { FieldDefinition } from '@/types/task'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { X, Plus, Filter, ListFilter, List } from 'lucide-react'
import { generateId } from '@/lib/id'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: '等しい',
  not_equals: '等しくない',
  contains: '含む',
  not_contains: '含まない',
  is_empty: '空',
  is_not_empty: '空でない',
  greater_than: 'より大きい',
  less_than: 'より小さい',
  before: 'より前',
  after: 'より後',
  in: 'いずれか',
  not_in: 'いずれでもない',
}

function getOperatorsForType(type: FieldDefinition['type']): FilterOperator[] {
  switch (type) {
    case 'text':
    case 'person':
    case 'url':
      return ['contains', 'not_contains', 'equals', 'not_equals', 'is_empty', 'is_not_empty']
    case 'number':
    case 'progress':
      return ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']
    case 'select':
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty']
    case 'multi_select':
      return ['in', 'not_in', 'is_empty', 'is_not_empty']
    case 'date':
      return ['equals', 'before', 'after', 'is_empty', 'is_not_empty']
    case 'checkbox':
      return ['equals']
    default:
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty']
  }
}

export function FilterBar() {
  const activeView = useViewStore((s) => s.getActiveView())
  const { setFilters } = useViewStore()
  const { fields } = useTaskStore()
  const [showAdd, setShowAdd] = useState(false)

  const filters = activeView.filters

  const addFilter = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return
    const operators = getOperatorsForType(field.type)
    const newFilter: FilterRule = {
      id: generateId(),
      fieldId,
      operator: operators[0],
      value: '',
    }
    setFilters([...filters, newFilter])
    setShowAdd(false)
  }

  const updateFilter = (filterId: string, updates: Partial<FilterRule>) => {
    setFilters(
      filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    )
  }

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId))
  }

  // 「完了以外」フィルターが現在設定されているか判定
  const hasHideDoneFilter = filters.some(
    (f) => f.fieldId === SYSTEM_FIELD_IDS.STATUS && f.operator === 'not_equals' && f.value === 'done'
  )

  const setHideDone = () => {
    // 既存のステータス系フィルタを除去して「完了以外」を設定
    const otherFilters = filters.filter(
      (f) => !(f.fieldId === SYSTEM_FIELD_IDS.STATUS && f.operator === 'not_equals' && f.value === 'done')
    )
    setFilters([
      ...otherFilters,
      { id: 'default-hide-done', fieldId: SYSTEM_FIELD_IDS.STATUS, operator: 'not_equals' as FilterOperator, value: 'done' },
    ])
  }

  const setShowAll = () => {
    // 「完了以外」フィルタのみ除去（他のフィルタは維持）
    setFilters(filters.filter(
      (f) => !(f.fieldId === SYSTEM_FIELD_IDS.STATUS && f.operator === 'not_equals' && f.value === 'done')
    ))
  }

  const quickFilterButtons = (
    <div className="flex items-center rounded-md border border-border bg-background text-xs">
      <button
        onClick={setHideDone}
        className={cn(
          'flex items-center gap-1 rounded-l-md px-2 py-1 transition-colors',
          hasHideDoneFilter
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        title="完了タスクを非表示"
      >
        <ListFilter size={13} />
        完了以外
      </button>
      <button
        onClick={setShowAll}
        className={cn(
          'flex items-center gap-1 rounded-r-md px-2 py-1 transition-colors border-l border-border',
          !hasHideDoneFilter
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        title="全タスクを表示"
      >
        <List size={13} />
        全て
      </button>
    </div>
  )

  if (filters.length === 0 && !showAdd) {
    return (
      <div className="flex items-center gap-2">
        {quickFilterButtons}
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Filter size={14} />
          フィルタ
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {quickFilterButtons}
      <Filter size={14} className="text-muted-foreground" />
      {filters.map((filter) => {
        const field = fields.find((f) => f.id === filter.fieldId)
        if (!field) return null
        const operators = getOperatorsForType(field.type)
        const needsValue = !['is_empty', 'is_not_empty'].includes(filter.operator)

        return (
          <div
            key={filter.id}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs"
          >
            {/* フィールド選択 */}
            <select
              value={filter.fieldId}
              onChange={(e) => updateFilter(filter.id, { fieldId: e.target.value })}
              className="bg-transparent outline-none text-xs"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            {/* 演算子 */}
            <select
              value={filter.operator}
              onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
              className="bg-transparent outline-none text-xs text-muted-foreground"
            >
              {operators.map((op) => (
                <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
              ))}
            </select>

            {/* 値 */}
            {needsValue && (
              field.type === 'select' ? (
                <select
                  value={String(filter.value ?? '')}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  className="bg-transparent outline-none text-xs max-w-[100px]"
                >
                  <option value="">-</option>
                  {field.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <select
                  value={String(filter.value ?? '')}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value === 'true' })}
                  className="bg-transparent outline-none text-xs"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  value={String(filter.value ?? '')}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  className="bg-transparent outline-none text-xs"
                />
              ) : (
                <input
                  type={field.type === 'number' || field.type === 'progress' ? 'number' : 'text'}
                  value={String(filter.value ?? '')}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  placeholder="値..."
                  className="bg-transparent outline-none text-xs w-20"
                />
              )
            )}

            {/* 削除 */}
            <button
              onClick={() => removeFilter(filter.id)}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}

      {/* フィルタ追加 */}
      {showAdd ? (
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs">
          <select
            onChange={(e) => {
              if (e.target.value) addFilter(e.target.value)
            }}
            className="bg-transparent outline-none text-xs"
            autoFocus
          >
            <option value="">フィールドを選択...</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdd(false)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}
