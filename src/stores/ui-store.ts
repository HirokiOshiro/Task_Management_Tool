import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  selectedTaskId: string | null
  detailPanelOpen: boolean

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  selectTask: (taskId: string | null) => void
  openDetailPanel: (taskId: string) => void
  closeDetailPanel: () => void
}

// ローカルストレージからテーマを読み込み
function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  theme: getInitialTheme(),
  selectedTaskId: null,
  detailPanelOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return { theme: next }
    }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },

  selectTask: (taskId) => set({ selectedTaskId: taskId }),

  openDetailPanel: (taskId) =>
    set({ selectedTaskId: taskId, detailPanelOpen: true }),

  closeDetailPanel: () =>
    set({ detailPanelOpen: false }),
}))
