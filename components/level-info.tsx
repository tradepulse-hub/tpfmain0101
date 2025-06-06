"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { levelService } from "@/services/level-service"
import { LevelBadge } from "./level-badge"
import { getCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"

interface LevelInfoProps {
  tpfBalance: number
  isOpen: boolean
  onClose: () => void
}

export function LevelInfo({ tpfBalance, isOpen, onClose }: LevelInfoProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState(getTranslations("en"))
  const [levelInfo, setLevelInfo] = useState(levelService.getUserLevelInfo(tpfBalance))

  // Carregar idioma e traduções
  useEffect(() => {
    const lang = getCurrentLanguage()
    setCurrentLanguage(lang)
    setTranslations(getTranslations(lang))

    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setCurrentLanguage(newLang)
      setTranslations(getTranslations(newLang))
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  // Atualizar informações do nível quando o saldo mudar
  useEffect(() => {
    setLevelInfo(levelService.getUserLevelInfo(tpfBalance))
  }, [tpfBalance])

  // Escutar atualizações de XP
  useEffect(() => {
    const handleXPUpdate = () => {
      setLevelInfo(levelService.getUserLevelInfo(tpfBalance))
    }

    window.addEventListener("xp_updated", handleXPUpdate)
    return () => window.removeEventListener("xp_updated", handleXPUpdate)
  }, [tpfBalance])

  if (!isOpen) return null

  const { level, totalXP, currentLevelXP, nextLevelXP, rewardMultiplier, progressPercentage } = levelInfo
  const levelColor = levelService.getLevelColor(level)
  const levelIcon = levelService.getLevelIcon(level)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LevelBadge level={level} size="large" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {translations.level?.title || "Level"} {level}
              </h2>
              <p className="text-gray-400 text-sm">
                {levelIcon} {translations.level?.multiplier || "Multiplier"}: {rewardMultiplier.toFixed(2)}x
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{translations.level?.progress || "Progress"}</span>
            <span>
              {currentLevelXP} / {nextLevelXP} XP
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-center text-xs text-gray-500 mt-1">
            {progressPercentage.toFixed(1)}% {translations.level?.toNextLevel || "to next level"}
          </div>
        </div>

        {/* XP Sources */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-3">{translations.level?.xpSources || "XP Sources"}</h3>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">{translations.level?.dailyCheckIn || "Daily Check-in"}</span>
              <span className="text-green-400 font-medium">+10 XP</span>
            </div>
            <div className="text-xs text-gray-500">
              {translations.level?.checkInXP || "Current check-in XP"}: {levelService.getCheckInXP()} XP
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">{translations.level?.tpfHolding || "TPF Holding"}</span>
              <span className="text-blue-400 font-medium">1 TPF = 0.001 XP</span>
            </div>
            <div className="text-xs text-gray-500">
              {translations.level?.currentBalance || "Current balance"}: {tpfBalance.toLocaleString()} TPF ={" "}
              {Math.floor(tpfBalance * 0.001)} XP
            </div>
          </div>
        </div>

        {/* Total XP */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-white">{translations.level?.totalXP || "Total XP"}</span>
            <span className="text-xl font-bold" style={{ color: levelColor }}>
              {totalXP.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* Level Benefits */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
          <div className="text-sm text-center text-gray-300">
            <span className="font-medium text-white">{translations.level?.levelBenefits || "Level Benefits"}:</span>
            <br />
            {rewardMultiplier.toFixed(2)}x {translations.level?.eventRewards || "event rewards multiplier"}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
