"use client"

import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ExternalLink, ArrowUpRight } from "lucide-react"
import { getCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"

export default function PartnershipsPage() {
  const [currentLanguage, setLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState(getTranslations("en"))

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const lang = getCurrentLanguage()
    setLanguage(lang)
    setTranslations(getTranslations(lang))

    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setTranslations(getTranslations(newLang))
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  const handleHoldStationClick = () => {
    window.open(
      "https://worldcoin.org/mini-app?app_id=app_0d4b759921490adc1f2bd569fda9b53a&app_mode=mini-app",
      "_blank",
    )
  }

  const handleAstraCoinClick = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      {/* Background effects */}
      <BackgroundEffect />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full px-4"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
              {translations.partnerships?.title || "Partnerships"}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {translations.partnerships?.subtitle || "Our strategic partners"}
          </p>
        </motion.div>

        {/* Our Partners Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full space-y-4"
        >
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            {translations.partnerships?.ourPartners || "Our Partners"}
          </h2>

          {/* HoldStation Partnership Card */}
          <motion.div
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/30 p-6 cursor-pointer group"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleHoldStationClick}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />

            <div className="relative z-10">
              {/* HoldStation Logo */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <Image src="/holdstation-logo.jpg" alt="HoldStation" fill className="object-cover" />
                </div>
              </div>

              {/* Partnership Info */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center justify-center gap-2">
                  {translations.partnerships?.holdstationTitle || "HoldStation"}
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  {translations.partnerships?.holdstationDescription ||
                    "Advanced trading and swap platform for WorldChain"}
                </p>

                {/* Visit Button */}
                <motion.button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 group-hover:from-purple-500 group-hover:to-blue-500 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {translations.partnerships?.visitApp || "Visit App"}
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* AstraCoin Partnership Cards */}
          <div className="space-y-3">
            {/* AstraCoin App 1 */}
            <motion.div
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/30 p-4 cursor-pointer group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleAstraCoinClick(
                  "https://worldcoin.org/mini-app?app_id=app_f50d7c645d30623eb495a81d58b838e6&app_mode=mini-app",
                )
              }
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex items-center gap-4">
                {/* AstraCoin Logo */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/astracoin-logo.jpg" alt="AstraCoin" fill className="object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    AstraCoin
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    {translations.partnerships?.astracoinDescription || "Decentralized finance platform"}
                  </p>
                  <motion.div
                    className="bg-gradient-to-r from-orange-600 to-purple-600 text-white py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1 group-hover:from-orange-500 group-hover:to-purple-500 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    {translations.partnerships?.visitApp || "Visit App"}
                    <ArrowUpRight className="w-3 h-3" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* AstraCoin App 2 */}
            <motion.div
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/30 p-4 cursor-pointer group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                handleAstraCoinClick(
                  "https://worldcoin.org/mini-app?app_id=app_2db51f9f374e2c4ba8ebf1f132f96f52&app_mode=mini-app",
                )
              }
            >
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex items-center gap-4">
                {/* AstraCoin Logo */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/astracoin-logo.jpg" alt="AstraCoin" fill className="object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                    AstraCoin Pro
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    {translations.partnerships?.astracoinProDescription || "Advanced trading features"}
                  </p>
                  <motion.div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-1 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1 group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    {translations.partnerships?.visitApp || "Visit App"}
                    <ArrowUpRight className="w-3 h-3" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* More Partnerships Coming Soon */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/20 border-dashed p-6 text-center">
            <div className="text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {translations.partnerships?.morePartnerships || "More partnerships"}
              </h3>
              <p className="text-sm">{translations.partnerships?.comingSoon || "Coming soon..."}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom navigation */}
      <BottomNav activeTab="partnerships" />
    </main>
  )
}
