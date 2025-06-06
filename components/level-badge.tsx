"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { levelService } from "@/services/level-service"

interface LevelBadgeProps {
  level: number
  size?: "small" | "medium" | "large"
  showTooltip?: boolean
  className?: string
}

export function LevelBadge({ level, size = "small", showTooltip = false, className = "" }: LevelBadgeProps) {
  const [showTooltipState, setShowTooltipState] = useState(false)

  const sizeClasses = {
    small: "w-6 h-6 text-xs",
    medium: "w-8 h-8 text-sm",
    large: "w-10 h-10 text-base",
  }

  const levelColor = levelService.getLevelColor(level)
  const levelIcon = levelService.getLevelIcon(level)
  const rewardMultiplier = levelService.getRewardMultiplier(level)

  return (
    <div className="relative">
      <motion.div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex items-center justify-center 
          font-bold text-white 
          shadow-lg 
          border-2 border-white/20
          cursor-pointer
          ${className}
        `}
        style={{
          background: `linear-gradient(135deg, ${levelColor}, ${levelColor}dd)`,
        }}
        whileHover={{ scale: showTooltip ? 1.1 : 1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => showTooltip && setShowTooltipState(false)}
        onClick={() => setShowTooltipState(!showTooltipState)}
      >
        {size === "small" ? level : `${levelIcon}`}

        {/* Efeito de brilho */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${levelColor}40, transparent, transparent)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </motion.div>

      {showTooltip && showTooltipState && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.8 }}
          className="absolute bottom-full right-0 transform mb-2 z-50"
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 shadow-xl border border-gray-700 min-w-max">
            <div className="text-center">
              <div className="font-bold text-xs mb-1">
                {levelIcon} Level {level}
              </div>
              <div className="text-gray-300 text-xs">Multiplier: {rewardMultiplier.toFixed(2)}x</div>
            </div>
            {/* Seta do tooltip ajustada */}
            <div className="absolute top-full right-2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
