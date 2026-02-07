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
