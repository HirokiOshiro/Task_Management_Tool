import { useViewStore } from '@/stores/view-store'
import { TableView } from './table/TableView'
import { KanbanView } from './kanban/KanbanView'
import { GanttView } from './gantt/GanttView'
import { CalendarView } from './calendar/CalendarView'

export function ViewContainer() {
  const activeView = useViewStore((s) => s.getActiveView())

  switch (activeView.type) {
    case 'table':
      return <TableView />
    case 'kanban':
      return <KanbanView />
    case 'gantt':
      return <GanttView />
    case 'calendar':
      return <CalendarView />
    default:
      return <TableView />
  }
}
