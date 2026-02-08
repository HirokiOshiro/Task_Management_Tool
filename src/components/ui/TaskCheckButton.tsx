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

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e)
    updateTask(taskId, SYSTEM_FIELD_IDS.STATUS, isDone ? 'in_progress' : 'done')
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded p-0.5 transition-colors',
        isDone
          ? 'text-green-500 hover:text-green-600'
          : 'text-muted-foreground/40 hover:text-green-500'
      )}
      title={isDone ? t.common.markInProgress : t.common.markDone}
    >
      {isDone ? <CheckSquare size={16} /> : <Square size={16} />}
    </button>
  )
}
