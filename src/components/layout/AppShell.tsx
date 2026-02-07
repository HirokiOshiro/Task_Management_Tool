import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { StatusBar } from './StatusBar'
import { ViewContainer } from '@/components/views/ViewContainer'
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel'

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <ViewContainer />
        </main>
        <StatusBar />
      </div>
      <TaskDetailPanel />
    </div>
  )
}
