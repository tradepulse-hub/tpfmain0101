"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getCurrentLanguage } from "@/lib/i18n"

interface GameLoadingScreenProps {
  onLoadComplete: () => void
  gameName: string
  gameImage?: string
}

function GameLoadingScreen({ onLoadComplete, gameName, gameImage }: GameLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [language, setLanguage] = useState<"en" | "pt">("en")

  useEffect(() => {
    setLanguage(getCurrentLanguage())

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + Math.random() * 10
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            onLoadComplete()
          }, 500)
          return 100
        }
        return newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [onLoadComplete])

  const developedByText = language === "pt" ? "Desenvolvido por TPulseFi" : "Developed by TPulseFi"
  const loadingText = language === "pt" ? "Carregando" : "Loading"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-6"
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Título do jogo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-xl font-bold text-white"
        >
          {gameName}
        </motion.div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
          <motion.div
            className="bg-blue-500 h-2.5 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Texto de carregamento e desenvolvedor */}
        <div className="flex justify-between w-full text-sm text-gray-400">
          <span>
            {loadingText}... {Math.round(progress)}%
          </span>
          <span>{developedByText}</span>
        </div>
      </div>
    </motion.div>
  )
}

export { GameLoadingScreen }
export default GameLoadingScreen
