"use client"
import { ArrowLeft } from "lucide-react"
import { TokenomicsExplainer } from "@/components/tokenomics-explainer"
import { LiveTradingSimulator } from "@/components/live-trading-simulator"
import { useState, useEffect } from "react"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface AnalysisLearnPageProps {
  onBack: () => void
  userAddress: string
}

export const AnalysisLearnPage = ({ onBack, userAddress }: AnalysisLearnPageProps) => {
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [t, setT] = useState(getTranslations(language).learn || {})

  useEffect(() => {
    // Set initial language
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)
    setT(getTranslations(currentLang).learn || {})

    // Add listener for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setT(getTranslations(newLang).learn || {})
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  return (
    <div className="fixed inset-0 dark-bg flex flex-col p-3 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold metallic-title">{t.title || "Learn"}</h1>
        <div></div>
      </div>

      <div className="flex-1">
        <TokenomicsExplainer />
        <LiveTradingSimulator />
      </div>
    </div>
  )
}
