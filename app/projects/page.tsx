"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ExternalLink, ArrowUpRight } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

export default function ProjectsPage() {
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()))

  useEffect(() => {
    const handleLanguageChange = () => {
      setTranslations(getTranslations(getCurrentLanguage()))
    }

    handleLanguageChange()
    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  const handleBuyTPL = () => {
    window.open(
      "https://worldcoin.org/mini-app?app_id=app_15daccf5b7d4ec9b7dbba044a8fdeab5&path=app/token/0xf11Dd4551A334A0Bb3CD9A6C7c5eCfb14D09C2b4",
      "_blank",
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900/40 to-black/60" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-8 pb-20">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {translations.projects?.title || "Projects"}
          </h1>
          <p className="text-gray-300 text-sm">
            {translations.projects?.subtitle || "Explore our projects and tokens"}
          </p>
        </motion.div>

        {/* TPulseLink Token Card */}
        <motion.div
          className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-700/30 p-6 mb-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Background shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.8 }}
          />

          {/* Token Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-gray-600/20">
                <Image
                  src="/tpulselink-logo.png"
                  alt="TPulseLink Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{translations.projects?.tpulselink || "TPulseLink"}</h3>
                <p className="text-gray-400 text-sm">{translations.projects?.symbol || "TPL"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Active</span>
            </div>
          </div>

          {/* Token Description */}
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            {translations.projects?.description || "TPulseFi ecosystem connectivity token"}
          </p>

          {/* Token Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/20">
              <p className="text-gray-400 text-xs mb-1">Network</p>
              <p className="text-white font-medium">Worldchain</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/20">
              <p className="text-gray-400 text-xs mb-1">Type</p>
              <p className="text-white font-medium">ERC-20</p>
            </div>
          </div>

          {/* Buy Button */}
          <motion.button
            onClick={handleBuyTPL}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{translations.projects?.buyToken || "Buy Token"}</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </motion.button>

          {/* External link indicator */}
          <div className="flex items-center justify-center mt-3 space-x-1">
            <ExternalLink className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500 text-xs">Opens in Worldcoin App</span>
          </div>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-700/20 p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-600/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-gray-400"
            >
              <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">More Projects Coming Soon</h3>
          <p className="text-gray-500 text-sm">
            We're working on exciting new projects that will expand the TPulseFi ecosystem. Stay tuned for updates!
          </p>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="projects" />
    </div>
  )
}
