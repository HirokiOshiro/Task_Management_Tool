/** サポートするフィールドタイプ */
export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'person'
  | 'checkbox'
  | 'url'
  | 'progress'

/** Selectフィールドの選択肢 */
export interface SelectOption {
  id: string
  label: string
  color: string
}

/** フィールド定義（カスタマイズ可能なカラム定義） */
export interface FieldDefinition {
  id: string
  name: string
  type: FieldType
  required: boolean
  order: number
  width?: number
  visible: boolean
  options?: SelectOption[]
  defaultValue?: unknown
  isSystem: boolean
}

/** デフォルトフィールドのID定数 */
export const SYSTEM_FIELD_IDS = {
  TITLE: 'title',
  STATUS: 'status',
  ASSIGNEE: 'assignee',
  DUE_DATE: 'due_date',
  PRIORITY: 'priority',
  DESCRIPTION: 'description',
  TAGS: 'tags',
  PROGRESS: 'progress',
  START_DATE: 'start_date',
  DEPENDENCIES: 'dependencies',
} as const

/** タスクのフィールド値 */
export type TaskFieldValues = Record<string, unknown>

/** タスクエンティティ */
export interface Task {
  id: string
  fieldValues: TaskFieldValues
  createdAt: string
  updatedAt: string
}

/** ファイルに保存する全体スキーマ */
export interface TaskDataSet {
  version: string
  fields: FieldDefinition[]
  tasks: Task[]
  viewConfigs: import('./view').ViewConfig[]
  metadata: {
    lastModified: string
    source: 'local' | 'sharepoint' | 'memory'
  }
}

/** ステータスの選択肢デフォルト */
export const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { id: 'not_started', label: '未着手', color: '#94a3b8' },
  { id: 'in_progress', label: '進行中', color: '#3b82f6' },
  { id: 'done', label: '完了', color: '#22c55e' },
  { id: 'on_hold', label: '保留', color: '#f59e0b' },
]

/** 優先度の選択肢デフォルト */
export const DEFAULT_PRIORITY_OPTIONS: SelectOption[] = [
  { id: 'high', label: '高', color: '#ef4444' },
  { id: 'medium', label: '中', color: '#f59e0b' },
  { id: 'low', label: '低', color: '#22c55e' },
]

/** デフォルトフィールド定義 */
export function createDefaultFields(): FieldDefinition[] {
  return [
    {
      id: SYSTEM_FIELD_IDS.TITLE,
      name: 'タイトル',
      type: 'text',
      required: true,
      order: 0,
      width: 300,
      visible: true,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.STATUS,
      name: 'ステータス',
      type: 'select',
      required: false,
      order: 1,
      width: 120,
      visible: true,
      options: DEFAULT_STATUS_OPTIONS,
      defaultValue: 'not_started',
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.ASSIGNEE,
      name: '担当者',
      type: 'person',
      required: false,
      order: 2,
      width: 120,
      visible: true,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.DUE_DATE,
      name: '期限',
      type: 'date',
      required: false,
      order: 3,
      width: 130,
      visible: true,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.PRIORITY,
      name: '優先度',
      type: 'select',
      required: false,
      order: 4,
      width: 100,
      visible: true,
      options: DEFAULT_PRIORITY_OPTIONS,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.DESCRIPTION,
      name: '説明',
      type: 'text',
      required: false,
      order: 5,
      width: 200,
      visible: false,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.TAGS,
      name: 'タグ',
      type: 'multi_select',
      required: false,
      order: 6,
      width: 150,
      visible: true,
      options: [],
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.PROGRESS,
      name: '進捗',
      type: 'progress',
      required: false,
      order: 7,
      width: 120,
      visible: false,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.START_DATE,
      name: '開始日',
      type: 'date',
      required: false,
      order: 8,
      width: 130,
      visible: false,
      isSystem: true,
    },
    {
      id: SYSTEM_FIELD_IDS.DEPENDENCIES,
      name: '依存関係',
      type: 'multi_select',
      required: false,
      order: 9,
      width: 150,
      visible: false,
      options: [],
      isSystem: true,
    },
  ]
}
