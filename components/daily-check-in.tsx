"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { getCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"
import { levelService } from "@/services/level-service"

interface CheckInData {
  date: string
  points: number
  streak: number
}

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
}

export function DailyCheckIn() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState(getTranslations("en"))
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [checkInHistory, setCheckInHistory] = useState<CheckInData[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeUntilNextCheckIn, setTimeUntilNextCheckIn] = useState<TimeRemaining>({ hours: 0, minutes: 0, seconds: 0 })

  // Carregar idioma e traduções
  useEffect(() => {
    const lang = getCurrentLanguage()
    setCurrentLanguage(lang)
    setTranslations(getTranslations(lang))

    // Escutar mudanças de idioma
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setCurrentLanguage(newLang)
      setTranslations(getTranslations(newLang))
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  // Carregar dados do localStorage
  useEffect(() => {
    loadCheckInData()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!hasCheckedInToday) return

    const updateCountdown = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const timeDiff = tomorrow.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setHasCheckedInToday(false)
        setTimeUntilNextCheckIn({ hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      setTimeUntilNextCheckIn({ hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [hasCheckedInToday])

  const loadCheckInData = () => {
    try {
      const savedHistory = localStorage.getItem("tpf_checkin_history")

      if (savedHistory) {
        const history: CheckInData[] = JSON.parse(savedHistory)
        setCheckInHistory(history)

        // Verificar se já fez check-in hoje
        const today = new Date().toDateString()
        const todayCheckIn = history.find((item) => new Date(item.date).toDateString() === today)
        setHasCheckedInToday(!!todayCheckIn)
      }
    } catch (error) {
      console.error("Error loading check-in data:", error)
    }
  }

  const handleCheckIn = () => {
    if (hasCheckedInToday || isAnimating) return

    setIsAnimating(true)

    const today = new Date()
    const newCheckIn: CheckInData = {
      date: today.toISOString(),
      points: 1,
      streak: checkInHistory.length + 1,
    }

    const updatedHistory = [...checkInHistory, newCheckIn]

    // Adicionar XP do check-in
    levelService.addCheckInXP()

    // Atualizar estados
    setCheckInHistory(updatedHistory)
    setHasCheckedInToday(true)

    // Salvar no localStorage
    try {
      localStorage.setItem("tpf_checkin_history", JSON.stringify(updatedHistory))
    } catch (error) {
      console.error("Error saving check-in data:", error)
    }

    // Parar animação após 2 segundos
    setTimeout(() => {
      setIsAnimating(false)
    }, 2000)
  }

  const formatCountdown = (time: TimeRemaining): string => {
    const { hours, minutes, seconds } = time
    const h = translations.dailyCheckIn?.hours || "h"
    const m = translations.dailyCheckIn?.minutes || "m"
    const s = translations.dailyCheckIn?.seconds || "s"

    return `${hours.toString().padStart(2, "0")}${h} ${minutes.toString().padStart(2, "0")}${m} ${seconds.toString().padStart(2, "0")}${s}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-3 relative overflow-hidden"
    >
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">{translations.dailyCheckIn?.title || "Daily Check-in"}</h3>
        </div>
      </div>

      {/* Countdown Timer compacto com segundos */}
      {hasCheckedInToday && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-3 p-2 bg-gray-700/30 rounded border border-gray-600/30"
        >
          <div className="flex items-center justify-center gap-2 text-center">
            <Clock className="w-3 h-3 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">
                {translations.dailyCheckIn?.nextCheckIn || "Next check-in in:"}
              </div>
              <div className="text-sm font-mono font-bold text-blue-400">
                {timeUntilNextCheckIn.hours === 0 &&
                timeUntilNextCheckIn.minutes === 0 &&
                timeUntilNextCheckIn.seconds === 0
                  ? translations.dailyCheckIn?.availableNow || "Available now!"
                  : formatCountdown(timeUntilNextCheckIn)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Check-in Button compacto */}
      <motion.button
        onClick={handleCheckIn}
        disabled={hasCheckedInToday || isAnimating}
        whileHover={!hasCheckedInToday && !isAnimating ? { scale: 1.02 } : {}}
        whileTap={!hasCheckedInToday && !isAnimating ? { scale: 0.98 } : {}}
        className={`w-full py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
          hasCheckedInToday
            ? "bg-green-600/50 text-green-200 cursor-not-allowed"
            : isAnimating
              ? "bg-blue-600 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25"
        }`}
      >
        <AnimatePresence mode="wait">
          {isAnimating ? (
            <motion.div
              key="animating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
              />
              {translations.dailyCheckIn?.checkInSuccess || "Check-in completed!"}
            </motion.div>
          ) : hasCheckedInToday ? (
            <motion.span key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              ✅ {translations.dailyCheckIn?.alreadyCheckedIn || "Already checked in today!"}
            </motion.span>
          ) : (
            <motion.span key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {translations.dailyCheckIn?.checkInButton || "Check In"}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating animation for points */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -30, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute top-2 right-2 text-green-400 font-bold text-sm pointer-events-none"
          >
            +1 XP
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
