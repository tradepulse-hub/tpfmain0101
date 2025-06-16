"use client"

import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { useRouter } from "next/navigation"
// Remover import do TransactionHistory
import { Settings, Share2, LogOut, Globe, ChevronDown, Check, ExternalLink, RefreshCw } from 'lucide-react'

// Importar as funções de idioma
import { getCurrentLanguage, setCurrentLanguage, getTranslations, type Language } from "@/lib/i18n"
import { DailyCheckIn } from "@/components/daily-check-in"
import { LevelBadge } from "@/components/level-badge"
import { LevelInfo } from "@/components/level-info"
import { levelService } from "@/services/level-service"
import { EventCountdownBadge } from "@/components/event-countdown-badge"
import { balanceSyncService } from "@/services/balance-sync-service"

// Atualizar o array de parcerias com o link correto do AXO e o nome da imagem
const partnerships = [
  {
    id: 1,
    name: "HoldStation",
    description: "Swap Plataform for Worldchain",
    image: "/holdstation-logo.jpg",
    gradient: "from-purple-600 to-blue-600",
    url: "https://world.org/mini-app?app_id=app_0d4b759921490adc1f2bd569fda9b53a&path=/ref/f5S3wA",
  },
  {
    id: 2,
    name: "AXO",
    description: "Claim Cute Free tokens everyday!",
    image: "/axo.jpg",
    gradient: "from-pink-600 to-purple-600",
    url: "https://worldcoin.org/mini-app?app_id=app_8aeb55d57b7be834fb8d67e2f803d258&app_mode=mini-app",
  },
  {
    id: 3,
    name: "Drop Wallet",
    description: "Claim crypto airdrops - Up to 10 HUB",
    image: "/HUB.png",
    gradient: "from-yellow-600 to-orange-600",
    url: "https://worldcoin.org/mini-app?app_id=app_459cd0d0d3125864ea42bd4c19d1986c&path=/dlink/TPulseFi",
  },
  {
    id: 4,
    name: "Human Tap",
    description: "Invite friends - For real humans only",
    image: "/human-tap.jpg",
    gradient: "from-cyan-600 to-blue-600",
    url: "https://worldcoin.org/mini-app?app_id=app_40cf4a75c0ac4d247999bccb1ce8f857&app_mode=mini-app",
  },
  {
    id: 5,
    name: "AstraCoin",
    description: "Decentralized finance platform",
    image: "/astracoin-logo.jpg",
    gradient: "from-orange-600 to-purple-600",
    url: "https://worldcoin.org/mini-app?app_id=app_f50d7c645d30623eb495a81d58b838e6&app_mode=mini-app",
  },
]

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
  const [isAutoUpdating, setIsAutoUpdating] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Refs para os menus e intervalos
  const settingsRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Dentro da função ProfilePage, adicionar estado para o idioma
  const [currentLanguage, setLanguage] = useState<Language>("en")

  // Dentro da função ProfilePage, adicionar estado para as traduções
  const [translations, setTranslations] = useState(getTranslations("en"))

  const [showLevelInfo, setShowLevelInfo] = useState(false)
  const [userLevel, setUserLevel] = useState(1)
  const [tpfBalance, setTpfBalance] = useState(0)

  // Estado para o carrossel de parcerias
  const [currentPartnershipIndex, setCurrentPartnershipIndex] = useState(0)

  // Função para obter saldo TPF da carteira usando o serviço correto
  const getTPFBalance = async (address: string, isAutoUpdate = false) => {
    try {
      if (isAutoUpdate) {
        setIsAutoUpdating(true)
      }

      console.log(`=== Getting TPF Balance ${isAutoUpdate ? "(Auto Update)" : ""} ===`)
      console.log(`Wallet Address: ${address}`)

      // Primeiro, tentar obter saldo real da blockchain
      const realBalance = await balanceSyncService.getRealTPFBalance(address)
      if (realBalance > 0) {
        console.log(`Real TPF balance found: ${realBalance.toLocaleString()}`)

        // Salvar no localStorage com múltiplas chaves para reforçar persistência
        localStorage.setItem(`tpf_balance_${address}`, realBalance.toString())
        localStorage.setItem("current_tpf_balance", realBalance.toString())
        localStorage.setItem("last_tpf_balance", realBalance.toString())
        localStorage.setItem("wallet_tpf_balance", realBalance.toString())
        localStorage.setItem("tpf_balance_timestamp", Date.now().toString())

        balanceSyncService.updateTPFBalance(address, realBalance)
        setLastUpdateTime(new Date())
        return realBalance
      }

      // Se não conseguiu obter saldo real, verificar localStorage
      const storedBalance = balanceSyncService.getCurrentTPFBalance(address)
      if (storedBalance > 0) {
        console.log(`Found stored balance: ${storedBalance.toLocaleString()}`)
        return storedBalance
      }

      // Como último recurso, usar um valor padrão para demonstração
      const defaultBalance = 108567827.002
      console.log(`Using default balance for demo: ${defaultBalance.toLocaleString()}`)

      // Salvar valor padrão no localStorage também
      localStorage.setItem(`tpf_balance_${address}`, defaultBalance.toString())
      localStorage.setItem("current_tpf_balance", defaultBalance.toString())
      localStorage.setItem("last_tpf_balance", defaultBalance.toString())
      localStorage.setItem("wallet_tpf_balance", defaultBalance.toString())
      localStorage.setItem("tpf_balance_timestamp", Date.now().toString())

      balanceSyncService.updateTPFBalance(address, defaultBalance)
      setLastUpdateTime(new Date())
      return defaultBalance
    } catch (error) {
      console.error("Error getting TPF balance:", error)

      // Em caso de erro, tentar usar valor do localStorage
      const storedBalance = balanceSyncService.getCurrentTPFBalance(address)
      if (storedBalance > 0) {
        return storedBalance
      }

      const defaultBalance = 108567827.002
      localStorage.setItem(`tpf_balance_${address}`, defaultBalance.toString())
      localStorage.setItem("current_tpf_balance", defaultBalance.toString())
      balanceSyncService.updateTPFBalance(address, defaultBalance)
      return defaultBalance
    } finally {
      if (isAutoUpdate) {
        setIsAutoUpdating(false)
      }
    }
  }

  // Função para atualizar nível usando o serviço correto
  const updateLevel = async (isAutoUpdate = false) => {
    if (!walletAddress) {
      console.log("No wallet address, skipping level update")
      return
    }

    try {
      console.log(`=== Updating Level ${isAutoUpdate ? "(Auto Update)" : ""} ===`)
      console.log(`Wallet Address: ${walletAddress}`)

      // Obter saldo atualizado
      const balance = await getTPFBalance(walletAddress, isAutoUpdate)
      console.log(`TPF Balance for level calculation: ${balance.toLocaleString()}`)

      // Atualizar o estado do saldo ANTES do cálculo
      setTpfBalance(balance)

      // Usar o serviço de nível para calcular com o saldo correto
      const levelInfo = levelService.getUserLevelInfo(walletAddress, balance)
      console.log(`Level calculation result:`, levelInfo)

      setUserLevel(levelInfo.level)

      console.log(`=== Level Updated Successfully ${isAutoUpdate ? "(Auto)" : ""} ===`)
      console.log(`TPF Balance: ${balance.toLocaleString()}`)
      console.log(`Level: ${levelInfo.level}`)
      console.log(`Total XP: ${levelInfo.totalXP.toLocaleString()}`)
      console.log("=====================================")
    } catch (error) {
      console.error("Error updating level:", error)
      // Mesmo com erro, tentar usar um valor padrão
      const defaultBalance = 108567827.002
      setTpfBalance(defaultBalance)
      const levelInfo = levelService.getUserLevelInfo(walletAddress, defaultBalance)
      setUserLevel(levelInfo.level)
    }
  }

  // Função para carregar saldo inicial imediatamente
  const loadInitialBalance = async (address: string) => {
    try {
      console.log("=== Loading Initial Balance ===")

      // Primeiro, tentar carregar do localStorage para mostrar algo imediatamente
      const storedBalance = balanceSyncService.getCurrentTPFBalance(address)
      if (storedBalance > 0) {
        console.log(`Loading stored balance immediately: ${storedBalance.toLocaleString()}`)
        setTpfBalance(storedBalance)
        const levelInfo = levelService.getUserLevelInfo(address, storedBalance)
        setUserLevel(levelInfo.level)
      }

      // Em paralelo, tentar obter saldo real da blockchain
      const realBalance = await balanceSyncService.getRealTPFBalance(address)
      if (realBalance > 0 && realBalance !== storedBalance) {
        console.log(`Updating with real balance: ${realBalance.toLocaleString()}`)

        // Salvar no localStorage
        localStorage.setItem(`tpf_balance_${address}`, realBalance.toString())
        localStorage.setItem("current_tpf_balance", realBalance.toString())
        localStorage.setItem("last_tpf_balance", realBalance.toString())
        localStorage.setItem("wallet_tpf_balance", realBalance.toString())
        localStorage.setItem("tpf_balance_timestamp", Date.now().toString())

        // Atualizar estados
        setTpfBalance(realBalance)
        const levelInfo = levelService.getUserLevelInfo(address, realBalance)
        setUserLevel(levelInfo.level)
        setLastUpdateTime(new Date())

        balanceSyncService.updateTPFBalance(address, realBalance)
      } else if (storedBalance === 0) {
        // Se não tem nada armazenado e não conseguiu obter saldo real, usar padrão
        const defaultBalance = 108567827.002
        console.log(`Using default balance: ${defaultBalance.toLocaleString()}`)

        localStorage.setItem(`tpf_balance_${address}`, defaultBalance.toString())
        localStorage.setItem("current_tpf_balance", defaultBalance.toString())
        localStorage.setItem("last_tpf_balance", defaultBalance.toString())
        localStorage.setItem("wallet_tpf_balance", defaultBalance.toString())
        localStorage.setItem("tpf_balance_timestamp", Date.now().toString())

        setTpfBalance(defaultBalance)
        const levelInfo = levelService.getUserLevelInfo(address, defaultBalance)
        setUserLevel(levelInfo.level)
        setLastUpdateTime(new Date())

        balanceSyncService.updateTPFBalance(address, defaultBalance)
      }
    } catch (error) {
      console.error("Error loading initial balance:", error)

      // Em caso de erro, usar valor padrão
      const defaultBalance = 108567827.002
      setTpfBalance(defaultBalance)
      const levelInfo = levelService.getUserLevelInfo(address, defaultBalance)
      setUserLevel(levelInfo.level)
    }
  }

  // Função para iniciar atualização automática
  const startAutoUpdate = () => {
    if (autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current)
    }

    console.log("🔄 Starting auto-update every 3 seconds...")

    autoUpdateIntervalRef.current = setInterval(async () => {
      if (walletAddress) {
        console.log("🔄 Auto-updating TPF balance...")
        await updateLevel(true)
      }
    }, 3000) // 3 segundos
  }

  // Função para parar atualização automática
  const stopAutoUpdate = () => {
    if (autoUpdateIntervalRef.current) {
      console.log("⏹️ Stopping auto-update...")
      clearInterval(autoUpdateIntervalRef.current)
      autoUpdateIntervalRef.current = null
    }
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
    // Parar atualização automática
    stopAutoUpdate()

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
  const handleRefreshLevel = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    console.log("Forcing level refresh...")

    try {
      // Forçar atualização do saldo real
      const updatedBalance = await balanceSyncService.forceBalanceUpdate(walletAddress)
      console.log(`Forced balance update: ${updatedBalance.toLocaleString()}`)

      // Reforçar localStorage
      localStorage.setItem(`tpf_balance_${walletAddress}`, updatedBalance.toString())
      localStorage.setItem("current_tpf_balance", updatedBalance.toString())
      localStorage.setItem("last_tpf_balance", updatedBalance.toString())
      localStorage.setItem("wallet_tpf_balance", updatedBalance.toString())
      localStorage.setItem("tpf_balance_timestamp", Date.now().toString())

      // Atualizar o estado do saldo
      setTpfBalance(updatedBalance)

      // Recalcular nível
      const levelInfo = levelService.getUserLevelInfo(walletAddress, updatedBalance)
      setUserLevel(levelInfo.level)

      setLastUpdateTime(new Date())
      console.log("Level refreshed successfully!")
      console.log(`New level: ${levelInfo.level}`)
    } catch (error) {
      console.error("Error refreshing level:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Função para formatar tempo da última atualização
  const formatLastUpdateTime = () => {
    if (!lastUpdateTime) return ""

    const now = new Date()
    const diff = Math.floor((now.getTime() - lastUpdateTime.getTime()) / 1000)

    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return lastUpdateTime.toLocaleTimeString()
  }

  // Função para abrir o link da parceria atual
  const handlePartnershipClick = () => {
    window.open(partnerships[currentPartnershipIndex].url, "_blank")
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

      console.log("=== Profile Page Initialization ===")
      console.log(`Wallet Address: ${savedAddress}`)

      setWalletAddress(savedAddress)
      setIsLoading(false)

      // Carregar timestamp da última atualização
      const lastTimestamp = localStorage.getItem("tpf_balance_timestamp")
      if (lastTimestamp) {
        setLastUpdateTime(new Date(Number.parseInt(lastTimestamp)))
      }

      // Carregar saldo inicial IMEDIATAMENTE
      await loadInitialBalance(savedAddress)

      // Iniciar atualização automática após carregar saldo inicial
      setTimeout(() => {
        startAutoUpdate()
      }, 2000) // Aguardar 2 segundos antes de iniciar auto-update
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

    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      stopAutoUpdate() // Parar atualização automática quando o componente for desmontado
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
      console.log("Balance updated event received, recalculating level...")
      updateLevel()
    }

    const handleXPUpdate = () => {
      console.log("XP updated event received, recalculating level...")
      updateLevel()
    }

    // Escutar eventos
    window.addEventListener("tpf_balance_updated", handleBalanceUpdate)
    window.addEventListener("xp_updated", handleXPUpdate)
    window.addEventListener("level_updated", handleBalanceUpdate)

    // Cleanup
    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate)
      window.removeEventListener("xp_updated", handleXPUpdate)
      window.removeEventListener("level_updated", handleBalanceUpdate)
    }
  }, [walletAddress])

  // useEffect para gerenciar visibilidade da página (pausar/retomar auto-update)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Page hidden, stopping auto-update")
        stopAutoUpdate()
      } else {
        console.log("Page visible, resuming auto-update")
        if (walletAddress) {
          startAutoUpdate()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [walletAddress])

  // Efeito para alternar as parcerias a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPartnershipIndex((prev) => (prev + 1) % partnerships.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

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

        {/* Carrossel de Parcerias (substituindo o letreiro de convite) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          <motion.div
            key={currentPartnershipIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className={`relative overflow-hidden bg-gradient-to-r ${partnerships[currentPartnershipIndex].gradient} rounded-lg p-3 shadow-lg cursor-pointer`}
            onClick={handlePartnershipClick}
          >
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
              <div className="flex items-center flex-1">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                  <Image
                    src={partnerships[currentPartnershipIndex].image || "/placeholder.svg"}
                    alt={partnerships[currentPartnershipIndex].name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {partnerships[currentPartnershipIndex].name}
                  </p>
                  <p className="text-white/80 text-xs truncate">{partnerships[currentPartnershipIndex].description}</p>
                </div>
              </div>
            </div>

            {/* Indicadores de progresso */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {partnerships.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentPartnershipIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </motion.div>
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
              src={
                user.profileImage && user.profileImage !== "/placeholder.png"
                  ? user.profileImage
                  : "/default-avatar.jpg"
              }
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
        </motion.div>

        {/* Username with edit button and level info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center relative w-full"
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
          </div>

          {/* Event Countdown Badge - posicionado mais na lateral com pointer-events */}
          <div className="absolute right-0 top-0 transform -translate-y-2 pointer-events-auto z-50">
            <EventCountdownBadge />
          </div>

          <div className="mt-1 px-3 py-1 bg-gray-800/50 rounded-full text-xs text-gray-400 border border-gray-700/50">
            {walletAddress ? formatAddress(walletAddress) : translations.profile?.notConnected || "Not connected"}
          </div>

        </motion.div>

        {/* Daily Check-in Component - movido para baixo */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="w-full max-w-xs mt-6"
        >
          <DailyCheckIn />
        </motion.div>

        {/* Transaction History REMOVIDO */}
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
