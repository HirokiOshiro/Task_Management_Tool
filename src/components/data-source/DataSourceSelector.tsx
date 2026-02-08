import { useCallback, useState } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useConnectionStore } from '@/stores/connection-store'
import { useToastStore } from '@/stores/toast-store'
import { useI18n } from '@/i18n'
import { LocalFileAdapter } from '@/adapters/local-file-adapter'
import { MemoryAdapter } from '@/adapters/memory-adapter'
import { writeExcel } from '@/lib/excel/writer'
import { parseImportFile } from '@/lib/excel/parser'
import { fileSave, fileOpen } from 'browser-fs-access'
import * as XLSX from 'xlsx'
import { FolderOpen, Database, FileSpreadsheet, FileJson, Loader2, Save, Upload, Download, X } from 'lucide-react'
import type { Task, FieldDefinition } from '@/types/task'

export function DataSourceSelector() {
  const { loadDataSet, getDataSet, isDirty, markClean, importTasks, fields } = useTaskStore()
  const { setAdapter, setConnection, setStatus, setLastSaved, setError, status } =
    useConnectionStore()
  const adapter = useConnectionStore((s) => s.adapter)
  const connection = useConnectionStore((s) => s.connection)
  const addToast = useToastStore((s) => s.addToast)
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)

  // インポートプレビュー用state
  const [importPreview, setImportPreview] = useState<{
    tasks: Task[]
    fields: FieldDefinition[]
  } | null>(null)
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append')

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

  // インポートファイルを選択→プレビュー表示
  const handleImportFile = useCallback(async () => {
    try {
      const file = await fileOpen({
        extensions: ['.xlsx', '.csv'],
        description: 'Excel / CSV',
        mimeTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ],
      })
      const buf = await file.arrayBuffer()
      const result = parseImportFile(buf, fields)
      if (result.tasks.length === 0) {
        addToast(t.data.importFailed, 'error')
        return
      }
      setImportPreview(result)
      setImportMode('append')
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      addToast(t.data.importFailed, 'error')
    }
  }, [fields, addToast, t])

  // インポート実行
  const handleImportConfirm = useCallback(() => {
    if (!importPreview) return
    importTasks(importPreview.tasks, importPreview.fields, importMode)
    addToast(t.data.importSuccess(importPreview.tasks.length), 'success')
    setImportPreview(null)
  }, [importPreview, importMode, importTasks, addToast, t])

  // テンプレートダウンロード
  const handleDownloadTemplate = useCallback(() => {
    const headers = fields.map((f) => f.name)
    const ws = XLSX.utils.aoa_to_sheet([headers])
    ws['!cols'] = fields.map((f) => ({ wch: Math.max((f.width ?? 150) / 8, f.name.length * 2 + 2) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: true })
    const blob = new Blob([out as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }, [fields])

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

      {/* 区切り線 */}
      <div className="border-t border-border my-1" />

      {/* インポート */}
      <button
        onClick={handleImportFile}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50"
      >
        <Upload size={16} />
        {t.data.importTasks}
      </button>

      {/* テンプレートダウンロード */}
      <button
        onClick={handleDownloadTemplate}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-accent/50"
      >
        <Download size={16} />
        {t.data.importTemplate}
      </button>
      <p className="px-2 text-[10px] text-muted-foreground">{t.data.supportedFormats}</p>

      {/* ── インポートプレビュー ダイアログ ── */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-popover text-popover-foreground rounded-lg shadow-xl w-full max-w-md mx-4 p-5 space-y-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{t.data.importPreview}</h3>
              <button
                onClick={() => setImportPreview(null)}
                className="p-1 rounded hover:bg-accent/50"
              >
                <X size={16} />
              </button>
            </div>

            {/* プレビュー情報 */}
            <p className="text-sm text-muted-foreground">
              {t.data.importPreviewInfo(importPreview.tasks.length, importPreview.fields.length)}
            </p>

            {/* 新規フィールドのリスト */}
            {importPreview.fields.length > 0 && (
              <div className="text-xs space-y-1 bg-accent/30 rounded p-2">
                <p className="font-medium text-muted-foreground">新しいフィールド:</p>
                {importPreview.fields.map((f) => (
                  <span
                    key={f.id}
                    className="inline-block mr-1 mb-1 px-1.5 py-0.5 bg-accent rounded text-xs"
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            )}

            {/* モード選択 */}
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode('append')}
                className={`flex-1 py-1.5 text-sm rounded border ${
                  importMode === 'append'
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:bg-accent/50'
                }`}
              >
                {t.data.importAppend}
              </button>
              <button
                onClick={() => setImportMode('replace')}
                className={`flex-1 py-1.5 text-sm rounded border ${
                  importMode === 'replace'
                    ? 'border-destructive bg-destructive/10 text-destructive font-medium'
                    : 'border-border hover:bg-accent/50'
                }`}
              >
                {t.data.importReplace}
              </button>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setImportPreview(null)}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-accent/50"
              >
                {t.data.importCancel}
              </button>
              <button
                onClick={handleImportConfirm}
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {t.data.importConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
