import { useViewStore } from '@/stores/view-store'
import { useTaskStore } from '@/stores/task-store'
import type { FilterRule, FilterOperator } from '@/types/view'
import type { FieldDefinition } from '@/types/task'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { X, Plus, Filter, ListFilter, List, CalendarDays } from 'lucide-react'
import { generateId } from '@/lib/id'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useI18n, translateFieldName, translateOptionLabel } from '@/i18n'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  addDays,
  format as formatDate,
} from 'date-fns'

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

// クイック日付フィルターのID接頭辞
const QUICK_DATE_PREFIX = 'quick-date-'

export function FilterBar() {
  const activeView = useViewStore((s) => s.getActiveView())
  const { setFilters } = useViewStore()
  const { fields } = useTaskStore()
  const [showAdd, setShowAdd] = useState(false)
  const { t } = useI18n()

  const OPERATOR_LABELS: Record<FilterOperator, string> = t.filter.operators

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

  // ── ステータスクイックフィルター ──
  const hasHideDoneFilter = filters.some(
    (f) => f.fieldId === SYSTEM_FIELD_IDS.STATUS && f.operator === 'not_equals' && f.value === 'done'
  )

  const setHideDone = () => {
    const otherFilters = filters.filter(
      (f) => !(f.fieldId === SYSTEM_FIELD_IDS.STATUS && f.operator === 'not_equals' && f.value === 'done')
    )
    setFilters([
      ...otherFilters,
      { id: 'default-hide-done', fieldId: SYSTEM_FIELD_IDS.STATUS, operator: 'not_equals' as FilterOperator, value: 'done' },
    ])
  }

  const setShowAll = () => {
    setFilters(filters.filter(
      (f) => !(f.fieldId === SYSTEM_FIELD_IDS.STATUS && f.operator === 'not_equals' && f.value === 'done')
    ))
  }

  // ── 日付クイックフィルター ──
  // 現在アクティブな日付フィルターのrangeIdを取得
  const activeDateRange = (() => {
    const dateFilter = filters.find((f) => f.id.startsWith(QUICK_DATE_PREFIX))
    if (!dateFilter) return null
    // 'quick-date-this-week-start' → 'this-week'
    const id = dateFilter.id.replace(QUICK_DATE_PREFIX, '')
    return id.replace(/-start$/, '').replace(/-end$/, '')
  })()

  const setDateRangeFilter = (rangeId: string, afterDate: Date, beforeDate: Date) => {
    // 同じフィルターのトグル（再クリックでクリア）
    if (activeDateRange === rangeId) {
      clearDateRangeFilters()
      return
    }

    // 既存の日付範囲フィルターを除去し、他のフィルターは維持
    const otherFilters = filters.filter((f) => !f.id.startsWith(QUICK_DATE_PREFIX))

    // after は > (exclusive) なので1日前、before は < (exclusive) なので1日後を指定
    setFilters([
      ...otherFilters,
      {
        id: `${QUICK_DATE_PREFIX}${rangeId}-start`,
        fieldId: SYSTEM_FIELD_IDS.DUE_DATE,
        operator: 'after' as FilterOperator,
        value: formatDate(addDays(afterDate, -1), 'yyyy-MM-dd'),
      },
      {
        id: `${QUICK_DATE_PREFIX}${rangeId}-end`,
        fieldId: SYSTEM_FIELD_IDS.DUE_DATE,
        operator: 'before' as FilterOperator,
        value: formatDate(addDays(beforeDate, 1), 'yyyy-MM-dd'),
      },
    ])
  }

  const clearDateRangeFilters = () => {
    setFilters(filters.filter((f) => !f.id.startsWith(QUICK_DATE_PREFIX)))
  }

  const setThisWeek = () => {
    const today = new Date()
    setDateRangeFilter('this-week', startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }))
  }

  const setThisMonth = () => {
    const today = new Date()
    setDateRangeFilter('this-month', startOfMonth(today), endOfMonth(today))
  }

  const setNextTwoMonths = () => {
    const today = new Date()
    setDateRangeFilter('next-2-months', today, addMonths(today, 2))
  }

  // ── クイックフィルターボタン群 ──
  const quickFilterButtons = (
    <div className="flex items-center gap-2">
      {/* ステータスフィルター */}
      <div className="flex items-center rounded-md border border-border bg-background text-xs">
        <button
          onClick={setHideDone}
          className={cn(
            'flex items-center gap-1 rounded-l-md px-2 py-1 transition-colors',
            hasHideDoneFilter
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          title={t.filter.hideDoneTitle}
        >
          <ListFilter size={13} />
          {t.filter.excludeDone}
        </button>
        <button
          onClick={setShowAll}
          className={cn(
            'flex items-center gap-1 rounded-r-md px-2 py-1 transition-colors border-l border-border',
            !hasHideDoneFilter
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          title={t.filter.showAllTitle}
        >
          <List size={13} />
          {t.filter.showAll}
        </button>
      </div>

      {/* 日付範囲フィルター */}
      <div className="flex items-center rounded-md border border-border bg-background text-xs">
        <span className="flex items-center px-2 text-muted-foreground">
          <CalendarDays size={13} />
        </span>
        <button
          onClick={setThisWeek}
          className={cn(
            'px-2 py-1 transition-colors',
            activeDateRange === 'this-week'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {t.filter.thisWeek}
        </button>
        <button
          onClick={setThisMonth}
          className={cn(
            'px-2 py-1 transition-colors border-l border-border',
            activeDateRange === 'this-month'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {t.filter.thisMonth}
        </button>
        <button
          onClick={setNextTwoMonths}
          className={cn(
            'px-2 py-1 transition-colors border-l border-border',
            activeDateRange === 'next-2-months'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          {t.filter.nextTwoMonths}
        </button>
        {activeDateRange && (
          <button
            onClick={clearDateRangeFilters}
            className="px-1.5 py-1 transition-colors border-l border-border text-muted-foreground hover:text-destructive rounded-r-md"
            title={t.filter.clearDateFilter}
          >
            <X size={13} />
          </button>
        )}
      </div>
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
          {t.filter.filter}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {quickFilterButtons}
      <Filter size={14} className="text-muted-foreground" />
      {filters.map((filter) => {
        // クイック日付フィルターはボタンで表示済みなので非表示
        if (filter.id.startsWith(QUICK_DATE_PREFIX)) return null
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
                <option key={f.id} value={f.id}>{translateFieldName(t, f.id, f.name)}</option>
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
                    <option key={opt.id} value={opt.id}>{translateOptionLabel(t, field.id, opt.id, opt.label)}</option>
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
                  placeholder={t.filter.valuePlaceholder}
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
            <option value="">{t.filter.selectField}</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>{translateFieldName(t, f.id, f.name)}</option>
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
