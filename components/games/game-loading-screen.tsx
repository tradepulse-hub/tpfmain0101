"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface GameLoadingScreenProps {
  onLoadComplete: () => void
  gameName: string
  gameImage?: string
}

export const GameLoadingScreen = ({ onLoadComplete, gameName, gameImage }: GameLoadingScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Loading...")

  useEffect(() => {
    const loadingTexts = [
      "Loading game assets...",
      "Initializing graphics...",
      "Setting up game world...",
      "Almost ready...",
      "Get ready to play!",
    ]

    let currentTextIndex = 0
    let currentProgress = 0

    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5
      if (currentProgress >= 100) {
        currentProgress = 100
        setProgress(100)
        setLoadingText("Ready!")
        clearInterval(interval)
        setTimeout(() => {
          onLoadComplete()
        }, 500)
      } else {
        setProgress(currentProgress)
        if (currentProgress > (currentTextIndex + 1) * 20) {
          currentTextIndex = Math.min(currentTextIndex + 1, loadingTexts.length - 1)
          setLoadingText(loadingTexts[currentTextIndex])
        }
      }
    }, 200)

    return () => clearInterval(interval)
  }, [onLoadComplete])

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        {/* Game Image */}
        {gameImage && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <img
              src={gameImage || "/placeholder.svg"}
              alt={gameName}
              className="w-24 h-24 mx-auto rounded-lg shadow-lg"
            />
          </motion.div>
        )}

        {/* Game Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-8"
        >
          {gameName}
        </motion.h1>

        {/* Loading Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="w-full h-2 bg-gray-300 rounded-full overflow-hidden relative"
        >
          <motion.div
            className="absolute left-0 top-0 h-full bg-green-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white mt-4"
        >
          {loadingText}
        </motion.p>
      </motion.div>
    </div>
  )
}
