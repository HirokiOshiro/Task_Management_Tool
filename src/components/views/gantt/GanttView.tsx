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
import { sanitizeColor } from '@/lib/sanitize'
import { useI18n } from '@/i18n'
import { CalendarDays, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCheckButton } from '@/components/ui/TaskCheckButton'

const DAY_WIDTH = 32
const ROW_HEIGHT = 36
const HEADER_HEIGHT = 72
const HANDLE_WIDTH = 8
const MONTH_HEADER_HEIGHT = 24
const TASK_NAME_WIDTH = 240

type DragMode = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  taskId: string
  mode: DragMode
  startX: number
  daysDelta: number
  originalStart: Date
  originalEnd: Date
  /** 一括ドラッグ時の対象タスク群（ドラッグ元を除く） */
  batchTargets?: { id: string; originalStart: Date; originalEnd: Date }[]
}

/** マーキー（範囲選択）状態 */
interface MarqueeState {
  /** ドラッグ開始地点（コンテナ内座標） */
  startX: number
  startY: number
  /** 現在のマウス位置 */
  currentX: number
  currentY: number
}

interface GanttTask {
  id: string
  title: string
  start: Date
  end: Date
  progress: number
  color: string
}

/** インラインタスク作成状態 */
interface InlineCreateState {
  /** クリック位置から算出した開始日 */
  startDate: Date
  /** 開始日 + 3日のデフォルト終了日 */
  endDate: Date
}

export function GanttView() {
  const { filteredTasks: tasks, fields } = useFilteredTasks()
  const updateTaskFields = useTaskStore((s) => s.updateTaskFields)
  const addTask = useTaskStore((s) => s.addTask)
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)

  const [dragState, setDragState] = useState<DragState | null>(null)
  const [fadingTaskIds, setFadingTaskIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<MarqueeState | null>(null)
  const [inlineCreate, setInlineCreate] = useState<InlineCreateState | null>(null)
  const [inlineTitle, setInlineTitle] = useState('')
  const inlineInputRef = useRef<HTMLInputElement>(null)
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
          color: sanitizeColor(statusOption?.color ?? '#3b82f6'),
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

  // 今日の位置にスクロールする関数
  const scrollToToday = useCallback(() => {
    if (containerRef.current && todayOffset >= 0) {
      const scrollLeft = todayOffset * DAY_WIDTH - containerRef.current.clientWidth / 2 + 240
      containerRef.current.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      })
    }
  }, [todayOffset])

  // 初回マウント時に今日の位置にスクロール
  useEffect(() => {
    if (containerRef.current && todayOffset >= 0) {
      const scrollLeft = todayOffset * DAY_WIDTH - containerRef.current.clientWidth / 2 + 240
      containerRef.current.scrollLeft = Math.max(0, scrollLeft)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** ドラッグ中のタスクの表示位置を計算（一括ドラッグ対応） */
  const getDisplayDates = useCallback(
    (task: GanttTask): { start: Date; end: Date } => {
      if (!dragState) {
        return { start: task.start, end: task.end }
      }

      // ドラッグ元タスク
      if (dragState.taskId === task.id) {
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
      }

      // 一括ドラッグのバッチ対象タスク（move のみ連動）
      if (dragState.mode === 'move' && dragState.batchTargets) {
        const bt = dragState.batchTargets.find((b) => b.id === task.id)
        if (bt) {
          return {
            start: addDays(bt.originalStart, dragState.daysDelta),
            end: addDays(bt.originalEnd, dragState.daysDelta),
          }
        }
      }

      return { start: task.start, end: task.end }
    },
    [dragState]
  )

  /** ドラッグ開始（一括ドラッグ対応） */
  const handleDragStart = useCallback(
    (e: React.MouseEvent, task: GanttTask, mode: DragMode) => {
      e.preventDefault()
      e.stopPropagation()

      // 一括ドラッグ: 選択中のタスクを move する場合、バッチ対象を構築
      let batchTargets: DragState['batchTargets'] = undefined
      if (mode === 'move' && selectedIds.has(task.id) && selectedIds.size > 1) {
        batchTargets = sortedGanttTasks
          .filter((gt) => selectedIds.has(gt.id) && gt.id !== task.id)
          .map((gt) => ({ id: gt.id, originalStart: gt.start, originalEnd: gt.end }))
      }

      const state: DragState = {
        taskId: task.id,
        mode,
        startX: e.clientX,
        daysDelta: 0,
        originalStart: task.start,
        originalEnd: task.end,
        batchTargets,
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

          // ドラッグ元タスクを更新
          updateTaskFields(task.id, {
            [SYSTEM_FIELD_IDS.START_DATE]: format(newStart, 'yyyy-MM-dd'),
            [SYSTEM_FIELD_IDS.DUE_DATE]: format(newEnd, 'yyyy-MM-dd'),
          })

          // バッチ対象も一括更新（move のみ）
          if (m === 'move' && current.batchTargets) {
            for (const bt of current.batchTargets) {
              updateTaskFields(bt.id, {
                [SYSTEM_FIELD_IDS.START_DATE]: format(addDays(bt.originalStart, dd), 'yyyy-MM-dd'),
                [SYSTEM_FIELD_IDS.DUE_DATE]: format(addDays(bt.originalEnd, dd), 'yyyy-MM-dd'),
              })
            }
          }

          return null
        })
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [updateTaskFields, selectedIds, sortedGanttTasks]
  )

  /** マーキー（範囲選択）ハンドラ — ガントバー領域の空白部分で発火 */
  const handleMarqueeStart = useCallback(
    (e: React.MouseEvent) => {
      // バーやリサイズハンドルから来たイベントは無視
      if (e.defaultPrevented) return
      // 左ボタンのみ
      if (e.button !== 0) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const startX = e.clientX - rect.left + container.scrollLeft
      const startY = e.clientY - rect.top + container.scrollTop

      setMarquee({ startX, startY, currentX: startX, currentY: startY })
      // Shift が押されていなければ既存選択をクリア
      if (!e.shiftKey) {
        setSelectedIds(new Set())
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const cx = moveEvent.clientX - rect.left + container.scrollLeft
        const cy = moveEvent.clientY - rect.top + container.scrollTop
        setMarquee((prev) => prev ? { ...prev, currentX: cx, currentY: cy } : null)
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        const cx = upEvent.clientX - rect.left + container.scrollLeft
        const cy = upEvent.clientY - rect.top + container.scrollTop

        // マーキー矩形を計算
        const selLeft = Math.min(startX, cx)
        const selRight = Math.max(startX, cx)
        const selTop = Math.min(startY, cy)
        const selBottom = Math.max(startY, cy)

        // 最低限の大きさ（小さすぎるドラッグは単なるクリック扱い → 選択解除）
        const isRealDrag = (selRight - selLeft) > 4 || (selBottom - selTop) > 4

        if (isRealDrag) {
          const newSelected = new Set<string>(upEvent.shiftKey ? selectedIds : undefined)
          sortedGanttTasks.forEach((gt, rowIndex) => {
            const barStartOffset = differenceInDays(gt.start, minDate)
            const barDuration = differenceInDays(gt.end, gt.start) + 1
            // バーのピクセル位置（タスク名列分オフセット）
            const barLeft = TASK_NAME_WIDTH + barStartOffset * DAY_WIDTH + 2
            const barRight = barLeft + Math.max(barDuration * DAY_WIDTH - 4, 20)
            const barTop = HEADER_HEIGHT + rowIndex * ROW_HEIGHT + 6
            const barBottom = barTop + ROW_HEIGHT - 12

            // 矩形の重なり判定
            if (barRight > selLeft && barLeft < selRight && barBottom > selTop && barTop < selBottom) {
              newSelected.add(gt.id)
            }
          })
          setSelectedIds(newSelected)
        } else if (!upEvent.shiftKey) {
          // 単なるクリック → 選択解除
          setSelectedIds(new Set())
        }

        setMarquee(null)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [sortedGanttTasks, minDate, selectedIds]
  )

  /** マーキー矩形の CSS 用ピクセル座標 */
  const marqueeRect = useMemo(() => {
    if (!marquee) return null
    return {
      left: Math.min(marquee.startX, marquee.currentX),
      top: Math.min(marquee.startY, marquee.currentY),
      width: Math.abs(marquee.currentX - marquee.startX),
      height: Math.abs(marquee.currentY - marquee.startY),
    }
  }, [marquee])

  /** ガントバー領域の空白ダブルクリック → インラインタスク作成 */
  const handleChartDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      // バー上のダブルクリックは無視（バーの onClick で詳細パネルが開く）
      if (e.defaultPrevented) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const clickX = e.clientX - rect.left + container.scrollLeft - TASK_NAME_WIDTH

      // 日程領域外（タスク名列内）は無視
      if (clickX < 0) return

      const dayIndex = Math.floor(clickX / DAY_WIDTH)
      const clickedDate = addDays(minDate, dayIndex)
      const endDate = addDays(clickedDate, 3)

      setInlineCreate({ startDate: clickedDate, endDate })
      setInlineTitle('')
      // 選択をクリア
      setSelectedIds(new Set())
    },
    [minDate]
  )

  /** インラインタスク作成の確定 */
  const handleInlineCreateConfirm = useCallback(() => {
    if (!inlineCreate) return
    const title = inlineTitle.trim()
    if (!title) {
      setInlineCreate(null)
      return
    }

    const newTask = addTask({
      [SYSTEM_FIELD_IDS.TITLE]: title,
      [SYSTEM_FIELD_IDS.STATUS]: 'not_started',
      [SYSTEM_FIELD_IDS.START_DATE]: format(inlineCreate.startDate, 'yyyy-MM-dd'),
      [SYSTEM_FIELD_IDS.DUE_DATE]: format(inlineCreate.endDate, 'yyyy-MM-dd'),
    })

    setInlineCreate(null)
    setInlineTitle('')
    openDetailPanel(newTask.id)
  }, [inlineCreate, inlineTitle, addTask, openDetailPanel])

  /** インラインタスク作成のキャンセル */
  const handleInlineCreateCancel = useCallback(() => {
    setInlineCreate(null)
    setInlineTitle('')
  }, [])

  /** + ボタン → 今日起点でインラインタスク作成 */
  const handleAddTaskRow = useCallback(() => {
    const today = startOfDay(new Date())
    setInlineCreate({ startDate: today, endDate: addDays(today, 3) })
    setInlineTitle('')
  }, [])

  /** インライン入力が表示されたらフォーカス */
  useEffect(() => {
    if (inlineCreate && inlineInputRef.current) {
      inlineInputRef.current.focus()
    }
  }, [inlineCreate])

  // 空状態 — ダブルクリックか + ボタンでタスク作成可能
  if (sortedGanttTasks.length === 0 && !inlineCreate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>{t.gantt.emptyMessage}</p>
        <button
          onClick={handleAddTaskRow}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors border border-primary/30"
        >
          <Plus size={16} />
          {t.common.newTask}
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* 今日ボタン（フローティング） */}
      {todayOffset >= 0 && (
        <button
          onClick={scrollToToday}
          className="absolute top-2 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors text-xs font-medium"
          title={t.gantt.scrollToToday}
        >
          <CalendarDays size={14} />
          {t.common.today}
        </button>
      )}
      <div className="h-full overflow-auto" ref={containerRef}>
      <div
        style={{ width: TASK_NAME_WIDTH + totalDays * DAY_WIDTH, minHeight: '100%' }}
        className={(dragState || marquee) ? 'select-none' : ''}
        onMouseDown={handleMarqueeStart}
        onDoubleClick={handleChartDoubleClick}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex border-b border-border bg-background">
          {/* タスク名カラム */}
          <div className="sticky left-0 z-20 w-60 flex-shrink-0 border-r border-border bg-background px-3 flex items-end pb-1 gap-3">
            <div className="text-xs font-medium text-muted-foreground flex-shrink-0">{t.common.done}</div>
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
          const isBatchTarget = !!(dragState?.batchTargets?.some((b) => b.id === task.id))
          const isSelected = selectedIds.has(task.id)
          const sourceTask = tasks.find(t => t.id === task.id)
          const taskStatus = (sourceTask?.fieldValues[SYSTEM_FIELD_IDS.STATUS] as string) ?? ''

          return (
            <div
              key={task.id}
              className={cn(
                'flex border-b border-border',
                fadingTaskIds.has(task.id) && 'animate-check-row-fade',
                isSelected && !dragState && 'bg-primary/5',
              )}
              style={{ height: ROW_HEIGHT }}
            >
              {/* タスク名 */}
              <div
                className="sticky left-0 z-10 flex w-60 flex-shrink-0 items-center border-r border-border bg-background px-3 text-sm group/name"
                style={{ height: ROW_HEIGHT }}
              >
                {/* 完了チェックボックス */}
                <div className="flex-shrink-0 mr-2">
                  <TaskCheckButton
                    taskId={task.id}
                    status={taskStatus}
                    onClick={(e) => e.stopPropagation()}
                    onBeforeComplete={() => setFadingTaskIds((prev) => new Set(prev).add(task.id))}
                    onAfterComplete={() => setFadingTaskIds((prev) => {
                      const next = new Set(prev)
                      next.delete(task.id)
                      return next
                    })}
                  />
                </div>
                {/* タスク名 */}
                <div
                  className="flex-1 truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => openDetailPanel(task.id)}
                >
                  {task.title}
                </div>
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
                  className={cn(
                    'absolute top-1.5 flex items-center rounded-md text-xs text-white shadow-sm transition-opacity group',
                    isDragging || isBatchTarget
                      ? 'opacity-80 ring-2 ring-primary/50'
                      : isSelected
                        ? 'ring-2 ring-primary/70 hover:opacity-90'
                        : 'hover:opacity-90',
                  )}
                  style={{
                    left: startOffset * DAY_WIDTH + 2,
                    width: barWidth,
                    height: ROW_HEIGHT - 12,
                    backgroundColor: sanitizeColor(task.color),
                    cursor: isDragging || isBatchTarget ? 'grabbing' : 'grab',
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
                {(isDragging || isBatchTarget) && dragState && dragState.daysDelta !== 0 && (
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

        {/* インラインタスク作成行 */}
        {inlineCreate && (
          <div className="flex border-b border-border bg-primary/5" style={{ height: ROW_HEIGHT }}>
            {/* タスク名入力 */}
            <div
              className="sticky left-0 z-10 flex w-60 flex-shrink-0 items-center border-r border-border bg-background px-3"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="flex-shrink-0 mr-2 w-5" />
              <input
                ref={inlineInputRef}
                type="text"
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleInlineCreateConfirm()
                  } else if (e.key === 'Escape') {
                    handleInlineCreateCancel()
                  }
                }}
                onBlur={() => {
                  // 少し遅延して blur 時に確定（空なら消える）
                  setTimeout(() => handleInlineCreateConfirm(), 150)
                }}
                placeholder={t.gantt.taskNamePlaceholder}
                className="flex-1 bg-transparent text-sm outline-none border-b-2 border-primary/50 py-0.5 placeholder:text-muted-foreground/50"
              />
            </div>
            {/* プレビューバー */}
            <div className="relative flex-1">
              {/* 今日線 */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 h-full w-px bg-primary/50"
                  style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                />
              )}
              {(() => {
                const previewStart = differenceInDays(inlineCreate.startDate, minDate)
                const previewDuration = differenceInDays(inlineCreate.endDate, inlineCreate.startDate) + 1
                const previewWidth = Math.max(previewDuration * DAY_WIDTH - 4, 20)
                return (
                  <div
                    className="absolute top-1.5 flex items-center rounded-md text-xs text-white/80 shadow-sm border-2 border-dashed border-primary/60"
                    style={{
                      left: previewStart * DAY_WIDTH + 2,
                      width: previewWidth,
                      height: ROW_HEIGHT - 12,
                      backgroundColor: 'var(--color-primary)',
                      opacity: 0.4,
                    }}
                  >
                    <span className="relative z-10 truncate px-3 text-primary-foreground">
                      {format(inlineCreate.startDate, 'M/d')} 〜 {format(inlineCreate.endDate, 'M/d')}
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ＋ 新規タスク追加行 */}
        {!inlineCreate && (
          <div className="flex border-b border-border/50" style={{ height: ROW_HEIGHT }}>
            <div
              className="sticky left-0 z-10 flex w-60 flex-shrink-0 items-center border-r border-border bg-background"
              style={{ height: ROW_HEIGHT }}
            >
              <button
                onClick={handleAddTaskRow}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <Plus size={14} />
                {t.common.newTask}
              </button>
            </div>
            <div className="relative flex-1">
              {/* 今日線 */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 h-full w-px bg-primary/50"
                  style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                />
              )}
            </div>
          </div>
        )}

        {/* マーキー（範囲選択）矩形 */}
        {marqueeRect && (
          <div
            className="absolute border-2 border-primary/60 bg-primary/10 rounded pointer-events-none z-40"
            style={{
              left: marqueeRect.left,
              top: marqueeRect.top,
              width: marqueeRect.width,
              height: marqueeRect.height,
            }}
          />
        )}
      </div>
    </div>

    {/* 選択中のタスク数バッジ */}
    {selectedIds.size > 1 && (
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-primary-foreground text-xs font-medium shadow-lg">
        {selectedIds.size}{t.gantt.selectedCount}
        <button
          onClick={() => setSelectedIds(new Set())}
          className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] hover:bg-primary-foreground/30 transition-colors"
        >
          {t.gantt.clearSelection}
        </button>
      </div>
    )}
    </div>
  )
}
