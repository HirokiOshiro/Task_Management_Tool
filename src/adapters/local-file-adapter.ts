import { fileOpen, fileSave } from 'browser-fs-access'
import type { DataAdapter, DataSourceConnection } from '@/types/adapter'
import type { TaskDataSet } from '@/types/task'
import { parseExcel } from '@/lib/excel/parser'
import { writeExcel } from '@/lib/excel/writer'

export class LocalFileAdapter implements DataAdapter {
  readonly type = 'local' as const
  private fileHandle: FileSystemFileHandle | null = null
  private fileName: string = ''
  private fileType: 'json' | 'xlsx' = 'json'
  private connected = false
  private savedAt: Date | null = null

  async connect(): Promise<DataSourceConnection> {
    const file = await fileOpen({
      description: 'タスクデータファイル',
      mimeTypes: [
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      extensions: ['.json', '.xlsx'],
    })

    this.fileName = file.name
    this.fileType = file.name.endsWith('.xlsx') ? 'xlsx' : 'json'
    // browser-fs-accessがFileSystemFileHandleを返す場合
    this.fileHandle = (file as unknown as { handle?: FileSystemFileHandle }).handle ?? null
    this.connected = true

    // ファイル内容を一時的に保持
    const buffer = await file.arrayBuffer()
    this._loadedBuffer = buffer

    return {
      type: 'local',
      name: file.name,
      fileHandle: this.fileHandle ?? undefined,
    }
  }

  private _loadedBuffer: ArrayBuffer | null = null

  async load(): Promise<TaskDataSet> {
    if (this._loadedBuffer) {
      const buffer = this._loadedBuffer
      this._loadedBuffer = null
      return this.parseBuffer(buffer)
    }

    // ファイルハンドルからの再読み込み
    if (this.fileHandle) {
      const file = await this.fileHandle.getFile()
      const buffer = await file.arrayBuffer()
      return this.parseBuffer(buffer)
    }

    throw new Error('ファイルが接続されていません')
  }

  private parseBuffer(buffer: ArrayBuffer): TaskDataSet {
    if (this.fileType === 'xlsx') {
      return parseExcel(buffer)
    }

    // JSON
    const text = new TextDecoder().decode(buffer)
    const data = JSON.parse(text)
    return data as TaskDataSet
  }

  async save(data: TaskDataSet): Promise<void> {
    let blob: Blob

    if (this.fileType === 'xlsx') {
      const excelData = writeExcel(data)
      blob = new Blob([excelData.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    } else {
      const json = JSON.stringify(data, null, 2)
      blob = new Blob([json], { type: 'application/json' })
    }

    await fileSave(blob, {
      fileName: this.fileName || (this.fileType === 'xlsx' ? 'tasks.xlsx' : 'tasks.json'),
      extensions: [this.fileType === 'xlsx' ? '.xlsx' : '.json'],
    }, this.fileHandle ?? undefined)

    this.savedAt = new Date()
  }

  isConnected(): boolean {
    return this.connected
  }

  disconnect(): void {
    this.connected = false
    this.fileHandle = null
    this.fileName = ''
    this._loadedBuffer = null
    this.savedAt = null
  }

  getLastSaved(): Date | null {
    return this.savedAt
  }
}
