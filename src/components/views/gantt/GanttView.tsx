import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useFilteredTasks } from '@/hooks/useFilteredTasks'
import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import {
  differenceInDays,
  startOfDay,
  startOfMonth,
  addDays,
  addMonths,
  format,
  isWeekend,
  min as dateMin,
  max as dateMax,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useI18n } from '@/i18n'

const DAY_WIDTH = 32
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 72
const HANDLE_WIDTH = 8
const MONTH_HEADER_HEIGHT = 24

type DragMode = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  taskId: string
  mode: DragMode
  startX: number
  daysDelta: number
  originalStart: Date
  originalEnd: Date
}

interface GanttTask {
  id: string
  title: string
  start: Date
  end: Date
  progress: number
  color: string
}

export function GanttView() {
  const { filteredTasks: tasks, fields } = useFilteredTasks()
  const updateTaskFields = useTaskStore((s) => s.updateTaskFields)
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { t, lang } = useI18n()
  const dateFnsLocale = lang === 'ja' ? ja : enUS

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
          title: String(task.fieldValues[SYSTEM_FIELD_IDS.TITLE] ?? t.common.untitled),
          start,
          end: end < start ? start : end,
          progress,
          color: statusOption?.color ?? '#3b82f6',
        }
      })
      .filter(Boolean) as GanttTask[]
  }, [tasks, fields])

  // 開始日で昇順ソート
  const sortedGanttTasks = useMemo(() => {
    return [...ganttTasks].sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [ganttTasks])

  // 表示範囲計算（前後3ヶ月のパディング付き）
  const { minDate, totalDays } = useMemo(() => {
    const today = startOfDay(new Date())
    if (sortedGanttTasks.length === 0) {
      const rangeStart = startOfMonth(addMonths(today, -3))
      const rangeEnd = addDays(startOfMonth(addMonths(today, 4)), -1)
      return {
        minDate: rangeStart,
        totalDays: differenceInDays(rangeEnd, rangeStart) + 1,
      }
    }
    const allStarts = sortedGanttTasks.map((t) => t.start)
    const allEnds = sortedGanttTasks.map((t) => t.end)
    const earliest = dateMin([...allStarts, today])
    const latest = dateMax([...allEnds, today])
    const rangeStart = startOfMonth(addMonths(earliest, -3))
    const rangeEnd = addDays(startOfMonth(addMonths(latest, 4)), -1)
    return {
      minDate: rangeStart,
      totalDays: differenceInDays(rangeEnd, rangeStart) + 1,
    }
  }, [sortedGanttTasks])

  // 日付ヘッダー
  const days = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(minDate, i))
  }, [minDate, totalDays])

  // 今日の位置
  const todayOffset = differenceInDays(startOfDay(new Date()), minDate)

  // 月ヘッダー生成
  const monthHeaders = useMemo(() => {
    const headers: { label: string; startIndex: number; span: number }[] = []
    let currentMonth = -1
    let currentYear = -1
    let startIndex = 0

    for (let i = 0; i < days.length; i++) {
      const d = days[i]
      const m = d.getMonth()
      const y = d.getFullYear()
      if (m !== currentMonth || y !== currentYear) {
        if (currentMonth !== -1) {
          headers.push({
            label: format(days[startIndex], t.gantt.monthFormat, { locale: dateFnsLocale }),
            startIndex,
            span: i - startIndex,
          })
        }
        currentMonth = m
        currentYear = y
        startIndex = i
      }
    }
    // 最後の月
    if (days.length > 0) {
      headers.push({
        label: format(days[startIndex], t.gantt.monthFormat, { locale: dateFnsLocale }),
        startIndex,
        span: days.length - startIndex,
      })
    }
    return headers
  }, [days])

  // 初回マウント時に今日の位置にスクロール
  useEffect(() => {
    if (containerRef.current && todayOffset >= 0) {
      const scrollLeft = todayOffset * DAY_WIDTH - containerRef.current.clientWidth / 2 + 240
      containerRef.current.scrollLeft = Math.max(0, scrollLeft)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** ドラッグ中のタスクの表示位置を計算 */
  const getDisplayDates = useCallback(
    (task: GanttTask): { start: Date; end: Date } => {
      if (!dragState || dragState.taskId !== task.id) {
        return { start: task.start, end: task.end }
      }

      const { mode, daysDelta, originalStart, originalEnd } = dragState

      switch (mode) {
        case 'move':
          return {
            start: addDays(originalStart, daysDelta),
            end: addDays(originalEnd, daysDelta),
          }
        case 'resize-start': {
          const newStart = addDays(originalStart, daysDelta)
          return {
            start: newStart > originalEnd ? originalEnd : newStart,
            end: originalEnd,
          }
        }
        case 'resize-end': {
          const newEnd = addDays(originalEnd, daysDelta)
          return {
            start: originalStart,
            end: newEnd < originalStart ? originalStart : newEnd,
          }
        }
        default:
          return { start: task.start, end: task.end }
      }
    },
    [dragState]
  )

  /** ドラッグ開始 */
  const handleDragStart = useCallback(
    (e: React.MouseEvent, task: GanttTask, mode: DragMode) => {
      e.preventDefault()
      e.stopPropagation()

      const state: DragState = {
        taskId: task.id,
        mode,
        startX: e.clientX,
        daysDelta: 0,
        originalStart: task.start,
        originalEnd: task.end,
      }

      setDragState(state)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - state.startX
        const daysDelta = Math.round(deltaX / DAY_WIDTH)
        setDragState((prev) => (prev ? { ...prev, daysDelta } : null))
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        setDragState((current) => {
          if (!current || current.daysDelta === 0) return null

          const { mode: m, daysDelta: dd, originalStart: os, originalEnd: oe } = current

          let newStart: Date
          let newEnd: Date

          switch (m) {
            case 'move':
              newStart = addDays(os, dd)
              newEnd = addDays(oe, dd)
              break
            case 'resize-start': {
              newStart = addDays(os, dd)
              newEnd = oe
              if (newStart > newEnd) newStart = newEnd
              break
            }
            case 'resize-end': {
              newStart = os
              newEnd = addDays(oe, dd)
              if (newEnd < newStart) newEnd = newStart
              break
            }
          }

          updateTaskFields(task.id, {
            [SYSTEM_FIELD_IDS.START_DATE]: format(newStart, 'yyyy-MM-dd'),
            [SYSTEM_FIELD_IDS.DUE_DATE]: format(newEnd, 'yyyy-MM-dd'),
          })

          return null
        })
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [updateTaskFields]
  )

  if (sortedGanttTasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        {t.gantt.emptyMessage}
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto" ref={containerRef}>
      <div
        style={{ width: 240 + totalDays * DAY_WIDTH, minHeight: '100%' }}
        className={dragState ? 'select-none' : ''}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex border-b border-border bg-background">
          {/* タスク名カラム */}
          <div className="sticky left-0 z-20 w-60 flex-shrink-0 border-r border-border bg-background px-3 flex items-end pb-1">
            <div className="text-xs font-medium text-muted-foreground">{t.gantt.taskName}</div>
          </div>
          {/* 日付ヘッダー */}
          <div className="flex flex-col">
            {/* 月ヘッダー行 */}
            <div className="flex" style={{ height: MONTH_HEADER_HEIGHT }}>
              {monthHeaders.map((mh, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center border-r border-b border-border text-xs font-semibold text-foreground bg-muted/30"
                  style={{ width: mh.span * DAY_WIDTH }}
                >
                  {mh.label}
                </div>
              ))}
            </div>
            {/* 日付行 */}
            <div className="flex">
              {days.map((day, i) => {
                const isToday = i === todayOffset
                const weekend = isWeekend(day)
                const isFirstOfMonth = day.getDate() === 1
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center border-r border-border text-xs ${
                      isToday
                        ? 'bg-primary/10 font-bold text-primary'
                        : weekend
                          ? 'bg-muted/50 text-muted-foreground'
                          : 'text-muted-foreground'
                    } ${isFirstOfMonth ? 'border-l border-l-border' : ''}`}
                    style={{ width: DAY_WIDTH, height: HEADER_HEIGHT - MONTH_HEADER_HEIGHT }}
                  >
                    <span>{format(day, 'd')}</span>
                    <span className="text-[10px]">{format(day, 'E', { locale: dateFnsLocale })}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* タスク行 */}
        {sortedGanttTasks.map((task) => {
          const { start, end } = getDisplayDates(task)
          const startOffset = differenceInDays(start, minDate)
          const duration = differenceInDays(end, start) + 1
          const barWidth = Math.max(duration * DAY_WIDTH - 4, 20)
          const isDragging = dragState?.taskId === task.id

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
                  className={`absolute top-1.5 flex items-center rounded-md text-xs text-white shadow-sm transition-opacity group ${
                    isDragging ? 'opacity-80 ring-2 ring-primary/50' : 'hover:opacity-90'
                  }`}
                  style={{
                    left: startOffset * DAY_WIDTH + 2,
                    width: barWidth,
                    height: ROW_HEIGHT - 12,
                    backgroundColor: task.color,
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  title={`${task.title} (${format(start, 'M/d')} 〜 ${format(end, 'M/d')})`}
                  onMouseDown={(e) => handleDragStart(e, task, 'move')}
                  onClick={() => {
                    if (!dragState) openDetailPanel(task.id)
                  }}
                >
                  {/* 左端リサイズハンドル */}
                  <div
                    className="absolute left-0 top-0 h-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: HANDLE_WIDTH, cursor: 'col-resize' }}
                    onMouseDown={(e) => handleDragStart(e, task, 'resize-start')}
                  >
                    <div className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3 w-1 rounded-full bg-white/60" />
                  </div>

                  {/* 進捗バー */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-md bg-white/20"
                    style={{ width: `${task.progress}%` }}
                  />
                  <span className="relative z-10 truncate px-3">{task.title}</span>

                  {/* 右端リサイズハンドル */}
                  <div
                    className="absolute right-0 top-0 h-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: HANDLE_WIDTH, cursor: 'col-resize' }}
                    onMouseDown={(e) => handleDragStart(e, task, 'resize-end')}
                  >
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2 h-3 w-1 rounded-full bg-white/60" />
                  </div>
                </div>

                {/* ドラッグ中の日付ツールチップ */}
                {isDragging && dragState.daysDelta !== 0 && (
                  <div
                    className="absolute z-30 rounded bg-foreground/90 px-2 py-0.5 text-[10px] text-background whitespace-nowrap pointer-events-none"
                    style={{
                      left: startOffset * DAY_WIDTH + 2,
                      top: ROW_HEIGHT - 10,
                    }}
                  >
                    {format(start, 'M/d')} 〜 {format(end, 'M/d')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
