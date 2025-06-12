"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Trophy, Clock, Gamepad2, Copy, Check } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type EventType = "topHolders" | "snakeRegistration" | "snakeTournament" | "none"

interface EventInfo {
  type: EventType
  title: string
  description: string
  endDate: Date
  icon: React.ReactNode
  color: string
}

export function EventCountdownBadge() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [currentEvent, setCurrentEvent] = useState<EventInfo | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [addressCopied, setAddressCopied] = useState(false)
  const [translations, setTranslations] = useState(getTranslations("en"))

  // Endereço para inscrição no torneio
  const registrationAddress = "0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677"

  useEffect(() => {
    const lang = getCurrentLanguage()
    setTranslations(getTranslations(lang))
  }, [])

  // Definir eventos com suas datas CORRETAS (ordenados por prioridade/data)
  const events: EventInfo[] = [
    {
      type: "topHolders",
      title: "Top 10 Event",
      description: "10% Bonus for Top Holders",
      endDate: new Date("2025-06-09T23:59:59Z"), // Termina dia 9 de junho
      icon: <Trophy className="w-4 h-4 text-white" />,
      color: "from-yellow-500 to-orange-600",
    },
    {
      type: "snakeRegistration",
      title: "Tournament Registration",
      description: "Send 200000 TPF to register",
      endDate: new Date("2025-06-15T23:59:59Z"), // Termina dia 15 de junho
      icon: <Gamepad2 className="w-4 h-4 text-white" />,
      color: "from-green-500 to-emerald-600",
    },
    {
      type: "snakeTournament",
      title: "Snake Game Tournament",
      description: "Get highest score to win",
      endDate: new Date("2025-07-09T23:59:59Z"), // Termina dia 9 de julho
      icon: <Gamepad2 className="w-4 h-4 text-white" />,
      color: "from-purple-500 to-pink-600",
    },
  ]

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()

      // Encontrar o próximo evento ativo (que ainda não terminou)
      let activeEvent: EventInfo | null = null

      // Ordenar eventos por data de término para pegar o próximo
      const sortedEvents = [...events].sort((a, b) => a.endDate.getTime() - b.endDate.getTime())

      for (const event of sortedEvents) {
        if (now < event.endDate) {
          activeEvent = event
          break
        }
      }

      // Se não há eventos ativos, não mostrar nada
      if (!activeEvent) {
        setCurrentEvent(null)
        return
      }

      // Se mudou de evento, atualizar
      if (!currentEvent || currentEvent.type !== activeEvent.type) {
        setCurrentEvent(activeEvent)
        console.log(`🎯 Evento ativo mudou para: ${activeEvent.type}`)
      }

      const timeDiff = activeEvent.endDate.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        // Forçar uma nova verificação na próxima execução
        setTimeout(updateCountdown, 1000)
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
  }, [currentEvent]) // Dependência do currentEvent para reagir a mudanças

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

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(registrationAddress)
      setAddressCopied(true)
      setTimeout(() => setAddressCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy address:", err)
    }
  }

  const renderTooltipContent = () => {
    if (!currentEvent) return null

    switch (currentEvent.type) {
      case "topHolders":
        return (
          <div className="text-left">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span className="font-bold text-yellow-400">{currentEvent.title}</span>
            </div>
            <div className="text-gray-300 mb-1">{currentEvent.description}</div>
            <div className="flex items-center gap-1 text-orange-400">
              <Clock className="w-3 h-3" />
              <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-gray-400 text-xs mt-1">remaining</div>
          </div>
        )

      case "snakeRegistration":
        return (
          <div className="text-left max-w-xs">
            <div className="flex items-center gap-1 mb-2">
              <Gamepad2 className="w-3 h-3 text-green-400" />
              <span className="font-bold text-green-400">{currentEvent.title}</span>
            </div>
            <div className="text-gray-300 mb-2 text-xs">{currentEvent.description}</div>

            <div className="mb-2">
              <div className="text-gray-400 text-xs mb-1">Registration address:</div>
              <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1">
                <span className="text-xs font-mono text-gray-300 truncate">
                  {registrationAddress.slice(0, 10)}...{registrationAddress.slice(-6)}
                </span>
                <button onClick={copyAddress} className="flex-shrink-0 p-1 hover:bg-gray-700 rounded">
                  {addressCopied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              </div>
              {addressCopied && <div className="text-green-400 text-xs mt-1">Address copied!</div>}
            </div>

            <div className="flex items-center gap-1 text-green-400">
              <Clock className="w-3 h-3" />
              <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-gray-400 text-xs mt-1">remaining</div>
          </div>
        )

      case "snakeTournament":
        return (
          <div className="text-left max-w-xs">
            <div className="flex items-center gap-1 mb-2">
              <Gamepad2 className="w-3 h-3 text-purple-400" />
              <span className="font-bold text-purple-400">{currentEvent.title}</span>
            </div>
            <div className="text-gray-300 mb-2 text-xs">{currentEvent.description}</div>

            <div className="mb-2">
              <div className="text-gray-400 text-xs mb-1">Instructions:</div>
              <div className="text-gray-300 text-xs space-y-1">
                <div>• Get highest score in snake game</div>
                <div>• Send screenshot to support email</div>
                <div>• Only one submission allowed</div>
                <div>• Prize shared if tied</div>
              </div>
            </div>

            <div className="mb-2">
              <div className="text-gray-400 text-xs mb-1">Email:</div>
              <div className="text-xs font-mono text-blue-300">support@tradepulsetoken.com</div>
            </div>

            <div className="flex items-center gap-1 text-purple-400">
              <Clock className="w-3 h-3" />
              <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
            <div className="text-gray-400 text-xs mt-1">remaining</div>
          </div>
        )

      default:
        return null
    }
  }

  if (!currentEvent) {
    return null
  }

  return (
    <div className="relative">
      <motion.div
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentEvent.color} border-2 border-white/20 flex items-center justify-center cursor-pointer shadow-lg`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(255, 255, 255, 0.4)",
            "0 0 0 8px rgba(255, 255, 255, 0)",
            "0 0 0 0 rgba(255, 255, 255, 0)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        {currentEvent.icon}

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
          className="absolute top-full right-0 mt-2 z-50"
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 min-w-max">
            {renderTooltipContent()}
            {/* Seta do tooltip - no canto direito */}
            <div className="absolute bottom-full right-3">
              <div className="border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
