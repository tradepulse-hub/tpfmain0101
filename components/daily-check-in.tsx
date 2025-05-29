"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Calendar, Flame, ChevronDown, ChevronUp } from "lucide-react"
import { getCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"

interface CheckInData {
  date: string
  points: number
  streak: number
}

export function DailyCheckIn() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState(getTranslations("en"))
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [checkInHistory, setCheckInHistory] = useState<CheckInData[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

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

  const loadCheckInData = () => {
    try {
      const savedHistory = localStorage.getItem("tpf_checkin_history")
      const savedPoints = localStorage.getItem("tpf_total_points")
      const savedStreak = localStorage.getItem("tpf_current_streak")

      if (savedHistory) {
        const history: CheckInData[] = JSON.parse(savedHistory)
        setCheckInHistory(history)

        // Verificar se já fez check-in hoje
        const today = new Date().toDateString()
        const todayCheckIn = history.find((item) => new Date(item.date).toDateString() === today)
        setHasCheckedInToday(!!todayCheckIn)
      }

      if (savedPoints) {
        setTotalPoints(Number.parseInt(savedPoints))
      }

      if (savedStreak) {
        setCurrentStreak(Number.parseInt(savedStreak))
      }
    } catch (error) {
      console.error("Error loading check-in data:", error)
    }
  }

  const calculateStreak = (history: CheckInData[]): number => {
    if (history.length === 0) return 0

    // Ordenar por data (mais recente primeiro)
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedHistory.length; i++) {
      const checkInDate = new Date(sortedHistory[i].date)
      checkInDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)

      if (checkInDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const handleCheckIn = () => {
    if (hasCheckedInToday || isAnimating) return

    setIsAnimating(true)

    const today = new Date()
    const newPoints = totalPoints + 1
    const newCheckIn: CheckInData = {
      date: today.toISOString(),
      points: 1,
      streak: currentStreak + 1,
    }

    const updatedHistory = [...checkInHistory, newCheckIn]
    const newStreak = calculateStreak(updatedHistory)

    // Atualizar estados
    setTotalPoints(newPoints)
    setCurrentStreak(newStreak)
    setCheckInHistory(updatedHistory)
    setHasCheckedInToday(true)

    // Salvar no localStorage
    try {
      localStorage.setItem("tpf_total_points", newPoints.toString())
      localStorage.setItem("tpf_current_streak", newStreak.toString())
      localStorage.setItem("tpf_checkin_history", JSON.stringify(updatedHistory))
    } catch (error) {
      console.error("Error saving check-in data:", error)
    }

    // Parar animação após 2 segundos
    setTimeout(() => {
      setIsAnimating(false)
    }, 2000)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    if (date.getTime() === today.getTime()) {
      return translations.dailyCheckIn?.today || "Today"
    } else if (date.getTime() === yesterday.getTime()) {
      return translations.dailyCheckIn?.yesterday || "Yesterday"
    } else {
      const diffTime = today.getTime() - date.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `${diffDays} ${translations.dailyCheckIn?.daysAgo || "days ago"}`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{translations.dailyCheckIn?.title || "Daily Check-in"}</h3>
        </div>
        <div className="flex items-center gap-1 text-orange-400">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-medium">
            {currentStreak} {translations.dailyCheckIn?.days || "days"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{totalPoints}</div>
          <div className="text-xs text-gray-400">{translations.dailyCheckIn?.totalPoints || "Total points"}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400">{currentStreak}</div>
          <div className="text-xs text-gray-400">{translations.dailyCheckIn?.streak || "Streak"}</div>
        </div>
      </div>

      {/* Check-in Button */}
      <motion.button
        onClick={handleCheckIn}
        disabled={hasCheckedInToday || isAnimating}
        whileHover={!hasCheckedInToday && !isAnimating ? { scale: 1.02 } : {}}
        whileTap={!hasCheckedInToday && !isAnimating ? { scale: 0.98 } : {}}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
          hasCheckedInToday
            ? "bg-green-600/50 text-green-200 cursor-not-allowed"
            : isAnimating
              ? "bg-blue-600 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
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
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              {translations.dailyCheckIn?.checkInSuccess || "Check-in completed! +1 point"}
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

      {/* History Toggle */}
      {checkInHistory.length > 0 && (
        <motion.button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          {showHistory
            ? translations.dailyCheckIn?.hideHistory || "Hide history"
            : translations.dailyCheckIn?.showHistory || "Show history"}
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </motion.button>
      )}

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 border-t border-gray-700/50 pt-3"
          >
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              {translations.dailyCheckIn?.history || "History"}
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {checkInHistory.length === 0 ? (
                <p className="text-xs text-gray-500">{translations.dailyCheckIn?.noHistory || "No check-ins yet"}</p>
              ) : (
                [...checkInHistory]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((checkIn, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{formatDate(checkIn.date)}</span>
                      <span className="text-green-400">
                        +{checkIn.points} {translations.dailyCheckIn?.points || "points"}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating animation for points */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute top-4 right-4 text-green-400 font-bold text-lg pointer-events-none"
          >
            +1
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
