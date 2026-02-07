import { useCallback, useState } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useToastStore } from '@/stores/toast-store'
import { LocalFileAdapter } from '@/adapters/local-file-adapter'
import { MemoryAdapter } from '@/adapters/memory-adapter'
import { writeExcel } from '@/lib/excel/writer'
import { FolderOpen, Database, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react'

export function DataSourceSelector() {
  const { loadDataSet, getDataSet, isDirty, markClean } = useTaskStore()
  const { setAdapter, setConnection, setStatus, setLastSaved, setError, status } =
    useConnectionStore()
  const addToast = useToastStore((s) => s.addToast)
  const [saving, setSaving] = useState(false)

  // ファイルを開く
  const handleOpenFile = useCallback(async () => {
    try {
      setStatus('connecting')
      const adapter = new LocalFileAdapter()
      const connection = await adapter.connect()
      const dataSet = await adapter.load()
      loadDataSet(dataSet)
      setAdapter(adapter)
      setConnection(connection)
      addToast(`${connection.name} を読み込みました`, 'success')
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // ユーザーがキャンセルした場合
        setStatus('disconnected')
        return
      }
      const msg = String((err as Error).message ?? 'ファイルの読み込みに失敗しました')
      setError(msg)
      addToast(msg, 'error')
    }
  }, [loadDataSet, setAdapter, setConnection, setStatus, setError])

  // JSONとして保存
  const handleSaveJson = useCallback(async () => {
    try {
      setSaving(true)
      setStatus('saving')
      const data = getDataSet()
      data.metadata.source = 'local'
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tasks.json'
      a.click()
      URL.revokeObjectURL(url)
      markClean()
      setLastSaved(new Date())
      setStatus('connected')
      addToast('JSONファイルを保存しました', 'success')
    } catch (err) {
      const msg = String((err as Error).message ?? '保存に失敗しました')
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }, [getDataSet, markClean, setLastSaved, setStatus, setError, addToast])

  // Excelとして保存
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
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tasks.xlsx'
      a.click()
      URL.revokeObjectURL(url)
      markClean()
      setLastSaved(new Date())
      setStatus('connected')
      addToast('Excelファイルを保存しました', 'success')
    } catch (err) {
      const msg = String((err as Error).message ?? '保存に失敗しました')
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }, [getDataSet, markClean, setLastSaved, setStatus, setError, addToast])

  // デモデータに戻す
  const handleLoadDemo = useCallback(async () => {
    const adapter = new MemoryAdapter()
    const dataSet = await adapter.load()
    loadDataSet(dataSet)
    setAdapter(adapter)
    setConnection({ type: 'memory', name: 'デモデータ' })
    addToast('デモデータを読み込みました', 'info')
  }, [loadDataSet, setAdapter, setConnection, addToast])

  return (
    <div className="p-3 space-y-1">
      <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        データ
      </div>

      {/* ファイルを開く */}
      <button
        onClick={handleOpenFile}
        disabled={status === 'connecting'}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50"
      >
        {status === 'connecting' ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
        ファイルを開く
      </button>

      {/* JSON保存 */}
      <button
        onClick={handleSaveJson}
        disabled={saving}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50"
      >
        <FileJson size={16} />
        JSONで保存
        {isDirty && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500" />}
      </button>

      {/* Excel保存 */}
      <button
        onClick={handleSaveExcel}
        disabled={saving}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50 disabled:opacity-50"
      >
        <FileSpreadsheet size={16} />
        Excelで保存
        {isDirty && <span className="ml-auto h-2 w-2 rounded-full bg-amber-500" />}
      </button>

      {/* デモデータ */}
      <button
        onClick={handleLoadDemo}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50"
      >
        <Database size={16} />
        デモデータ
      </button>
    </div>
  )
}
