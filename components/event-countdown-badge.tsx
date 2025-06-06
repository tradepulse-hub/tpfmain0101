"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Trophy, Clock } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function EventCountdownBadge() {
  const { t } = useTranslation()
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isEventActive, setIsEventActive] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)

  // Data do fim do evento - 9 de junho de 2025
  const eventEndDate = new Date("2025-06-09T23:59:59Z")

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const timeDiff = eventEndDate.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setIsEventActive(false)
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (time: TimeRemaining): string => {
    const { days, hours, minutes, seconds } = time

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m ${seconds}s`
    }
  }

  if (!isEventActive) {
    return null
  }

  return (
    <div className="relative">
      <motion.div
        className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 border-2 border-yellow-400/50 flex items-center justify-center cursor-pointer shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(251, 191, 36, 0.7)",
            "0 0 0 8px rgba(251, 191, 36, 0)",
            "0 0 0 0 rgba(251, 191, 36, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <Trophy className="w-4 h-4 text-white" />

        {/* Efeito de brilho */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 3,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 min-w-max">
            <div className="text-center">
              <div className="flex items-center gap-1 mb-1">
                <Trophy className="w-3 h-3 text-yellow-400" />
                <span className="font-bold text-yellow-400">Top 10 Event</span>
              </div>
              <div className="text-gray-300 mb-1">10% Bonus for Top Holders</div>
              <div className="flex items-center gap-1 text-orange-400">
                <Clock className="w-3 h-3" />
                <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
              <div className="text-gray-400 text-xs mt-1">remaining</div>
            </div>
            {/* Seta do tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
