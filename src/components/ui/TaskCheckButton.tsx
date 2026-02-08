import { useState, useCallback } from 'react'
import { useTaskStore } from '@/stores/task-store'
import { useI18n } from '@/i18n'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import { CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskCheckButtonProps {
  taskId: string
  status: string
  onClick?: (e: React.MouseEvent) => void
}

export function TaskCheckButton({ taskId, status, onClick }: TaskCheckButtonProps) {
  const updateTask = useTaskStore((s) => s.updateTask)
  const { t } = useI18n()
  const isDone = status === 'done'
  const [animating, setAnimating] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    onClick?.(e)
    const willComplete = !isDone
    if (willComplete) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 600)
    }
    updateTask(taskId, SYSTEM_FIELD_IDS.STATUS, isDone ? 'in_progress' : 'done')
  }, [onClick, isDone, taskId, updateTask])

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative rounded p-0.5 transition-colors',
        isDone
          ? 'text-green-500 hover:text-green-600'
          : 'text-muted-foreground/40 hover:text-green-500'
      )}
      title={isDone ? t.common.markInProgress : t.common.markDone}
    >
      {/* アイコン */}
      <span className={cn('inline-flex', animating && 'animate-check-pop')}>
        {isDone ? <CheckSquare size={16} /> : <Square size={16} />}
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
