import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth"
import { supabase } from "../lib/supabase"
import { getDictionary, detectBrowserLanguage } from "../locales"
import type { Dictionary } from "../locales/types"

type LocaleContextType = {
  t: Dictionary
  language: string
  updateLanguage: (lang: string) => Promise<void>
}

const LocaleContext = createContext<LocaleContextType>({
  t: getDictionary(detectBrowserLanguage()),
  language: detectBrowserLanguage(),
  updateLanguage: async () => {},
})

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [language, setLanguage] = useState(detectBrowserLanguage())

  useEffect(() => {
    if (!session?.user) {
      setLanguage(detectBrowserLanguage())
      return
    }

    supabase
      .from("User")
      .select("language")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data?.language) setLanguage(data.language)
      })
  }, [session])

  async function updateLanguage(lang: string) {
    setLanguage(lang)
    if (!session?.user) return
    await supabase.from("User").update({ language: lang }).eq("id", session.user.id)
  }

  return (
    <LocaleContext.Provider value={{ t: getDictionary(language), language, updateLanguage }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
