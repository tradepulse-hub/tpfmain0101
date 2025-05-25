"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Trophy, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface Winner {
  id: string
  name: string
  event: string
  date: string
  amount: number
  position: number
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState(getTranslations("en").winners || {})

  useEffect(() => {
    // Atualizar idioma quando o componente montar e quando o idioma mudar
    const updateLanguage = () => {
      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)
      setTranslations(getTranslations(currentLang).winners || {})
    }

    updateLanguage()

    // Adicionar listener para mudanças de idioma
    window.addEventListener("languageChange", updateLanguage)

    // Limpar listener quando o componente desmontar
    return () => {
      window.removeEventListener("languageChange", updateLanguage)
    }
  }, [])

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      const savedAddress = localStorage.getItem("walletAddress")
      if (!savedAddress) {
        // Redirecionar para a página inicial se não estiver autenticado
        router.push("/")
        return
      }

      // Simular carregamento de vencedores
      setTimeout(() => {
        // Por enquanto, não temos vencedores, então deixamos a lista vazia
        setWinners([])
        setIsLoading(false)
      }, 1000)
    }

    checkAuth()
  }, [router])

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
          <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
            {translations.title || "Winners"}
          </span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">{translations.subtitle || "Participants rewarded in our events"}</p>
      </motion.div>

      <div className="w-full max-w-md px-4 relative z-10">
        {isLoading ? (
          // Esqueleto de carregamento
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : winners.length > 0 ? (
          // Lista de vencedores
          <div className="space-y-4">
            {winners.map((winner) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
              >
                <div className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      winner.position === 1
                        ? "bg-yellow-500/20"
                        : winner.position === 2
                          ? "bg-gray-400/20"
                          : "bg-amber-700/20"
                    }`}
                  >
                    <Trophy
                      className={`w-5 h-5 ${
                        winner.position === 1
                          ? "text-yellow-400"
                          : winner.position === 2
                            ? "text-gray-300"
                            : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <div className="font-medium text-white">{winner.name}</div>
                      <div className="font-medium text-blue-400">{winner.amount.toLocaleString()} TPF</div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(winner.date).toLocaleDateString(language === "pt" ? "pt-BR" : "en-US")}
                      </div>
                      <div>{winner.event}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Mensagem de nenhum vencedor ainda
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
