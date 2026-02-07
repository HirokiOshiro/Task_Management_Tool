import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { Task, FieldDefinition, TaskDataSet, TaskFieldValues } from '@/types/task'
import type { ViewConfig } from '@/types/view'
import { createDefaultFields } from '@/types/task'
import { generateId } from '@/lib/id'

interface TaskState {
  tasks: Task[]
  fields: FieldDefinition[]
  viewConfigs: ViewConfig[]
  isLoaded: boolean
  isDirty: boolean

  // タスクCRUD
  addTask: (fieldValues?: Partial<TaskFieldValues>) => Task
  updateTask: (taskId: string, fieldId: string, value: unknown) => void
  updateTaskFields: (taskId: string, values: Partial<TaskFieldValues>) => void
  deleteTask: (taskId: string) => void
  deleteTasks: (taskIds: string[]) => void

  // フィールドCRUD
  addField: (field: Omit<FieldDefinition, 'id' | 'order'>) => void
  updateField: (fieldId: string, updates: Partial<FieldDefinition>) => void
  deleteField: (fieldId: string) => void
  reorderFields: (fieldIds: string[]) => void

  // データセット操作
  loadDataSet: (dataSet: TaskDataSet) => void
  getDataSet: () => TaskDataSet
  markClean: () => void
  clearStorage: () => void
}

/** localStorageに保存済みデータがあるか確認 */
export function hasPersistedData(): boolean {
  try {
    const raw = localStorage.getItem('task-storage')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return parsed?.state?.tasks?.length > 0
  } catch {
    return false
  }
}

export const useTaskStore = create<TaskState>()(
  persist(
    immer((set, get) => ({
    tasks: [],
    fields: createDefaultFields(),
    viewConfigs: [],
    isLoaded: false,
    isDirty: false,

    addTask: (fieldValues) => {
      const now = new Date().toISOString()
      const newTask: Task = {
        id: generateId(),
        fieldValues: fieldValues ?? {},
        createdAt: now,
        updatedAt: now,
      }
      set((state) => {
        state.tasks.push(newTask)
        state.isDirty = true
      })
      return newTask
    },

    updateTask: (taskId, fieldId, value) => {
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId)
        if (task) {
          task.fieldValues[fieldId] = value
          task.updatedAt = new Date().toISOString()
          state.isDirty = true
        }
      })
    },

    updateTaskFields: (taskId, values) => {
      set((state) => {
        const task = state.tasks.find((t) => t.id === taskId)
        if (task) {
          Object.assign(task.fieldValues, values)
          task.updatedAt = new Date().toISOString()
          state.isDirty = true
        }
      })
    },

    deleteTask: (taskId) => {
      set((state) => {
        state.tasks = state.tasks.filter((t) => t.id !== taskId)
        state.isDirty = true
      })
    },

    deleteTasks: (taskIds) => {
      set((state) => {
        const idSet = new Set(taskIds)
        state.tasks = state.tasks.filter((t) => !idSet.has(t.id))
        state.isDirty = true
      })
    },

    addField: (field) => {
      set((state) => {
        const maxOrder = state.fields.reduce((max, f) => Math.max(max, f.order), -1)
        state.fields.push({
          ...field,
          id: generateId(),
          order: maxOrder + 1,
        })
        state.isDirty = true
      })
    },

    updateField: (fieldId, updates) => {
      set((state) => {
        const field = state.fields.find((f) => f.id === fieldId)
        if (field) {
          Object.assign(field, updates)
          state.isDirty = true
        }
      })
    },

    deleteField: (fieldId) => {
      set((state) => {
        const field = state.fields.find((f) => f.id === fieldId)
        if (field?.isSystem) return // システムフィールドは削除不可

        state.fields = state.fields.filter((f) => f.id !== fieldId)
        // 全タスクからフィールドの値を削除
        for (const task of state.tasks) {
          delete task.fieldValues[fieldId]
        }
        state.isDirty = true
      })
    },

    reorderFields: (fieldIds) => {
      set((state) => {
        for (let i = 0; i < fieldIds.length; i++) {
          const field = state.fields.find((f) => f.id === fieldIds[i])
          if (field) {
            field.order = i
          }
        }
        state.isDirty = true
      })
    },

    loadDataSet: (dataSet) => {
      set((state) => {
        state.tasks = dataSet.tasks
        state.fields = dataSet.fields
        state.viewConfigs = dataSet.viewConfigs
        state.isLoaded = true
        state.isDirty = false
      })
    },

    getDataSet: () => {
      const state = get()
      return {
        version: '1.0.0',
        fields: state.fields,
        tasks: state.tasks,
        viewConfigs: state.viewConfigs,
        metadata: {
          lastModified: new Date().toISOString(),
          source: 'memory' as const,
        },
      }
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false
      })
    },

    clearStorage: () => {
      localStorage.removeItem('task-storage')
    },
  })),
  {
    name: 'task-storage',
    partialize: (state) => ({
      tasks: state.tasks,
      fields: state.fields,
      viewConfigs: state.viewConfigs,
      isLoaded: state.isLoaded,
    }),
  }
  )
)
