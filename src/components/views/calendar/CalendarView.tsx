import { useState, useMemo } from 'react'
import { useFilteredTasks } from '@/hooks/useFilteredTasks'
import { useUIStore } from '@/stores/ui-store'
import { SYSTEM_FIELD_IDS } from '@/types/task'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { filteredTasks: tasks, fields } = useFilteredTasks()
  const openDetailPanel = useUIStore((s) => s.openDetailPanel)

  // 月の全日を取得（前後の週も含む）
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentDate])

  // タスクを日付でグルーピング
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const task of tasks) {
      const dueDate = task.fieldValues[SYSTEM_FIELD_IDS.DUE_DATE] as string | undefined
      if (!dueDate) continue
      const key = dueDate.split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  return (
    <div className="flex h-full flex-col p-4">
      {/* ナビゲーション */}
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="rounded p-1 hover:bg-accent"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'yyyy年 M月', { locale: ja })}
        </h2>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="rounded p-1 hover:bg-accent"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
        >
          今日
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-px border-b border-border">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-xs font-medium ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid flex-1 grid-cols-7 gap-px">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTasks = tasksByDate.get(key) ?? []
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const dayOfWeek = day.getDay()

          return (
            <div
              key={key}
              className={`min-h-[80px] border-b border-r border-border p-1 ${
                !inMonth ? 'bg-muted/20' : ''
              }`}
            >
              {/* 日付ラベル */}
              <div className="mb-1 flex items-center justify-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    today
                      ? 'bg-primary text-primary-foreground font-bold'
                      : !inMonth
                        ? 'text-muted-foreground/40'
                        : dayOfWeek === 0
                          ? 'text-red-500'
                          : dayOfWeek === 6
                            ? 'text-blue-500'
                            : 'text-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* タスク */}
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => {
                  const status = task.fieldValues[SYSTEM_FIELD_IDS.STATUS] as string
                  const statusField = fields.find((f) => f.id === SYSTEM_FIELD_IDS.STATUS)
                  const statusOption = statusField?.options?.find((o) => o.id === status)

                  return (
                    <div
                      key={task.id}
                      className="cursor-pointer truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:opacity-80"
                      style={{
                        backgroundColor: (statusOption?.color ?? '#94a3b8') + '20',
                        color: statusOption?.color ?? '#94a3b8',
                      }}
                      title={String(task.fieldValues[SYSTEM_FIELD_IDS.TITLE] ?? '')}
                      onClick={() => openDetailPanel(task.id)}
                    >
                      {String(task.fieldValues[SYSTEM_FIELD_IDS.TITLE] ?? '無題')}
                    </div>
                  )
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayTasks.length - 3}件
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
