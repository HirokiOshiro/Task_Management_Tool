export type ViewType = 'table' | 'kanban' | 'gantt' | 'calendar'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  fieldId: string
  direction: SortDirection
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'before'
  | 'after'
  | 'in'
  | 'not_in'

export interface FilterRule {
  id: string
  fieldId: string
  operator: FilterOperator
  value: unknown
}

export interface GroupConfig {
  fieldId: string
  collapsed: Record<string, boolean>
}

export interface ViewConfig {
  id: string
  name: string
  type: ViewType
  sorts: SortConfig[]
  filters: FilterRule[]
  group?: GroupConfig
  visibleFieldIds: string[]
  kanbanGroupFieldId?: string
  ganttStartFieldId?: string
  ganttEndFieldId?: string
}
