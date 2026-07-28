import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type Lang = 'es' | 'en'

type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
}

/**
 * The site ships Spanish first (that's the audience and what the crawlers see),
 * then swaps to the visitor's preference once we're on the client.
 */
const LangContext = createContext<LangContextValue>({
  lang: 'es',
  setLang: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const stored = localStorage.getItem('lang')
    const initial: Lang =
      stored === 'es' || stored === 'en'
        ? stored
        : navigator.language.startsWith('es')
          ? 'es'
          : 'en'
    setLangState(initial)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem('lang', next)
    setLangState(next)
  }, [])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

/** Picks one of two translations for the active language. */
export function useT() {
  const { lang } = useLang()
  return useCallback(
    <T,>(es: T, en: T) => (lang === 'es' ? es : en),
    [lang],
  )
}
