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
  const [levelInfo, setLevelInfo] = useState({
    level: 1,
    totalXP: 0,
    currentLevelXP: 0,
    nextLevelXP: 100,
    rewardMultiplier: 1.01,
    progressPercentage: 0,
  })

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

  // Calcular informações do nível quando o saldo mudar
  useEffect(() => {
    const checkInXP = levelService.getCheckInXP()
    const tpfXP = Math.floor(tpfBalance * 0.001)
    const totalXP = checkInXP + tpfXP
    const level = levelService.calculateLevel(totalXP)
    const currentLevelXP = levelService.getCurrentLevelXP(totalXP)
    const nextLevelXP = levelService.getXPForNextLevel(totalXP)
    const rewardMultiplier = levelService.getRewardMultiplier(level)
    const progressPercentage = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 100

    setLevelInfo({
      level,
      totalXP,
      currentLevelXP,
      nextLevelXP,
      rewardMultiplier,
      progressPercentage,
    })
  }, [tpfBalance])

  // Escutar atualizações de XP
  useEffect(() => {
    const handleXPUpdate = () => {
      const checkInXP = levelService.getCheckInXP()
      const tpfXP = Math.floor(tpfBalance * 0.001)
      const totalXP = checkInXP + tpfXP
      const level = levelService.calculateLevel(totalXP)
      const currentLevelXP = levelService.getCurrentLevelXP(totalXP)
      const nextLevelXP = levelService.getXPForNextLevel(totalXP)
      const rewardMultiplier = levelService.getRewardMultiplier(level)
      const progressPercentage = nextLevelXP > 0 ? (currentLevelXP / nextLevelXP) * 100 : 100

      setLevelInfo({
        level,
        totalXP,
        currentLevelXP,
        nextLevelXP,
        rewardMultiplier,
        progressPercentage,
      })
    }

    window.addEventListener("xp_updated", handleXPUpdate)
    return () => window.removeEventListener("xp_updated", handleXPUpdate)
  }, [tpfBalance])

  if (!isOpen) return null

  const { level, totalXP, currentLevelXP, nextLevelXP, rewardMultiplier, progressPercentage } = levelInfo
  const levelColor = levelService.getLevelColor(level)
  const levelIcon = levelService.getLevelIcon(level)
  const checkInXP = levelService.getCheckInXP()
  const tpfXP = Math.floor(tpfBalance * 0.001)

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
        className="bg-gray-800 rounded-xl p-4 max-w-sm w-full border border-gray-700 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LevelBadge level={level} size="medium" />
            <div>
              <h2 className="text-lg font-bold text-white">
                {translations.level?.title || "Level"} {level}
              </h2>
              <p className="text-gray-400 text-xs">
                {levelIcon} {rewardMultiplier.toFixed(2)}x
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar compacta */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{translations.level?.progress || "Progress"}</span>
            <span>
              {currentLevelXP} / {nextLevelXP} XP
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
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

        {/* XP Sources compactas */}
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-semibold text-white">{translations.level?.xpSources || "XP Sources"}</h3>

          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{translations.level?.dailyCheckIn || "Daily Check-in"}</span>
              <span className="text-green-400 font-medium">+10 XP</span>
            </div>
            <div className="text-xs text-gray-500">
              {translations.level?.checkInXP || "Current"}: {checkInXP} XP
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">{translations.level?.tpfHolding || "TPF Holding"}</span>
              <span className="text-blue-400 font-medium text-xs">0.001 XP/TPF</span>
            </div>
            <div className="text-xs text-gray-500">
              {tpfBalance.toLocaleString()} TPF = {tpfXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* Total XP compacto */}
        <div className="mb-3 pt-2 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-white">{translations.level?.totalXP || "Total XP"}</span>
            <span className="text-lg font-bold" style={{ color: levelColor }}>
              {totalXP.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Level Benefits compacto */}
        <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30">
          <div className="text-xs text-center text-gray-300">
            <span className="font-medium text-white">{translations.level?.levelBenefits || "Benefits"}:</span>{" "}
            {rewardMultiplier.toFixed(2)}x {translations.level?.eventRewards || "event rewards"}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
