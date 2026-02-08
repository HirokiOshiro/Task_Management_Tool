import { useState, useCallback, useRef } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useI18n } from '@/i18n'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 完了アニメーション後に store を更新するまでの猶予(ms) */
const COMPLETE_DELAY = 800

interface TaskCheckButtonProps {
  taskId: string
  status: string
  onClick?: (e: React.MouseEvent) => void
  /** store 更新直前に呼ばれる。行フェードアウト等に使用 */
  onBeforeComplete?: () => void
}

export function TaskCheckButton({ taskId, status, onClick, onBeforeComplete }: TaskCheckButtonProps) {
  const updateTask = useTaskStore((s) => s.updateTask)
  const { t } = useI18n()
  const isDone = status === 'done'
  const [animating, setAnimating] = useState(false)
  const pendingRef = useRef(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    onClick?.(e)
    // 連打防止
    if (pendingRef.current) return

    if (!isDone) {
      // 未完了 → 完了: アニメーション後に遅延更新
      pendingRef.current = true
      setAnimating(true)
      setTimeout(() => {
        setAnimating(false)
        onBeforeComplete?.()
      }, 500)
      setTimeout(() => {
        updateTask(taskId, SYSTEM_FIELD_IDS.STATUS, 'done')
        pendingRef.current = false
      }, COMPLETE_DELAY)
    } else {
      // 完了 → 進行中: 即座に更新
      updateTask(taskId, SYSTEM_FIELD_IDS.STATUS, 'in_progress')
    }
  }, [onClick, isDone, taskId, updateTask, onBeforeComplete])

  // アニメーション中は完了済みの見た目を先行表示
  const showDone = isDone || animating

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative rounded p-0.5 transition-colors',
        showDone
          ? 'text-green-500 hover:text-green-600'
          : 'text-muted-foreground/40 hover:text-green-500'
      )}
      title={isDone ? t.common.markInProgress : t.common.markDone}
    >
      {/* アイコン */}
      <span className={cn('inline-flex', animating && 'animate-check-pop')}>
        {showDone ? <CheckSquare size={16} /> : <Square size={16} />}
      </span>
      {/* 完了時パーティクル */}
      {animating && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-check-ring absolute h-5 w-5 rounded-full border-2 border-green-400" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <span
              key={deg}
              className="animate-check-particle absolute h-1 w-1 rounded-full bg-green-400"
              style={{ '--particle-angle': `${deg}deg` } as React.CSSProperties}
            />
          ))}
        </span>
      )}
    </button>
  )
}
