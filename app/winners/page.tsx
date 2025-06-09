"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Trophy, Calendar, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface Winner {
  id: string
  name: string
  fullAddress: string
  event: string
  date: string
  amount: number
  position: number
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const router = useRouter()
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState(getTranslations("en").winners || {})

  useEffect(() => {
    const updateLanguage = () => {
      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)
      setTranslations(getTranslations(currentLang).winners || {})
    }

    updateLanguage()
    window.addEventListener("languageChange", updateLanguage)

    return () => {
      window.removeEventListener("languageChange", updateLanguage)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const savedAddress = localStorage.getItem("walletAddress")
      if (!savedAddress) {
        router.push("/")
        return
      }

      setTimeout(() => {
        const winnersData: Winner[] = [
          {
            id: "1",
            name: "0x5533...631A",
            fullAddress: "0x5533474ee4827780C3EF9eE98f6b83a4f9c0631A",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 1314776.2,
            position: 1,
          },
          {
            id: "2",
            name: "0x208f...c4A5",
            fullAddress: "0x208f440ed1B6f64bc6Afa473EC4FD96bf858c4A5",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 1254219.4,
            position: 2,
          },
          {
            id: "3",
            name: "0x3287...B3F5",
            fullAddress: "0x3287918269341D3b75c3bBFC03d5Ee19a867B3F5",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 1091087.1,
            position: 3,
          },
          {
            id: "4",
            name: "0x4cdA...EF0a",
            fullAddress: "0x4cdA00B603D88962aD96d193e304e1dd220AEF0a",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 984631.9,
            position: 4,
          },
          {
            id: "5",
            name: "0xf7e7...349",
            fullAddress: "0xf7e79770Bf7cBdD140F10893c8E7e341a4498349",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 600713.8,
            position: 5,
          },
          {
            id: "6",
            name: "0x816f...c69A",
            fullAddress: "0x816fEd7F500F34D1b6ec86b0b2e2ac0edB29c69A",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 557640.5,
            position: 6,
          },
          {
            id: "7",
            name: "0xa248...1Efc",
            fullAddress: "0xa248251f09D70beCd9747f6e9bCD9dEB87d11Efc",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 522343.9,
            position: 7,
          },
          {
            id: "8",
            name: "0xC88A...eDC9",
            fullAddress: "0xC88AB6661B16fd41F8477DfF8565eabFFd74eDC9",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 305680.4,
            position: 8,
          },
          {
            id: "9",
            name: "0x99DC...1EA1",
            fullAddress: "0x99DC5B03f3748A717Db69FDEdd213537B8c61EA1",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 219192.1,
            position: 9,
          },
          {
            id: "10",
            name: "0x0467...a62",
            fullAddress: "0x0467FC82736b0D7684A55455F18d9284B9d53a62",
            event: "Holding Championship",
            date: "2025-06-01",
            amount: 203607.3,
            position: 10,
          },
        ]
        setWinners(winnersData)
        setIsLoading(false)
      }, 1000)
    }

    checkAuth()
  }, [router])

  const getPositionColor = (position: number) => {
    if (position === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
    if (position === 2) return "bg-gradient-to-r from-gray-300 to-gray-500"
    if (position === 3) return "bg-gradient-to-r from-amber-600 to-amber-800"
    return "bg-gradient-to-r from-blue-500 to-blue-700"
  }

  const getTrophyColor = (position: number) => {
    if (position === 1) return "text-yellow-400"
    if (position === 2) return "text-gray-300"
    if (position === 3) return "text-amber-600"
    return "text-blue-400"
  }

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      <BackgroundEffect />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6 relative z-10"
      >
        <h1 className="text-3xl font-bold tracking-tighter flex items-center justify-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
          >
            <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
          </motion.div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
            {translations.title || "Winners"}
          </span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">{translations.subtitle || "Participants rewarded in our events"}</p>
      </motion.div>

      <div className="w-full max-w-md px-4 relative z-10">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4 animate-pulse"
              >
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              </motion.div>
            ))}
          </div>
        ) : winners.length > 0 ? (
          <div className="space-y-3">
            {winners.map((winner, index) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300"
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getPositionColor(winner.position)}/20 border-2 border-transparent`}
                      style={{
                        borderImage: `linear-gradient(45deg, ${winner.position <= 3 ? "#fbbf24, #f59e0b" : "#3b82f6, #1d4ed8"}) 1`,
                      }}
                    >
                      <span className="text-sm font-bold text-white">{winner.position}</span>
                    </div>
                    {winner.position <= 3 && (
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <Trophy className={`w-4 h-4 ${getTrophyColor(winner.position)}`} />
                      </motion.div>
                    )}
                  </div>

                  <div className="ml-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div className="font-mono text-sm text-gray-300 truncate max-w-[120px] flex items-center">
                        {winner.name}
                        <button
                          onClick={() => copyToClipboard(winner.fullAddress)}
                          className="ml-1 focus:outline-none"
                          aria-label="Copy full address"
                          title="Copy full address"
                        >
                          {copiedAddress === winner.fullAddress ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400 hover:text-white transition-colors" />
                          )}
                        </button>
                      </div>
                      <motion.div className="font-bold text-right" whileHover={{ scale: 1.05 }}>
                        <div className="text-green-400 text-sm">
                          {winner.amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}{" "}
                          TPF
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(winner.date).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US")}
                      </div>
                      <div className="text-blue-400 font-medium">{winner.event}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700/30 text-center"
          >
            <div className="flex flex-col items-center justify-center">
              <Trophy className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">{translations.noWinners || "No winners yet"}</h3>
              <p className="text-gray-400 text-sm">
                {translations.noWinnersDesc ||
                  "Winners of our events will be displayed here. Stay tuned for upcoming events to participate!"}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav activeTab="winners" />
    </main>
  )
}
