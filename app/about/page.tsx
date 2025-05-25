"use client"

import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import Image from "next/image"
import { useState, useEffect } from "react"
import { getCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"

// Tokenomics data for the chart
const tokenomicsData = [
  { name: "Liquidez", value: 40, color: "#3b82f6" },
  { name: "Staking", value: 25, color: "#8b5cf6" },
  { name: "Equipe", value: 15, color: "#ec4899" },
  { name: "Marketing", value: 10, color: "#10b981" },
  { name: "Reserva", value: 10, color: "#f59e0b" },
]

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"about" | "roadmap" | "tokenomics">("about")
  const [language, setLanguage] = useState<Language>("en")
  const [t, setT] = useState(getTranslations("en").about || {})

  useEffect(() => {
    // Set initial language
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)
    setT(getTranslations(currentLang).about || {})

    // Add listener for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setT(getTranslations(newLang).about || {})
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Tradução dos nomes dos segmentos do gráfico de tokenomics
  const getLocalizedTokenomicsData = () => {
    if (language === "pt") {
      return [
        { name: "Liquidez", value: 40, color: "#3b82f6" },
        { name: "Staking", value: 25, color: "#8b5cf6" },
        { name: "Equipe", value: 15, color: "#ec4899" },
        { name: "Marketing", value: 10, color: "#10b981" },
        { name: "Reserva", value: 10, color: "#f59e0b" },
      ]
    } else {
      return [
        { name: "Liquidity", value: 40, color: "#3b82f6" },
        { name: "Staking", value: 25, color: "#8b5cf6" },
        { name: "Team", value: 15, color: "#ec4899" },
        { name: "Marketing", value: 10, color: "#10b981" },
        { name: "Reserve", value: 10, color: "#f59e0b" },
      ]
    }
  }

  const localizedTokenomicsData = getLocalizedTokenomicsData()

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      {/* Background effects */}
      <BackgroundEffect />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col w-full max-w-md px-4"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
              {t.title || "About Us"}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t.subtitle || "Learn about the TPulseFi project"}</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/30 p-1 mb-6">
          {[
            { id: "about", label: t.about || "About" },
            { id: "roadmap", label: t.roadmap || "Roadmap" },
            { id: "tokenomics", label: t.tokenomics || "Tokenomics" },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex-1 py-2 text-sm rounded-lg ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* About Content */}
        {activeTab === "about" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden"
          >
            {/* Logo and intro */}
            <div className="p-6 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-24 h-24 relative mb-4"
              >
                <Image src="/logo-tpf.png" alt="TPulseFi Logo" width={96} height={96} className="w-full h-full" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl -z-10"
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mb-2"
              >
                TPulseFi
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 text-sm leading-relaxed"
              >
                {language === "pt"
                  ? "TPulseFi é um projeto DeFi que se designa à valorização a longo prazo no mercado, e recompensa os seus usuários com airdrops diários."
                  : "TPulseFi is a DeFi project designed for long-term market appreciation, rewarding its users with daily airdrops."}
              </motion.p>
            </div>

            {/* Features */}
            <div className="px-6 pb-6 space-y-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
              >
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 text-blue-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM6.262 6.072a8.25 8.25 0 1010.562-.766 4.5 4.5 0 01-1.318 1.357L14.25 7.5l.165.33a.809.809 0 01-1.086 1.085l-.604-.302a1.125 1.125 0 00-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 01-2.288 4.04l-.723.724a1.125 1.125 0 01-1.298.21l-.153-.076a1.125 1.125 0 01-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 01-.21-1.298L9.75 12l-1.64-1.64a6 6 0 01-1.676-3.257l-.172-1.03z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {t.whyChoose || "Why choose TPulseFi?"}
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.airdrops || "Daily Airdrops"}</strong> -
                      {language === "pt" ? "Recompensas para holders fiéis" : "Rewards for loyal holders"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.community || "Active Community"}</strong> -
                      {language === "pt" ? "Eventos e recompensas exclusivas" : "Exclusive events and rewards"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.utility || "Utility"}</strong> -
                      {language === "pt"
                        ? "Transfira, jogue e ganhe em um único ecossistema"
                        : "Transfer, play, and earn in a single ecosystem"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.longTerm || "Long-Term Vision"}</strong> -
                      {language === "pt" ? "Crescimento sustentável e inovação" : "Sustainable growth and innovation"}
                    </span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
              >
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <span className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 text-purple-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {t.growthStrategy || "Growth Strategy"}
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.marketing || "Marketing"}:</strong>
                      {language === "pt"
                        ? "Campanhas em redes sociais, parcerias com influenciadores"
                        : "Social media campaigns, influencer partnerships"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.incentives || "Incentives"}:</strong>
                      {language === "pt" ? "Mais airdrops e eventos" : "More airdrops and events"}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      <strong>{t.governance || "Governance"}:</strong>
                      {language === "pt"
                        ? "Futura DAO para tomada de decisões descentralizada"
                        : "Future DAO for decentralized decision-making"}
                    </span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Roadmap Content */}
        {activeTab === "roadmap" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden p-6"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-blue-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center mr-2 text-xs text-white">
                  ✓
                </span>
                {t.phase1 || "Phase 1"} ({t.phase1Completed || "Completed"})
              </h3>

              <div className="space-y-3 pl-8">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.tokenLaunch || "Token Launch"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Contrato implantado e verificado" : "Contract deployed and verified"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.websiteDocs || "Website and Documentation"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Site oficial e whitepaper" : "Official website and whitepaper"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.communityGrowth || "Community Growth"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Forte presença nas redes sociais" : "Strong social media presence"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.miniApp || "Mini-App (Worldcoin AppStore)"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Wallet, eventos e jogos" : "Wallet, events, and games"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.airdropCampaigns || "Airdrop Campaigns"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Recompensas diárias para holders" : "Daily rewards for holders"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.fiGames || "Fi Games"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "Múltiplos jogos integrados com DeFi"
                        : "Multiple games integrated with DeFi"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2 text-xs text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {t.phase2 || "Phase 2"} ({t.phase2Development || "In Development"})
              </h3>

              <div className="space-y-3 pl-8">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.fiStaking || "FiStaking (12% APY)"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Ganhe renda passiva" : "Earn passive income"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.pulseGame || "Pulse Game"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "Novo jogo integrado ao ecossistema"
                        : "New game integrated into the ecosystem"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.fiPay || "FiPay"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "Pagamentos crypto baseados em contato/câmera"
                        : "Contact/camera-based crypto payments"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.enhancedSecurity || "Enhanced Security"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "Auditorias e atualizações de smart contracts"
                        : "Audits and smart contract updates"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                <span className="w-6 h-6 rounded-full bg-purple-600/70 flex items-center justify-center mr-2 text-xs text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18a.75.75 0 01-.75-.75zm-8.962 3.712a.75.75 0 010 1.061l-1.591 1.591a.75.75 0 11-1.061-1.06l1.591-1.592a.75.75 0 011.06 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {t.phase3 || "Phase 3"} ({t.phase3Future || "Future Goals"})
              </h3>

              <div className="space-y-3 pl-8">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.exchangeListings || "Exchange Listings"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "CMC, CoinGecko e exchanges Tier-2/3"
                        : "CMC, CoinGecko, and Tier-2/3 exchanges"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">
                      {t.ecosystem || "TPulseFi Ecosystem Expansion"}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt" ? "Novos tokens e projetos paralelos" : "New tokens and parallel projects"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.partnerships || "Partnerships"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "Integrações com outros projetos DeFi/Wallet"
                        : "Integrations with other DeFi/Wallet projects"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <div className="text-white text-sm font-medium">{t.mobileApp || "Mobile App"}</div>
                    <div className="text-gray-400 text-xs">
                      {language === "pt"
                        ? "App TPulseFi dedicado além do Mini-App"
                        : "Dedicated TPulseFi app beyond the Mini-App"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tokenomics Content */}
        {activeTab === "tokenomics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                  <path
                    fillRule="evenodd"
                    d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                    clipRule="evenodd"
                  />
                  <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {language === "pt" ? "Tokenomics TPF" : "TPF Tokenomics"}
              </h2>
              <p className="text-gray-400 text-sm">
                {language === "pt"
                  ? "Supply Total: 1.000.000.000 (1 Bilhão)"
                  : "Total Supply: 1,000,000,000 (1 Billion)"}
              </p>
            </motion.div>

            {/* Tokenomics Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="grid grid-cols-1 gap-2 mb-4">
                {localizedTokenomicsData.map((segment, index) => (
                  <motion.div
                    key={segment.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gray-800/50 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center">
                      <div
                        className="h-12"
                        style={{
                          backgroundColor: segment.color,
                          width: `${segment.value}%`,
                        }}
                      />
                      <div className="absolute ml-4 flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.color }}></div>
                        <div className="text-sm">
                          <span className="text-white">{segment.name}</span>
                          <span className="text-gray-400 ml-1">({segment.value}%)</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 mt-6">
                <h3 className="text-white font-medium mb-2 text-center">
                  {language === "pt" ? "Distribuição de Tokens" : "Token Distribution"}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {localizedTokenomicsData.map((segment) => (
                    <div key={segment.name} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.color }}></div>
                      <div>
                        <span className="text-white">{segment.name}:</span>
                        <span className="text-gray-300 ml-1">{segment.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Token Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                <h3 className="text-white font-medium mb-2">
                  {language === "pt" ? "Detalhes do Token" : "Token Details"}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">{language === "pt" ? "Nome" : "Name"}</div>
                    <div className="text-white">TPulseFi</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{language === "pt" ? "Símbolo" : "Symbol"}</div>
                    <div className="text-white">TPF</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{language === "pt" ? "Rede" : "Network"}</div>
                    <div className="text-white">Worldchain</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{language === "pt" ? "Tipo" : "Type"}</div>
                    <div className="text-white">ERC-20</div>
                  </div>
                  <div>
                    <div className="text-gray-400">{language === "pt" ? "Decimais" : "Decimals"}</div>
                    <div className="text-white">18</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                <h3 className="text-white font-medium mb-2">
                  {language === "pt" ? "Vantagens para Holders" : "Holder Benefits"}
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <div className="text-white">{language === "pt" ? "Airdrops Diários" : "Daily Airdrops"}</div>
                      <div className="text-gray-400">
                        {language === "pt" ? "Recompensas automáticas para holders" : "Automatic rewards for holders"}
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <div className="text-white">{language === "pt" ? "Acesso Prioritário" : "Priority Access"}</div>
                      <div className="text-gray-400">
                        {language === "pt"
                          ? "Acesso antecipado a novos recursos e jogos"
                          : "Early access to new features and games"}
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-4.28 9.22a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69a.75.75 0 000-1.5h-5.69l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <div className="text-white">{language === "pt" ? "Governança" : "Governance"}</div>
                      <div className="text-gray-400">
                        {language === "pt"
                          ? "Participação em decisões futuras via DAO"
                          : "Participation in future decisions via DAO"}
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <motion.a
                href="https://worldcoin.org/mini-app?app_id=app_0d4b759921490adc1f2bd569fda9b53a&app_mode=mini-app"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
                </svg>
                {t.buyTPF || "Buy TPF"}
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom navigation */}
      <BottomNav activeTab="about" />
    </main>
  )
}
