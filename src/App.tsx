import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useTaskStore } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import { MemoryAdapter } from '@/adapters/memory-adapter'

function App() {
  const loadDataSet = useTaskStore((s) => s.loadDataSet)
  const isLoaded = useTaskStore((s) => s.isLoaded)
  const theme = useUIStore((s) => s.theme)

  // 初期化: デモデータをロード
  useEffect(() => {
    if (isLoaded) return
    const adapter = new MemoryAdapter()
    adapter.load().then((dataSet) => {
      loadDataSet(dataSet)
    })
  }, [isLoaded, loadDataSet])

  // テーマ初期適用
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    )
  }

  return (
    <>
      <AppShell />
      <ToastContainer />
    </>
  )
}

export default App
