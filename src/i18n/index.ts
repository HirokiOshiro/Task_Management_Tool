import { create } from 'zustand'
import { ja } from './locales/ja'
import { en } from './locales/en'
import type { Locale } from './locales/ja'

export type Lang = 'ja' | 'en'

const locales: Record<Lang, Locale> = { ja, en }

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'ja'
  const stored = localStorage.getItem('lang')
  if (stored === 'ja' || stored === 'en') return stored
  return 'ja'
}

interface I18nState {
  lang: Lang
  t: Locale
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

export const useI18n = create<I18nState>()((set) => ({
  lang: getInitialLang(),
  t: locales[getInitialLang()],
  setLang: (lang) => {
    localStorage.setItem('lang', lang)
    set({ lang, t: locales[lang] })
  },
  toggleLang: () =>
    set((s) => {
      const next: Lang = s.lang === 'ja' ? 'en' : 'ja'
      localStorage.setItem('lang', next)
      return { lang: next, t: locales[next] }
    }),
}))

// ── 翻訳ヘルパー ──

/** システムフィールドID → fieldNames キーのマッピング */
const FIELD_ID_TO_KEY: Record<string, keyof Locale['fieldNames']> = {
  title: 'title',
  status: 'status',
  assignee: 'assignee',
  due_date: 'dueDate',
  priority: 'priority',
  description: 'description',
  tags: 'tags',
  start_date: 'startDate',
  dependencies: 'dependencies',
  notes: 'notes',
  category: 'category',
  url: 'url',
}

/** デフォルトビュータイプ → views キーのマッピング */
const DEFAULT_VIEW_NAMES_JA: Record<string, keyof Locale['views']> = {
  'テーブル': 'table',
  'カンバン': 'kanban',
  'ガント': 'gantt',
  'カレンダー': 'calendar',
}

/**
 * フィールド名を翻訳する。
 * システムフィールドの場合は t.fieldNames から翻訳を返し、
 * カスタムフィールドの場合はそのまま name を返す。
 */
export function translateFieldName(t: Locale, fieldId: string, name: string): string {
  const key = FIELD_ID_TO_KEY[fieldId]
  if (key && t.fieldNames[key]) return t.fieldNames[key]
  return name
}

/**
 * セレクトオプションのラベルを翻訳する。
 * ステータス/優先度のデフォルトオプションは t.status / t.priority から翻訳し、
 * カスタムオプションはそのまま返す。
 */
export function translateOptionLabel(t: Locale, fieldId: string, optionId: string, label: string): string {
  if (fieldId === 'status' && t.status[optionId]) return t.status[optionId]
  if (fieldId === 'priority' && t.priority[optionId]) return t.priority[optionId]
  if (fieldId === 'category' && t.category[optionId]) return t.category[optionId]
  return label
}

/**
 * デフォルトビュー名を翻訳する。
 * デフォルトの日本語ビュー名にマッチする場合は翻訳を返し、
 * ユーザーがリネームしたビューはそのまま返す。
 */
export function translateViewName(t: Locale, name: string): string {
  const key = DEFAULT_VIEW_NAMES_JA[name]
  if (key) return t.views[key] as string
  // English defaults too
  const enDefaults: Record<string, keyof Locale['views']> = {
    'Table': 'table',
    'Kanban': 'kanban',
    'Gantt': 'gantt',
    'Calendar': 'calendar',
  }
  const enKey = enDefaults[name]
  if (enKey) return t.views[enKey] as string
  return name
}
