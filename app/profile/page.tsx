"use client"

import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { useRouter } from "next/navigation"
import { TransactionHistory } from "@/components/transaction-history"
// Adicionar import para os ícones do Telegram e Twitter (X)
import { Settings, Share2, LogOut, Globe, ChevronDown, Check, ExternalLink, RefreshCw } from "lucide-react"

// Importar as funções de idioma
import { getCurrentLanguage, setCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"
import { DailyCheckIn } from "@/components/daily-check-in"
import { LevelBadge } from "@/components/level-badge"
import { LevelInfo } from "@/components/level-info"
import { levelService } from "@/services/level-service"
import { EventCountdownBadge } from "@/components/event-countdown-badge"

export default function ProfilePage() {
  // User state with profile data
  const [user, setUser] = useState({
    nickname: "CryptoUser",
    profileImage: "/placeholder.png",
  })

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)

  // Wallet and balance states
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Refs para os menus
  const settingsRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  // Dentro da função ProfilePage, adicionar estado para o idioma
  const [currentLanguage, setLanguage] = useState<Language>("en")

  // Dentro da função ProfilePage, adicionar estado para as traduções
  const [translations, setTranslations] = useState(getTranslations("en"))

  const [showLevelInfo, setShowLevelInfo] = useState(false)
  const [userLevel, setUserLevel] = useState(1)
  const [tpfBalance, setTpfBalance] = useState(0)

  // Função simples para calcular XP e nível
  const calculateLevel = (tpfBalance: number) => {
    const checkInXP = levelService.getCheckInXP()
    const tpfXP = Math.floor(tpfBalance * 0.001) // 1 TPF = 0.001 XP
    const totalXP = checkInXP + tpfXP
    const level = levelService.calculateLevel(totalXP)

    console.log(`=== Level Calculation ===`)
    console.log(`TPF Balance: ${tpfBalance.toLocaleString()}`)
    console.log(`Check-in XP: ${checkInXP}`)
    console.log(`TPF XP: ${tpfXP.toLocaleString()}`)
    console.log(`Total XP: ${totalXP.toLocaleString()}`)
    console.log(`Level: ${level}`)
    console.log(`========================`)

    return level
  }

  // Função para obter saldo TPF da carteira
  const getTPFBalance = () => {
    try {
      // Tentar múltiplas fontes
      const sources = [
        localStorage.getItem("wallet_tpf_balance"),
        localStorage.getItem("current_tpf_balance"),
        localStorage.getItem(`tpf_balance_${walletAddress}`),
      ]

      for (const source of sources) {
        if (source && source !== "0" && source !== "null") {
          const balance = Number.parseFloat(source)
          if (!isNaN(balance) && balance > 0) {
            console.log(`Found TPF balance: ${balance.toLocaleString()}`)
            return balance
          }
        }
      }

      // Fallback para saldo alto de exemplo (remover em produção)
      return 108567827.002
    } catch (error) {
      console.error("Error getting TPF balance:", error)
      return 0
    }
  }

  // Função para atualizar nível
  const updateLevel = () => {
    const balance = getTPFBalance()
    setTpfBalance(balance)
    const level = calculateLevel(balance)
    setUserLevel(level)
  }

  // Handle profile updates
  const handleProfileUpdate = (newData: { nickname?: string; profileImage?: string }) => {
    // Criar um novo objeto de usuário com os dados atualizados
    const updatedUser = {
      ...user,
      ...newData,
    }

    // Atualizar o estado
    setUser(updatedUser)

    // Salvar no localStorage de forma mais robusta
    try {
      if (newData.nickname) {
        localStorage.setItem("userNickname", newData.nickname)
      }
      if (newData.profileImage) {
        localStorage.setItem("userProfileImage", newData.profileImage)
      }

      // Salvar o objeto de usuário completo para maior segurança
      localStorage.setItem("userProfile", JSON.stringify(updatedUser))

      console.log("Profile data saved successfully")
    } catch (error) {
      console.error("Error saving profile data:", error)
    }

    setIsEditModalOpen(false)
  }

  // Função para compartilhar o app
  const shareApp = () => {
    // Verificar se a API de compartilhamento está disponível
    if (navigator.share) {
      navigator
        .share({
          title: "TPulseFi Mini App",
          text: "Confira o TPulseFi Mini App no Worldcoin App Store!",
          url: "https://worldcoin.org/mini-app?app_id=app_a3a55e132983350c67923dd57dc22c5e&app_mode=mini-app",
        })
        .then(() => {
          console.log("Compartilhado com sucesso")
        })
        .catch((error) => {
          console.log("Erro ao compartilhar", error)
          // Fallback: copiar para a área de transferência
          copyToClipboard(
            "https://worldcoin.org/mini-app?app_id=app_a3a55e132983350c67923dd57dc22c5e&app_mode=mini-app",
          )
        })
    } else {
      // Fallback: copiar para a área de transferência
      copyToClipboard("https://worldcoin.org/mini-app?app_id=app_a3a55e132983350c67923dd57dc22c5e&app_mode=mini-app")
    }
    setIsSettingsOpen(false)
  }

  // Função para fazer logout
  const handleLogout = () => {
    // Limpar dados do localStorage
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("userNickname")
    localStorage.removeItem("userProfileImage")

    // Redirecionar para a página inicial
    router.push("/")
    setIsSettingsOpen(false)
  }

  // Função para copiar para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link copiado para a área de transferência!")
      })
      .catch((err) => {
        console.error("Erro ao copiar: ", err)
      })
  }

  // Função para abrir o menu de idiomas
  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen)
  }

  // Função para alternar o idioma
  const toggleLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
    setLanguage(lang)
    setTranslations(getTranslations(lang))
    setIsLanguageMenuOpen(false)
  }

  // Obter o nome do idioma atual
  const getLanguageName = (lang: Language) => {
    switch (lang) {
      case "pt":
        return "Português"
      case "en":
      default:
        return "English"
    }
  }

  // Obter a bandeira do idioma atual
  const getLanguageFlag = (lang: Language) => {
    switch (lang) {
      case "pt":
        return "🇧🇷"
      case "en":
      default:
        return "🇺🇸"
    }
  }

  // Função para forçar atualização do nível
  const handleRefreshLevel = () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    console.log("Refreshing level...")

    setTimeout(() => {
      updateLevel()
      setIsRefreshing(false)
      console.log("Level refreshed!")
    }, 500)
  }

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      const savedAddress = localStorage.getItem("walletAddress")
      if (!savedAddress) {
        // Redirecionar para a página inicial se não estiver autenticado
        router.push("/")
        return
      }

      setWalletAddress(savedAddress)
      setIsLoading(false)

      // Atualizar nível inicial
      setTimeout(updateLevel, 100)
    }

    checkAuth()

    // Carregar dados do perfil do localStorage de forma mais robusta
    try {
      // Tentar carregar o objeto de usuário completo primeiro
      const savedUserProfile = localStorage.getItem("userProfile")
      if (savedUserProfile) {
        const parsedProfile = JSON.parse(savedUserProfile)
        setUser(parsedProfile)
        console.log("Loaded complete user profile from localStorage")
      } else {
        // Fallback para o método antigo
        const savedNickname = localStorage.getItem("userNickname")
        const savedProfileImage = localStorage.getItem("userProfileImage")

        if (savedNickname || savedProfileImage) {
          setUser((prev) => ({
            ...prev,
            nickname: savedNickname || prev.nickname,
            profileImage: savedProfileImage || prev.profileImage,
          }))
          console.log("Loaded individual profile fields from localStorage")
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error)
    }

    // Fechar o menu de configurações ao clicar fora dele
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
        setIsLanguageMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [router])

  // Atualizar o useEffect para carregar traduções
  useEffect(() => {
    // Carregar idioma atual e traduções
    const lang = getCurrentLanguage()
    setLanguage(lang)
    setTranslations(getTranslations(lang))

    // Escutar mudanças de idioma
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setTranslations(getTranslations(newLang))
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  // Escutar mudanças de saldo e XP
  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log("Balance updated, recalculating level...")
      updateLevel()
    }

    const handleXPUpdate = () => {
      console.log("XP updated, recalculating level...")
      updateLevel()
    }

    // Escutar eventos
    window.addEventListener("tpf_balance_updated", handleBalanceUpdate)
    window.addEventListener("xp_updated", handleXPUpdate)

    // Cleanup
    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate)
      window.removeEventListener("xp_updated", handleXPUpdate)
    }
  }, [walletAddress])

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      {/* Background effects */}
      <BackgroundEffect />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleProfileUpdate}
        currentData={user}
      />

      {/* Profile content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full px-4"
      >
        {/* Header com título e botão de configurações */}
        <div className="w-full flex justify-between items-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-left"
          >
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
                {translations.profile?.profile || "Profile"}
              </span>
            </h1>
          </motion.div>

          {/* Botão de configurações */}
          <div className="relative" ref={settingsRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-gray-800/70 border border-gray-700/50 flex items-center justify-center"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="w-5 h-5 text-gray-300" />
            </motion.button>

            {/* Menu de configurações */}
            {isSettingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50"
              >
                <div className="py-1">
                  {/* Opção de idioma com submenu */}
                  <div className="relative">
                    <button
                      onClick={toggleLanguageMenu}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        <span>Language</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">{getLanguageFlag(currentLanguage)}</span>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {/* Submenu de idiomas (agora abre para baixo) */}
                    {isLanguageMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-0 right-0 mt-1 rounded-md shadow-lg bg-gray-700 border border-gray-600 z-50"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => toggleLanguage("en")}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span className="text-lg mr-2">🇺🇸</span>
                              <span>English</span>
                            </div>
                            {currentLanguage === "en" && <Check className="w-4 h-4 text-green-500" />}
                          </button>
                          <button
                            onClick={() => toggleLanguage("pt")}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span className="text-lg mr-2">🇧🇷</span>
                              <span>Português</span>
                            </div>
                            {currentLanguage === "pt" && <Check className="w-4 h-4 text-green-500" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button
                    onClick={shareApp}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {translations.profile?.shareWithFriends || "Share with friends and family"}
                  </button>

                  {/* Seção Follow Us */}
                  <div className="border-t border-gray-700 pt-1 mt-1">
                    <div className="px-4 py-1 text-xs text-gray-500">
                      {translations.profile?.followUs || "Follow us"}
                    </div>

                    <a
                      href="https://x.com/TradePulseToken"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2 flex items-center justify-center">𝕏</span>
                        <span>Twitter</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>

                    <a
                      href="https://t.me/tpulsefi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.515 7.143c-.112.54-.53.664-1.076.413l-2.966-2.187-1.431 1.381c-.159.158-.291.291-.595.291l.213-3.02 5.5-4.968c.238-.213-.052-.332-.373-.119l-6.804 4.283-2.93-.908c-.637-.2-.65-.637.133-.943l11.447-4.415c.53-.199.994.119.822.943z" />
                        </svg>
                        <span>Telegram</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center border-t border-gray-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {translations.profile?.logOut || "Log out"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Letreiro de convite */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-3 shadow-lg">
            <div className="absolute inset-0 bg-black/10" />

            {/* Efeito de brilho animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 2.5,
                ease: "linear",
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-medium text-sm md:text-base">
                  {translations.profile?.inviteBanner || "Invite friends and family to try our app"}
                </p>
              </div>
              <button
                onClick={shareApp}
                className="ml-3 flex-shrink-0 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors"
              >
                <Share2 className="w-4 h-4 inline mr-1" />
                {translations.profile?.shareButton || "Share"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* TPulseFi title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
              TPulse
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Fi</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Global Crypto Bridge</p>
        </motion.div>

        {/* Profile picture circle with edit button and level badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-700 relative">
            <Image
              src={user.profileImage || "/placeholder.svg?height=128&width=128&query=user"}
              alt="Profile"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-blue-500/20 mix-blend-overlay"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>

          {/* Level Badge - posicionado no canto superior direito */}
          <div className="absolute -top-1 -right-1">
            <LevelBadge level={userLevel} size="small" showTooltip={true} className="cursor-pointer" />
          </div>

          {/* Animated rings around profile picture */}
          <motion.div
            className="absolute -inset-2 rounded-full border border-gray-600/30"
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          />

          <motion.div
            className="absolute -inset-4 rounded-full border border-gray-600/20"
            animate={{ scale: [1.05, 1, 1.05], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
          />

          {/* Luz branca girando */}
          <motion.div
            className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rounded-full"
            style={{
              background: "conic-gradient(from 0deg, transparent, white, transparent, transparent)",
              filter: "blur(2px)",
              mixBlendMode: "overlay",
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />

          {/* Segundo efeito de luz girando na direção oposta */}
          <motion.div
            className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] rounded-full"
            style={{
              background:
                "conic-gradient(from 180deg, transparent 60%, rgba(255,255,255,0.5), transparent 80%, transparent)",
              filter: "blur(3px)",
              mixBlendMode: "overlay",
            }}
            animate={{
              rotate: [360, 0],
            }}
            transition={{
              duration: 5,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        </motion.div>

        {/* Username with edit button and level info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center relative"
        >
          <div className="flex items-center justify-center gap-2 relative">
            <h2 className="text-xl font-medium text-white">{user.nickname}</h2>
            <motion.button
              className="w-6 h-6 rounded-md bg-gray-800/70 border border-gray-700/50 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditModalOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3 text-gray-400"
              >
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
              </svg>
            </motion.button>

            {/* Event Countdown Badge - posicionado mais na lateral */}
            <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
              <EventCountdownBadge />
            </div>
          </div>
          <div className="mt-1 px-3 py-1 bg-gray-800/50 rounded-full text-xs text-gray-400 border border-gray-700/50">
            {walletAddress ? formatAddress(walletAddress) : translations.profile?.notConnected || "Not connected"}
          </div>

          {/* Level Info Button with Refresh */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <motion.button
              onClick={() => setShowLevelInfo(true)}
              className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full text-xs text-blue-300 border border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {translations.level?.viewDetails || "View level details"}
            </motion.button>

            <motion.button
              onClick={handleRefreshLevel}
              disabled={isRefreshing}
              className="w-6 h-6 rounded-full bg-gray-800/70 border border-gray-700/50 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={12} className={`text-gray-400 ${isRefreshing ? "animate-spin" : ""}`} />
            </motion.button>
          </div>

          {/* Debug info (remover em produção) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-2 text-xs text-gray-500">
              <div>TPF: {tpfBalance.toLocaleString()}</div>
              <div>Level: {userLevel}</div>
            </div>
          )}
        </motion.div>

        {/* Daily Check-in Component */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full max-w-xs"
        >
          <DailyCheckIn />
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full max-w-xs mt-2"
        >
          <TransactionHistory walletAddress={walletAddress} daysToShow={5} />
        </motion.div>
      </motion.div>

      {/* Level Info Modal */}
      <LevelInfo tpfBalance={tpfBalance} isOpen={showLevelInfo} onClose={() => setShowLevelInfo(false)} />

      {/* Bottom navigation */}
      <BottomNav activeTab="profile" />
    </main>
  )
}

// Função auxiliar para formatar endereços
function formatAddress(address: string): string {
  if (!address) return ""
  if (address.length < 10) return address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
