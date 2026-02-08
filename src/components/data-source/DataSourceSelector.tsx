import { useCallback, useState } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useToastStore } from '@/stores/toast-store'
import { useI18n } from '@/i18n'
import { LocalFileAdapter } from '@/adapters/local-file-adapter'
import { MemoryAdapter } from '@/adapters/memory-adapter'
import { writeExcel } from '@/lib/excel/writer'
import { fileSave } from 'browser-fs-access'
import { FolderOpen, Database, FileSpreadsheet, FileJson, Loader2, Save } from 'lucide-react'

export function DataSourceSelector() {
  const { loadDataSet, getDataSet, isDirty, markClean } = useTaskStore()
  const { setAdapter, setConnection, setStatus, setLastSaved, setError, status } =
    useConnectionStore()
  const adapter = useConnectionStore((s) => s.adapter)
  const connection = useConnectionStore((s) => s.connection)
  const addToast = useToastStore((s) => s.addToast)
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)

  // ファイルが開かれているか（上書き保存可能か）
  const hasOpenFile = connection?.type === 'local' && adapter != null

  // ファイルを開く
  const handleOpenFile = useCallback(async () => {
    try {
      setStatus('connecting')
      const newAdapter = new LocalFileAdapter()
      const conn = await newAdapter.connect()
      const dataSet = await newAdapter.load()
      loadDataSet(dataSet)
      setAdapter(newAdapter)
      setConnection(conn)
      addToast(t.data.loadedFile(conn.name), 'success')
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // ユーザーがキャンセルした場合
        setStatus('disconnected')
        return
      }
      const msg = String((err as Error).message ?? t.data.loadFailed)
      setError(msg)
      addToast(msg, 'error')
    }
  }, [loadDataSet, setAdapter, setConnection, setStatus, setError])

  // 上書き保存（開いたファイルに保存）
  const handleSave = useCallback(async () => {
    if (!adapter) {
      addToast(t.data.noFileToSave, 'info')
      return
    }
    try {
      setSaving(true)
      setStatus('saving')
      const data = getDataSet()
      data.metadata.source = 'local'
      await adapter.save(data)
      markClean()
      setLastSaved(new Date())
      setStatus('connected')
      addToast(t.data.savedFile(connection?.name ?? ''), 'success')
    } catch (err) {
      const msg = String((err as Error).message ?? t.data.saveFailed)
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }, [adapter, connection, getDataSet, markClean, setLastSaved, setStatus, setError, addToast])

  // JSONとして保存（fileSave経由。初回はピッカー、以降は上書き）
  const handleSaveJson = useCallback(async () => {
    try {
      setSaving(true)
      setStatus('saving')
      const data = getDataSet()
      data.metadata.source = 'local'
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })

      // 同じ形式（.json）で開いている場合のみ上書き候補にする
      const existingHandle =
        hasOpenFile && connection?.name.endsWith('.json')
          ? connection.fileHandle ?? undefined
          : undefined

      const newHandle = await fileSave(
        blob,
        {
          fileName: existingHandle ? connection!.name : 'tasks.json',
          extensions: ['.json'],
          description: 'JSONファイル',
        },
        existingHandle,
      )

      // 新規保存で handle を取得できた場合、アダプタと接続を更新
      if (newHandle && newHandle !== existingHandle) {
        const name = (newHandle as unknown as { name?: string }).name ?? 'tasks.json'
        const newAdapter = LocalFileAdapter.fromHandle(newHandle, name, 'json')
        setAdapter(newAdapter)
        setConnection({ type: 'local', name, fileHandle: newHandle })
      }

      markClean()
      setLastSaved(new Date())
      setStatus('connected')
      addToast(t.data.savedJson, 'success')
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus(hasOpenFile ? 'connected' : 'disconnected')
        return
      }
      const msg = String((err as Error).message ?? t.data.saveFailed)
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }, [getDataSet, markClean, setLastSaved, setStatus, setError, addToast, hasOpenFile, connection, setAdapter, setConnection, t])

  // Excelとして保存（fileSave経由。初回はピッカー、以降は上書き）
  const handleSaveExcel = useCallback(async () => {
    try {
      setSaving(true)
      setStatus('saving')
      const data = getDataSet()
      data.metadata.source = 'local'
      const excelData = writeExcel(data)
      const blob = new Blob([excelData.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      // 同じ形式（.xlsx）で開いている場合のみ上書き候補にする
      const existingHandle =
        hasOpenFile && connection?.name.endsWith('.xlsx')
          ? connection.fileHandle ?? undefined
          : undefined

      const newHandle = await fileSave(
        blob,
        {
          fileName: existingHandle ? connection!.name : 'tasks.xlsx',
          extensions: ['.xlsx'],
          description: 'Excelファイル',
        },
        existingHandle,
      )

      // 新規保存で handle を取得できた場合、アダプタと接続を更新
      if (newHandle && newHandle !== existingHandle) {
        const name = (newHandle as unknown as { name?: string }).name ?? 'tasks.xlsx'
        const newAdapter = LocalFileAdapter.fromHandle(newHandle, name, 'xlsx')
        setAdapter(newAdapter)
        setConnection({ type: 'local', name, fileHandle: newHandle })
      }

      markClean()
      setLastSaved(new Date())
      setStatus('connected')
      addToast(t.data.savedExcel, 'success')
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus(hasOpenFile ? 'connected' : 'disconnected')
        return
      }
      const msg = String((err as Error).message ?? t.data.saveFailed)
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }, [getDataSet, markClean, setLastSaved, setStatus, setError, addToast, hasOpenFile, connection, setAdapter, setConnection, t])

  // デモデータに戻す
  const handleLoadDemo = useCallback(async () => {
    const demoAdapter = new MemoryAdapter()
    const dataSet = await demoAdapter.load()
    loadDataSet(dataSet)
    setAdapter(demoAdapter)
    setConnection({ type: 'memory', name: t.data.demoDataTitle })
    addToast(t.data.loadedDemo, 'info')
  }, [loadDataSet, setAdapter, setConnection, addToast])

  return (
    <div className="p-3 space-y-1">
      <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t.data.label}
      </div>

      {/* ファイルを開く */}
      <button
        onClick={handleOpenFile}
        disabled={status === 'connecting'}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50"
      >
        {status === 'connecting' ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
        {t.data.openFile}
      </button>

      {/* 上書き保存（ファイル接続中のみ表示） */}
      {hasOpenFile && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50 font-medium"
        >
          <Save size={16} />
          {t.data.save}
          {isDirty && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500" />}
        </button>
      )}

      {/* 区切り線（ファイル接続中のみ） */}
      {hasOpenFile && <div className="border-t border-border my-1" />}

      {/* JSON保存 */}
      <button
        onClick={handleSaveJson}
        disabled={saving}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50"
      >
        <FileJson size={16} />
        {hasOpenFile ? t.data.saveAsJson : t.data.saveJson}
        {!hasOpenFile && isDirty && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500" />}
      </button>

      {/* Excel保存 */}
      <button
        onClick={handleSaveExcel}
        disabled={saving}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50"
      >
        <FileSpreadsheet size={16} />
        {hasOpenFile ? t.data.saveAsExcel : t.data.saveExcel}
        {!hasOpenFile && isDirty && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500" />}
      </button>

      {/* デモデータ */}
      <button
        onClick={handleLoadDemo}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50"
      >
        <Database size={16} />
        {t.data.demoData}
      </button>
    </div>
  )
}
