import { useConnectionStore } from '@/stores/connection-store'
import { useTaskStore } from '@/stores/task-store'
import { Cloud, CloudOff, HardDrive, Loader2 } from 'lucide-react'

export function StatusBar() {
  const { status, connection, lastSaved } = useConnectionStore()
  const { isDirty, tasks } = useTaskStore()

  const formatTime = (date: Date | null) => {
    if (!date) return null
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <footer className="flex h-7 items-center justify-between border-t border-border bg-background px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        {/* 接続状態 */}
        <div className="flex items-center gap-1">
          {status === 'connected' && <Cloud size={12} className="text-green-500" />}
          {status === 'saving' && <Loader2 size={12} className="animate-spin" />}
          {status === 'disconnected' && <CloudOff size={12} />}
          {status === 'error' && <CloudOff size={12} className="text-destructive" />}
          {status === 'connecting' && <Loader2 size={12} className="animate-spin" />}
          <span>{connection?.name ?? 'メモリ（デモ）'}</span>
        </div>

        {/* データソース */}
        <div className="flex items-center gap-1">
          <HardDrive size={12} />
          <span>{connection?.type === 'local' ? 'ローカル' : connection?.type === 'sharepoint' ? 'SharePoint' : 'メモリ'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* タスク数 */}
        <span>{tasks.length} タスク</span>

        {/* 保存状態 */}
        {isDirty && <span className="text-amber-500">未保存の変更あり</span>}
        {lastSaved && !isDirty && (
          <span>最終保存: {formatTime(lastSaved)}</span>
        )}
      </div>
    </footer>
  )
}
