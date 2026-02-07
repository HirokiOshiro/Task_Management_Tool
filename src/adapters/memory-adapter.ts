import type { DataAdapter, DataSourceConnection } from '@/types/adapter'
import type { TaskDataSet } from '@/types/task'
import { createDefaultFields, SYSTEM_FIELD_IDS } from '@/types/task'
import { generateId } from '@/lib/id'

/** デモ用タスクデータを生成 */
function createDemoTasks() {
  const now = new Date()
  const tasks = [
    {
      id: generateId(),
      fieldValues: {
        [SYSTEM_FIELD_IDS.TITLE]: 'プロジェクト計画書の作成',
        [SYSTEM_FIELD_IDS.STATUS]: 'in_progress',
        [SYSTEM_FIELD_IDS.ASSIGNEE]: '田中太郎',
        [SYSTEM_FIELD_IDS.DUE_DATE]: new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0],
        [SYSTEM_FIELD_IDS.PRIORITY]: 'high',
        [SYSTEM_FIELD_IDS.DESCRIPTION]: 'Q2のプロジェクト計画書を作成する',
        [SYSTEM_FIELD_IDS.TAGS]: ['計画', 'ドキュメント'],
        [SYSTEM_FIELD_IDS.PROGRESS]: 60,
        [SYSTEM_FIELD_IDS.START_DATE]: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      fieldValues: {
        [SYSTEM_FIELD_IDS.TITLE]: 'UIデザインレビュー',
        [SYSTEM_FIELD_IDS.STATUS]: 'not_started',
        [SYSTEM_FIELD_IDS.ASSIGNEE]: '鈴木花子',
        [SYSTEM_FIELD_IDS.DUE_DATE]: new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0],
        [SYSTEM_FIELD_IDS.PRIORITY]: 'medium',
        [SYSTEM_FIELD_IDS.DESCRIPTION]: '新規画面のデザインをレビューする',
        [SYSTEM_FIELD_IDS.TAGS]: ['デザイン', 'レビュー'],
        [SYSTEM_FIELD_IDS.PROGRESS]: 0,
        [SYSTEM_FIELD_IDS.START_DATE]: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      fieldValues: {
        [SYSTEM_FIELD_IDS.TITLE]: 'バグ修正 #1234',
        [SYSTEM_FIELD_IDS.STATUS]: 'done',
        [SYSTEM_FIELD_IDS.ASSIGNEE]: '山田次郎',
        [SYSTEM_FIELD_IDS.DUE_DATE]: new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0],
        [SYSTEM_FIELD_IDS.PRIORITY]: 'high',
        [SYSTEM_FIELD_IDS.DESCRIPTION]: 'ログイン画面でのエラーを修正',
        [SYSTEM_FIELD_IDS.TAGS]: ['バグ'],
        [SYSTEM_FIELD_IDS.PROGRESS]: 100,
        [SYSTEM_FIELD_IDS.START_DATE]: new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      fieldValues: {
        [SYSTEM_FIELD_IDS.TITLE]: 'ユーザーテスト実施',
        [SYSTEM_FIELD_IDS.STATUS]: 'on_hold',
        [SYSTEM_FIELD_IDS.ASSIGNEE]: '佐藤美咲',
        [SYSTEM_FIELD_IDS.DUE_DATE]: new Date(now.getTime() + 10 * 86400000).toISOString().split('T')[0],
        [SYSTEM_FIELD_IDS.PRIORITY]: 'medium',
        [SYSTEM_FIELD_IDS.DESCRIPTION]: 'リリース前のユーザーテストを実施する',
        [SYSTEM_FIELD_IDS.TAGS]: ['テスト', 'UX'],
        [SYSTEM_FIELD_IDS.PROGRESS]: 20,
        [SYSTEM_FIELD_IDS.START_DATE]: new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      fieldValues: {
        [SYSTEM_FIELD_IDS.TITLE]: 'API仕様書の更新',
        [SYSTEM_FIELD_IDS.STATUS]: 'not_started',
        [SYSTEM_FIELD_IDS.ASSIGNEE]: '田中太郎',
        [SYSTEM_FIELD_IDS.DUE_DATE]: new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0],
        [SYSTEM_FIELD_IDS.PRIORITY]: 'low',
        [SYSTEM_FIELD_IDS.DESCRIPTION]: 'REST APIの仕様書を最新の状態に更新する',
        [SYSTEM_FIELD_IDS.TAGS]: ['ドキュメント', 'API'],
        [SYSTEM_FIELD_IDS.PROGRESS]: 0,
        [SYSTEM_FIELD_IDS.START_DATE]: new Date(now.getTime() + 4 * 86400000).toISOString().split('T')[0],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      fieldValues: {
        [SYSTEM_FIELD_IDS.TITLE]: 'パフォーマンス改善',
        [SYSTEM_FIELD_IDS.STATUS]: 'in_progress',
        [SYSTEM_FIELD_IDS.ASSIGNEE]: '山田次郎',
        [SYSTEM_FIELD_IDS.DUE_DATE]: new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0],
        [SYSTEM_FIELD_IDS.PRIORITY]: 'high',
        [SYSTEM_FIELD_IDS.DESCRIPTION]: 'ダッシュボード画面のレンダリング速度を改善',
        [SYSTEM_FIELD_IDS.TAGS]: ['パフォーマンス'],
        [SYSTEM_FIELD_IDS.PROGRESS]: 30,
        [SYSTEM_FIELD_IDS.START_DATE]: new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0],
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]
  return tasks
}

export class MemoryAdapter implements DataAdapter {
  readonly type = 'memory' as const
  private data: TaskDataSet | null = null
  private connected = false
  private savedAt: Date | null = null

  async connect(): Promise<DataSourceConnection> {
    this.data = {
      version: '1.0.0',
      fields: createDefaultFields(),
      tasks: createDemoTasks(),
      viewConfigs: [],
      metadata: {
        lastModified: new Date().toISOString(),
        source: 'memory',
      },
    }
    this.connected = true
    return { type: 'memory', name: 'デモデータ' }
  }

  async load(): Promise<TaskDataSet> {
    if (!this.data) {
      await this.connect()
    }
    return this.data!
  }

  async save(data: TaskDataSet): Promise<void> {
    this.data = data
    this.savedAt = new Date()
  }

  isConnected(): boolean {
    return this.connected
  }

  disconnect(): void {
    this.connected = false
    this.data = null
    this.savedAt = null
  }

  getLastSaved(): Date | null {
    return this.savedAt
  }
}
