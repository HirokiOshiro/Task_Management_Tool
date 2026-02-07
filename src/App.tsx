import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useTaskStore, hasPersistedData } from '@/stores/task-store'
import { useUIStore } from '@/stores/ui-store'
import { useI18n } from '@/i18n'
import { MemoryAdapter } from '@/adapters/memory-adapter'

function App() {
  const loadDataSet = useTaskStore((s) => s.loadDataSet)
  const isLoaded = useTaskStore((s) => s.isLoaded)
  const theme = useUIStore((s) => s.theme)
  const { t } = useI18n()

  // 初期化: localStorageにデータがなければデモデータをロード
  useEffect(() => {
    if (isLoaded) return
    // persist から復元された場合はスキップ
    if (hasPersistedData()) {
      // persist ミドルウェアが復元するのを待つ
      const unsub = useTaskStore.subscribe((state) => {
        if (state.isLoaded) unsub()
      })
      return
    }
    const adapter = new MemoryAdapter()
    adapter.load().then((dataSet) => {
      loadDataSet(dataSet)
    })
  }, [isLoaded, loadDataSet])

  // テーマ初期適用
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // タブを閉じる/リロード時にファイル未保存の場合は確認ダイアログ
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const { isDirty } = useTaskStore.getState()
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">{t.common.loading}</div>
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
