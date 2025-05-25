"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getCurrentLanguage, setCurrentLanguage, type Language } from "@/lib/i18n"

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>("en")
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Carregar idioma atual
    setCurrentLang(getCurrentLanguage())

    // Adicionar listener para mudanças de idioma
    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)

    // Fechar o dropdown ao clicar fora dele
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
    setIsOpen(false)
  }

  // Obter informações do idioma atual
  const getLanguageInfo = (lang: Language) => {
    switch (lang) {
      case "en":
        return { name: "English", flag: "🇺🇸" }
      case "pt":
        return { name: "Português", flag: "🇧🇷" }
      case "es":
        return { name: "Español", flag: "🇪🇸" }
      default:
        return { name: "English", flag: "🇺🇸" }
    }
  }

  const currentLanguageInfo = getLanguageInfo(currentLang)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <span className="text-lg">{currentLanguageInfo.flag}</span>
        <span className="text-sm text-gray-300">{currentLanguageInfo.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
          >
            {["en", "pt", "es"].map((lang) => {
              const langInfo = getLanguageInfo(lang as Language)
              return (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang as Language)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-700 ${
                    currentLang === lang ? "bg-gray-700" : ""
                  } ${lang === "en" ? "rounded-t-lg" : ""} ${lang === "es" ? "rounded-b-lg" : ""}`}
                >
                  <span className="text-lg">{langInfo.flag}</span>
                  <span className="text-sm text-gray-300">{langInfo.name}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
