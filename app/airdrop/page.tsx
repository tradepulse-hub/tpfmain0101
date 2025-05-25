"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { motion } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useProgress, Html, Preload } from "@react-three/drei"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { TPFLogoModel } from "@/components/tpf-logo-model"
import { Coins, RefreshCw } from "lucide-react"
import type * as THREE from "three"
import { useRouter } from "next/navigation"
import { getAirdropStatus, getContractBalance, claimAirdrop } from "@/lib/airdropService"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Componente de carregamento
function LoadingIndicator() {
  const { progress } = useProgress()
  const language = getCurrentLanguage()
  const t = getTranslations(language)

  return (
    <Html center>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 border-l-transparent border-r-transparent rounded-full animate-spin" />
        <p className="mt-4 text-white text-lg font-medium">{Math.round(progress)}%</p>
      </div>
    </Html>
  )
}

// Componente para a moeda rotativa
function RotatingCoin() {
  const coinRef = useRef<THREE.Group>(null)

  // Usar useFrame para girar a moeda a cada frame
  useFrame((state, delta) => {
    if (coinRef.current) {
      // Girar em torno do eixo Y para que a moeda gire como um pião
      coinRef.current.rotation.y += delta * 0.6 // Velocidade reduzida para melhor visualização
    }
  })

  return (
    <group position={[0.15, 0, 0]} ref={coinRef}>
      <TPFLogoModel scale={0.6} castShadow /> {/* TAMANHO REDUZIDO de 0.8 para 0.6 */}
    </group>
  )
}

// Componente da cena melhorada com iluminação simplificada (sem Environment)
function Scene() {
  return (
    <>
      {/* Iluminação melhorada para destacar os detalhes metálicos */}
      <ambientLight intensity={0.8} /> {/* Aumentada a intensidade da luz ambiente */}
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow /> {/* Aumentada a intensidade */}
      <directionalLight position={[-5, 5, -5]} intensity={1.2} castShadow /> {/* Aumentada a intensidade */}
      <spotLight position={[0, 5, 5]} intensity={1.5} angle={0.4} penumbra={0.5} castShadow />{" "}
      {/* Aumentada a intensidade */}
      {/* Luzes pontuais para criar reflexos metálicos */}
      <pointLight position={[3, 0, 3]} intensity={1.0} distance={10} /> {/* Aumentada a intensidade */}
      <pointLight position={[-3, 0, -3]} intensity={1.0} distance={10} /> {/* Aumentada a intensidade */}
      <pointLight position={[0, 3, 0]} intensity={1.0} distance={10} color="#ffffff" /> {/* Nova luz de cima */}
      <pointLight position={[0, -3, 0]} intensity={0.8} distance={10} color="#e0e0ff" /> {/* Nova luz de baixo */}
      {/* Moeda com rotação */}
      <RotatingCoin />
    </>
  )
}

export default function AirdropPage() {
  const [animationComplete, setAnimationComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [canClaim, setCanClaim] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [contractBalance, setContractBalance] = useState("0")
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [userAddress, setUserAddress] = useState<string>("")
  const [formattedBalance, setFormattedBalance] = useState<string>("0")
  const [user, setUser] = useState<any>(null)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const router = useRouter()
  const t = getTranslations(language)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, 3000)

    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
            setUserAddress(data.user.walletAddress)
          } else {
            // Redirecionar para login se não estiver autenticado
            router.push("/")
          }
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    // Obter o idioma atual
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)

    checkAuth()

    // Adicionar listener para mudanças de idioma
    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [router])

  // Simulação de obtenção do saldo do contrato
  const fetchContractBalance = async () => {
    try {
      setIsRefreshingBalance(true)
      console.log("Fetching contract balance...")

      const balanceData = await getContractBalance()
      console.log("Contract balance response:", balanceData)

      if (balanceData.success) {
        setContractBalance(balanceData.balance)
        setFormattedBalance(Number(balanceData.balance).toLocaleString())
        setApiError(null)
      } else {
        console.error("Error fetching contract balance:", balanceData.error)
        setApiError(balanceData.error || "Failed to fetch contract balance")
      }
    } catch (error) {
      console.error("Error fetching contract balance:", error)
      setApiError(error instanceof Error ? error.message : "Failed to fetch contract balance")
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  // Simulação de verificação do status de reivindicação
  const checkClaimStatus = async () => {
    if (!userAddress) return

    try {
      setIsLoading(true)
      console.log("Checking claim status for address:", userAddress)

      const statusData = await getAirdropStatus(userAddress)
      console.log("Airdrop status response:", statusData)

      if (statusData.success) {
        setCanClaim(statusData.canClaim)
        setApiError(null)

        if (!statusData.canClaim) {
          // Garantir que temos um timeRemaining válido
          const timeRemainingSeconds = statusData.timeRemaining || 0

          if (timeRemainingSeconds > 0) {
            const hours = Math.floor(timeRemainingSeconds / 3600)
            const minutes = Math.floor((timeRemainingSeconds % 3600) / 60)
            const seconds = timeRemainingSeconds % 60

            console.log("Setting countdown:", { hours, minutes, seconds })
            setTimeLeft({ hours, minutes, seconds })
          } else {
            // Se o tempo restante for negativo ou zero, verificar novamente
            console.log("Time remaining is zero or negative, rechecking...")
            setTimeout(checkClaimStatus, 1000)
          }
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        }
      } else {
        console.error("Error in airdrop status response:", statusData.error)
        setApiError(statusData.error || "Failed to fetch airdrop status")
      }
    } catch (error) {
      console.error("Error checking claim status:", error)
      setApiError(error instanceof Error ? error.message : "Failed to check claim status")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userAddress) {
      checkClaimStatus()
      fetchContractBalance()
    }
  }, [userAddress])

  // Atualizar o countdown a cada segundo
  useEffect(() => {
    if (canClaim) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          // Se o contador chegou a zero, verificar se pode reivindicar
          checkClaimStatus()
          return prev
        } else if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else {
          return prev
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [canClaim])

  // Simulação de reivindicação de tokens
  const handleClaim = async () => {
    if (!canClaim || isClaiming) return

    try {
      setIsClaiming(true)
      setClaimError(null)
      setClaimSuccess(false)
      setTxId(null)

      // Chamar a função claimAirdrop
      const result = await claimAirdrop(userAddress)
      console.log("Claim result:", result)

      if (result.success) {
        setClaimSuccess(true)
        setTxId(result.txId)

        // Atualizar o status e o saldo após um claim bem-sucedido
        setTimeout(async () => {
          await checkClaimStatus()
          await fetchContractBalance()
        }, 2000)

        // Limpa a mensagem de sucesso após 5 segundos
        setTimeout(() => {
          setClaimSuccess(false)
        }, 5000)
      } else {
        setClaimError(result.error || "Failed to claim tokens. Please try again.")
      }
    } catch (error) {
      console.error("Error claiming airdrop:", error)
      setClaimError(error instanceof Error ? error.message : "An error occurred during the claim. Please try again.")
    } finally {
      setIsClaiming(false)
    }
  }

  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : time
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      <BackgroundEffect />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4 relative z-10"
      >
        <h1 className="text-3xl font-bold tracking-tighter">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-white to-gray-300">
            {t.airdrop?.title}
          </span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">{t.airdrop?.subtitle}</p>
      </motion.div>

      {/* Informações do contrato */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md px-4 mb-4 relative z-10"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">{t.airdrop?.availableForAirdrop}</span>
            <div className="flex items-center">
              <span className="text-white font-medium">{formattedBalance}</span>
              <span className="text-gray-400 text-xs ml-1">TPF</span>
              <button
                onClick={fetchContractBalance}
                disabled={isRefreshingBalance}
                className="ml-2 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshingBalance ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          {!canClaim && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400 text-sm">{t.airdrop?.nextClaimIn}</span>
              <span className="text-white font-medium">
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full h-[300px] relative z-10 border border-gray-800/30 rounded-lg overflow-hidden"
      >
        <Canvas camera={{ position: [0, 0, 2.5], fov: 35 }} gl={{ alpha: true }}>
          <Suspense fallback={<LoadingIndicator />}>
            <Scene />
            <Preload all />
          </Suspense>
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2 - 0.5}
            maxPolarAngle={Math.PI / 2 + 0.5}
          />
        </Canvas>
      </motion.div>

      {animationComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 relative z-10"
        >
          <button
            className={`w-56 py-3 px-5 rounded-full ${
              canClaim
                ? "bg-gradient-to-b from-gray-300 to-gray-400 text-gray-800"
                : "bg-gradient-to-b from-gray-700 to-gray-800 text-gray-400"
            } font-bold text-xs shadow-lg border border-gray-300/30 relative overflow-hidden hover:scale-105 active:scale-95 transition-transform`}
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-b ${canClaim ? "from-white/30" : "from-white/10"} to-transparent opacity-70`}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent ${canClaim ? "animate-shine" : ""}`}
            />
            <div className="relative flex items-center justify-center gap-2">
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-gray-800 border-gray-400 rounded-full animate-spin" />
                  <span>{t.airdrop?.processing}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                  </svg>
                  {t.airdrop?.claimButton}
                </>
              )}
            </div>
          </button>
        </motion.div>
      )}

      {claimSuccess && (
        <div className="mt-4 p-2 bg-green-900/30 border border-green-500/30 rounded-lg text-center">
          <div className="flex items-center justify-center">
            <Coins className="mr-1 text-green-400" size={16} />
            <span className="font-medium text-green-400">{t.airdrop?.tokensClaimedSuccess}</span>
          </div>
        </div>
      )}

      {claimError && (
        <div className="mt-4 p-2 bg-red-900/30 border border-red-500/30 rounded-lg text-center">
          <span className="text-red-400">{claimError}</span>
        </div>
      )}

      {user && <BottomNav activeTab="airdrop" />}
    </main>
  )
}
