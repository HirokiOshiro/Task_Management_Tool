import type { Task, FieldDefinition } from '@/types/task'
import type { FilterRule } from '@/types/view'

/** フィルタを適用 */
export function applyFilters(
  tasks: Task[],
  filters: FilterRule[],
  fields: FieldDefinition[]
): Task[] {
  if (filters.length === 0) return tasks

  return tasks.filter((task) => {
    return filters.every((filter) => {
      const value = task.fieldValues[filter.fieldId]
      return evaluateFilter(value, filter, fields)
    })
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
