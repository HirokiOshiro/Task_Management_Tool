import { useMemo } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useViewStore } from '@/stores/view-store'
import { applyFilters } from '@/lib/task-utils'
import type { Task, FieldDefinition } from '@/types/task'

/**
 * アクティブビューのフィルタを適用したタスク一覧を返すフック。
 * ソートは各ビューで個別に行うため、ここではフィルタのみ。
 */
export function useFilteredTasks(): {
  filteredTasks: Task[]
  fields: FieldDefinition[]
} {
  const tasks = useTaskStore((s) => s.tasks)
  const fields = useTaskStore((s) => s.fields)
  const activeView = useViewStore((s) => s.getActiveView())

  const filteredTasks = useMemo(
    () => applyFilters(tasks, activeView.filters, fields),
    [tasks, activeView.filters, fields]
  )

  return { filteredTasks, fields }
}
