import { useMemo } from 'react'
import { useFilteredTasks } from '@/hooks/useFilteredTasks'
import { useUIStore } from '@/stores/ui-store'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import {
  differenceInDays,
  startOfDay,
  addDays,
  format,
  isWeekend,
  min as dateMin,
  max as dateMax,
} from 'date-fns'
import { ja } from 'date-fns/locale'

const DAY_WIDTH = 32
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 52

export function GanttView() {
  const { filteredTasks: tasks, fields } = useFilteredTasks()
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)

  // ガント用のタスクデータに変換
  const ganttTasks = useMemo(() => {
    return tasks
      .map((task) => {
        const startStr = task.fieldValues[SYSTEM_FIELD_IDS.START_DATE] as string | undefined
        const endStr = task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE] as string | undefined
        if (!startStr && !endStr) return null

        const start = startStr ? startOfDay(new Date(startStr)) : startOfDay(new Date(endStr!))
        const end = endStr ? startOfDay(new Date(endStr)) : startOfDay(new Date(startStr!))
        const progress = (task.fieldValues[SYSTEM_FIELD_IDS.PROGRESS] as number) ?? 0
        const status = task.fieldValues[SYSTEM_FIELD_IDS.STATUS] as string
        const statusField = fields.find((f) => f.id === SYSTEM_FIELD_IDS.STATUS)
        const statusOption = statusField?.options?.find((o) => o.id === status)

        return {
          id: task.id,
          title: String(task.fieldValues[SYSTEM_FIELD_IDS.TITLE] ?? '無題'),
          start,
          end: end < start ? start : end,
          progress,
          color: statusOption?.color ?? '#3b82f6',
        }
      })
      .filter(Boolean) as {
        id: string
        title: string
        start: Date
        end: Date
        progress: number
        color: string
      }[]
  }, [tasks, fields])

  // 表示範囲計算
  const { minDate, totalDays } = useMemo(() => {
    if (ganttTasks.length === 0) {
      const today = startOfDay(new Date())
      return { minDate: addDays(today, -7), maxDate: addDays(today, 30), totalDays: 37 }
    }
    const allStarts = ganttTasks.map((t) => t.start)
    const allEnds = ganttTasks.map((t) => t.end)
    const earliest = addDays(dateMin(allStarts), -3)
    const latest = addDays(dateMax(allEnds), 7)
    return {
      minDate: earliest,
      maxDate: latest,
      totalDays: differenceInDays(latest, earliest) + 1,
    }
  }, [ganttTasks])

  // 日付ヘッダー
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(minDate, i))
  }, [minDate, totalDays])

  // 今日の位置
  const todayOffset = differenceInDays(startOfDay(new Date()), minDate)

  if (ganttTasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        ガントチャートを表示するにはタスクに開始日または期限を設定してください。
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div style={{ width: 240 + totalDays * DAY_WIDTH, minHeight: '100%' }}>
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex border-b border-border bg-background">
          {/* タスク名カラム */}
          <div className="sticky left-0 z-20 w-60 flex-shrink-0 border-r border-border bg-background px-3 py-2">
            <div className="text-xs font-medium text-muted-foreground">タスク名</div>
          </div>
          {/* 日付ヘッダー */}
          <div className="flex">
            {days.map((day, i) => {
              const isToday = i === todayOffset
              const weekend = isWeekend(day)
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center border-r border-border text-xs ${
                    isToday ? 'bg-primary/10 font-bold text-primary' : weekend ? 'bg-muted/50 text-muted-foreground' : 'text-muted-foreground'
                  }`}
                  style={{ width: DAY_WIDTH, height: HEADER_HEIGHT }}
                >
                  <span>{format(day, 'M/d')}</span>
                  <span className="text-[10px]">{format(day, 'E', { locale: ja })}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* タスク行 */}
        {ganttTasks.map((task) => {
          const startOffset = differenceInDays(task.start, minDate)
          const duration = differenceInDays(task.end, task.start) + 1
          return (
            <div key={task.id} className="flex border-b border-border" style={{ height: ROW_HEIGHT }}>
              {/* タスク名 */}
              <div
                className="sticky left-0 z-10 flex w-60 flex-shrink-0 items-center border-r border-border bg-background px-3 text-sm truncate cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => openDetailPanel(task.id)}
              >
                {task.title}
              </div>
              {/* ガントバー領域 */}
              <div className="relative flex-1">
                {/* 今日線 */}
                {todayOffset >= 0 && todayOffset < totalDays && (
                  <div
                    className="absolute top-0 h-full w-px bg-primary/50"
                    style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                  />
                )}
                {/* バー */}
                <div
                  className="absolute top-1.5 flex items-center rounded-md text-xs text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    left: startOffset * DAY_WIDTH + 2,
                    width: Math.max(duration * DAY_WIDTH - 4, 20),
                    height: ROW_HEIGHT - 12,
                    backgroundColor: task.color,
                  }}
                  title={`${task.title} (${task.progress}%)`}
                  onClick={() => openDetailPanel(task.id)}
                >
                  {/* 進捗バー */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-md bg-white/20"
                    style={{ width: `${task.progress}%` }}
                  />
                  <span className="relative z-10 truncate px-2">{task.title}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
