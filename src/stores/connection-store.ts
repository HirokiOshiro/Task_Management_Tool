import { create } from 'zustand'
import type { DataAdapter, DataSourceConnection, DataSourceType } from '@/types/adapter'

interface ConnectionState {
  adapter: DataAdapter | null
  connection: DataSourceConnection | null
  status: 'disconnected' | 'connecting' | 'connected' | 'saving' | 'error'
  lastSaved: Date | null
  error: string | null

  setAdapter: (adapter: DataAdapter) => void
  setConnection: (connection: DataSourceConnection) => void
  setStatus: (status: ConnectionState['status']) => void
  setLastSaved: (date: Date) => void
  setError: (error: string | null) => void
  disconnect: () => void
  getSourceType: () => DataSourceType
}

export const useConnectionStore = create<ConnectionState>()((set, get) => ({
  adapter: null,
  connection: null,
  status: 'disconnected',
  lastSaved: null,
  error: null,

  setAdapter: (adapter) => set({ adapter }),
  setConnection: (connection) => set({ connection, status: 'connected', error: null }),
  setStatus: (status) => set({ status }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setError: (error) => set({ error, status: 'error' }),

  disconnect: () =>
    set({
      adapter: null,
      connection: null,
      status: 'disconnected',
      lastSaved: null,
      error: null,
    }),

  getSourceType: () => get().connection?.type ?? 'memory',
}))
