import en from "./en"
import pt from "./pt"
import type { Dictionary } from "./types"

export type { Dictionary }

export const dictionaries: Record<string, Dictionary> = { en, pt }

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
]

export const DEFAULT_LANGUAGE = "en"

export function getDictionary(lang: string): Dictionary {
  return dictionaries[lang] ?? dictionaries[DEFAULT_LANGUAGE]
}

function detectBrowserLanguage(): string {
  if (typeof navigator !== "undefined") {
    const lang = navigator.language?.toLowerCase() ?? ""
    if (lang.startsWith("pt")) return "pt"
  }
  return DEFAULT_LANGUAGE
}

export { detectBrowserLanguage }
