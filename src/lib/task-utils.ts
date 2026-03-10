import type { Task, FieldDefinition } from '@/types/task'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import type { FilterRule } from '@/types/view'

/** フィルタを適用 */
export function applyFilters(
  tasks: Task[],
  filters: FilterRule[],
  fields: FieldDefinition[]
): Task[] {
  if (filters.length === 0) return tasks

  // 日付範囲重複フィルタとその他を分離
  const dateRangeFilters = filters.filter((f) => f.operator === 'date_range_overlaps')
  const normalFilters = filters.filter((f) => f.operator !== 'date_range_overlaps')

  return tasks.filter((task) => {
    // 通常フィルタ（AND結合）
    const normalPass = normalFilters.every((filter) => {
      const value = task.fieldValues[filter.fieldId]
      return evaluateFilter(value, filter, fields)
    })
    if (!normalPass) return false

    // 日付範囲重複フィルタ
    for (const filter of dateRangeFilters) {
      const range = filter.value as { start: string; end: string } | null
      if (!range) continue

      const taskStart = task.fieldValues[SYSTEM_FIELD_IDS.START_DATE] as string | undefined
      const taskEnd = task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE] as string | undefined

      // 開始日・期限の両方が未設定なら非表示
      if (!taskStart && !taskEnd) return false

      const rangeStart = new Date(range.start)
      const rangeEnd = new Date(range.end)

      // 片方のみの場合: その日付が範囲内にあるか
      if (taskStart && !taskEnd) {
        if (new Date(taskStart) > rangeEnd) return false
      } else if (!taskStart && taskEnd) {
        if (new Date(taskEnd) < rangeStart) return false
      } else {
        // 両方設定されている場合: 期間が重なるか
        // taskStart <= rangeEnd AND taskEnd >= rangeStart
        if (new Date(taskStart!) > rangeEnd || new Date(taskEnd!) < rangeStart) return false
      }
    }

    return true
  })
}

function evaluateFilter(
  value: unknown,
  filter: FilterRule,
  _fields: FieldDefinition[]
): boolean {
  const filterValue = filter.value

  switch (filter.operator) {
    case 'is_empty':
      return value == null || value === '' || (Array.isArray(value) && value.length === 0)
    case 'is_not_empty':
      return value != null && value !== '' && !(Array.isArray(value) && value.length === 0)
    case 'equals':
      return String(value) === String(filterValue)
    case 'not_equals':
      return String(value) !== String(filterValue)
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(filterValue ?? '').toLowerCase())
    case 'not_contains':
      return !String(value ?? '').toLowerCase().includes(String(filterValue ?? '').toLowerCase())
    case 'greater_than':
      return Number(value) > Number(filterValue)
    case 'less_than':
      return Number(value) < Number(filterValue)
    case 'before':
      if (!value || !filterValue) return false
      return new Date(String(value)) < new Date(String(filterValue))
    case 'after':
      if (!value || !filterValue) return false
      return new Date(String(value)) > new Date(String(filterValue))
    case 'in': {
      if (!Array.isArray(value)) return false
      const target = String(filterValue ?? '').split(',').map((s) => s.trim())
      return target.some((t) => (value as string[]).includes(t))
    }
    case 'not_in': {
      if (!Array.isArray(value)) return true
      const target = String(filterValue ?? '').split(',').map((s) => s.trim())
      return !target.some((t) => (value as string[]).includes(t))
    }
    default:
      return true
  }
}
