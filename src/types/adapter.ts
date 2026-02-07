import type { TaskDataSet } from './task'

/** データソースの種類 */
export type DataSourceType = 'local' | 'sharepoint' | 'memory'

/** データソース接続情報 */
export interface DataSourceConnection {
  type: DataSourceType
  name: string
  fileHandle?: FileSystemFileHandle
  driveId?: string
  itemId?: string
  siteUrl?: string
}

/** データアダプタのインターフェース */
export interface DataAdapter {
  readonly type: DataSourceType
  connect(connection?: DataSourceConnection): Promise<DataSourceConnection>
  load(): Promise<TaskDataSet>
  save(data: TaskDataSet): Promise<void>
  isConnected(): boolean
  disconnect(): void
  getLastSaved(): Date | null
}
