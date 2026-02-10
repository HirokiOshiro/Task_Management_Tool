import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { Task, FieldDefinition, TaskDataSet, TaskFieldValues } from '@/types/task'
import type { ViewConfig } from '@/types/view'
import { createDefaultFields } from '@/types/task'
import { generateId } from '@/lib/id'

/** 後方互換性: person フィールドの値を string から string[] に変換 */
function migratePersonFields(tasks: Task[], fields: FieldDefinition[]): Task[] {
  const personFieldIds = fields.filter(f => f.type === 'person').map(f => f.id)
  if (personFieldIds.length === 0) return tasks
  return tasks.map(task => {
    let changed = false
    const values = { ...task.fieldValues }
    for (const id of personFieldIds) {
      if (typeof values[id] === 'string') {
        values[id] = [values[id]]
        changed = true
      }
    }
    return changed ? { ...task, fieldValues: values } : task
  })
}

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

  // インポート
  importTasks: (tasks: Task[], fields: FieldDefinition[], mode: 'append' | 'replace') => void

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

    importTasks: (newTasks, newFields, mode) => {
      set((state) => {
        // ID を再生成して重複を防ぐ
        const remapped = newTasks.map((t) => ({
          ...t,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))

        if (mode === 'replace') {
          state.tasks = remapped
        } else {
          state.tasks.push(...remapped)
        }

        // 新しいフィールド定義をマージ（既存にないものだけ追加）
        const existingIds = new Set(state.fields.map((f) => f.id))
        const existingNames = new Set(state.fields.map((f) => f.name))
        let maxOrder = state.fields.reduce((m, f) => Math.max(m, f.order), -1)
        for (const nf of newFields) {
          if (!existingIds.has(nf.id) && !existingNames.has(nf.name)) {
            maxOrder++
            state.fields.push({ ...nf, order: maxOrder })
          }
        }

        state.isDirty = true
      })
    },

    loadDataSet: (dataSet) => {
      set((state) => {
        state.tasks = migratePersonFields(dataSet.tasks, dataSet.fields)
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
    onRehydrateStorage: () => (state) => {
      if (state) {
        let tasks = state.tasks
        let fields = state.fields

        // 1. person フィールドのマイグレーション (string → string[])
        if (tasks.length > 0) {
          const migrated = migratePersonFields(tasks, fields)
          if (migrated !== tasks) tasks = migrated
        }

        // 2. 不足しているシステムフィールドを追加 (例: URL)
        const defaultFields = createDefaultFields()
        const existingIds = new Set(fields.map(f => f.id))
        const missingFields = defaultFields.filter(
          df => df.isSystem && !existingIds.has(df.id)
        )

        // 3. 既存システムフィールドのオプションをマージ (例: category)
        let optionsUpdated = false
        const updatedFields = fields.map(f => {
          if (!f.isSystem) return f
          const defaultField = defaultFields.find(df => df.id === f.id)
          if (defaultField?.options && (!f.options || f.options.length === 0)) {
            optionsUpdated = true
            return { ...f, options: defaultField.options }
          }
          return f
        })

        // 4. システムフィールドの order をデフォルトに同期
        const defaultOrderMap = new Map(defaultFields.map(df => [df.id, df.order]))
        let orderUpdated = false
        const reorderedFields = updatedFields.map(f => {
          if (!f.isSystem) return f
          const defaultOrder = defaultOrderMap.get(f.id)
          if (defaultOrder !== undefined && f.order !== defaultOrder) {
            orderUpdated = true
            return { ...f, order: defaultOrder }
          }
          return f
        })

        const hasChanges =
          tasks !== state.tasks ||
          missingFields.length > 0 ||
          optionsUpdated ||
          orderUpdated

        if (hasChanges) {
          useTaskStore.setState({
            tasks,
            fields: [...reorderedFields, ...missingFields],
          })
        }
      }
    },
  }
  )
)
