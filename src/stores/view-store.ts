import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ViewType, ViewConfig, SortConfig, FilterRule, GroupConfig } from '@/types/view'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { generateId } from '@/lib/id'

interface ViewState {
  activeViewId: string
  views: ViewConfig[]

  setActiveView: (viewId: string) => void
  addView: (config: Omit<ViewConfig, 'id'>) => ViewConfig
  updateView: (viewId: string, updates: Partial<ViewConfig>) => void
  deleteView: (viewId: string) => void
  getActiveView: () => ViewConfig

  // ショートカット
  setActiveViewType: (type: ViewType) => void
  setSorts: (sorts: SortConfig[]) => void
  setFilters: (filters: FilterRule[]) => void
  setGroup: (group: GroupConfig | undefined) => void
}

/** デフォルトビュー生成 */
function createDefaultViews(): ViewConfig[] {
  return [
    {
      id: 'view-gantt',
      name: 'ガント',
      type: 'gantt',
      sorts: [],
      filters: [],
      visibleFieldIds: [
        SYSTEM_FIELD_IDS.TITLE,
        SYSTEM_FIELD_IDS.STATUS,
        SYSTEM_FIELD_IDS.ASSIGNEE,
        SYSTEM_FIELD_IDS.PROGRESS,
      ],
      ganttStartFieldId: SYSTEM_FIELD_IDS.START_DATE,
      ganttEndFieldId: SYSTEM_FIELD_IDS.DUE_DATE,
    },
    {
      id: 'view-table',
      name: 'テーブル',
      type: 'table',
      sorts: [],
      filters: [
        {
          id: 'default-hide-done',
          fieldId: SYSTEM_FIELD_IDS.STATUS,
          operator: 'not_equals' as const,
          value: 'done',
        },
      ],
      visibleFieldIds: [
        SYSTEM_FIELD_IDS.TITLE,
        SYSTEM_FIELD_IDS.STATUS,
        SYSTEM_FIELD_IDS.START_DATE,
        SYSTEM_FIELD_IDS.DUE_DATE,
        SYSTEM_FIELD_IDS.ASSIGNEE,
        SYSTEM_FIELD_IDS.TAGS,
      ],
    },
    {
      id: 'view-calendar',
      name: 'カレンダー',
      type: 'calendar',
      sorts: [],
      filters: [],
      visibleFieldIds: [
        SYSTEM_FIELD_IDS.TITLE,
        SYSTEM_FIELD_IDS.STATUS,
        SYSTEM_FIELD_IDS.DUE_DATE,
      ],
    },
    {
      id: 'view-kanban',
      name: 'カンバン',
      type: 'kanban',
      sorts: [],
      filters: [],
      visibleFieldIds: [
        SYSTEM_FIELD_IDS.TITLE,
        SYSTEM_FIELD_IDS.ASSIGNEE,
        SYSTEM_FIELD_IDS.DUE_DATE,
        SYSTEM_FIELD_IDS.PRIORITY,
      ],
      kanbanGroupFieldId: SYSTEM_FIELD_IDS.STATUS,
    },
  ]
}

export const useViewStore = create<ViewState>()(
  immer((set, get) => ({
    activeViewId: 'view-table',
    views: createDefaultViews(),

    setActiveView: (viewId) => {
      set((state) => {
        state.activeViewId = viewId
      })
    },

    addView: (config) => {
      const newView: ViewConfig = { ...config, id: generateId() }
      set((state) => {
        state.views.push(newView)
      })
      return newView
    },

    updateView: (viewId, updates) => {
      set((state) => {
        const view = state.views.find((v) => v.id === viewId)
        if (view) {
          Object.assign(view, updates)
        }
      })
    },

    deleteView: (viewId) => {
      set((state) => {
        if (state.views.length <= 1) return // 最低1つは残す
        state.views = state.views.filter((v) => v.id !== viewId)
        if (state.activeViewId === viewId) {
          state.activeViewId = state.views[0].id
        }
      })
    },

    getActiveView: () => {
      const state = get()
      return state.views.find((v) => v.id === state.activeViewId) ?? state.views[0]
    },

    setActiveViewType: (type) => {
      const state = get()
      const view = state.views.find((v) => v.type === type)
      if (view) {
        set((s) => {
          s.activeViewId = view.id
        })
      }
    },

    setSorts: (sorts) => {
      set((state) => {
        const view = state.views.find((v) => v.id === state.activeViewId)
        if (view) {
          view.sorts = sorts
        }
      })
    },

    setFilters: (filters) => {
      set((state) => {
        const view = state.views.find((v) => v.id === state.activeViewId)
        if (view) {
          view.filters = filters
        }
      })
    },

    setGroup: (group) => {
      set((state) => {
        const view = state.views.find((v) => v.id === state.activeViewId)
        if (view) {
          view.group = group
        }
      })
    },
  }))
)
