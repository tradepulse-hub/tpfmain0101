"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { motion } from "framer-motion"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useProgress, Html, Preload } from "@react-three/drei"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { TPFLogoModel } from "@/components/tpf-logo-model"
import { Coins, RefreshCw, Info, Copy, Bug } from "lucide-react"
import type * as THREE from "three"
import { useRouter } from "next/navigation"
import { getAirdropStatus, getContractBalance } from "@/lib/airdropService"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import { MiniKit, type VerifyCommandInput, VerificationLevel, type ISuccessResult } from "@worldcoin/minikit-js"

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

  // Debug states
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [currentActionIndex, setCurrentActionIndex] = useState(0)

  // Lista de actions para testar
  const actionsToTest = ["claim", "airdrop", "claim-tpf", "claim-tokens", "tpf-claim", "daily-claim", "token-claim"]

  const router = useRouter()
  const t = getTranslations(language)

  // Debug function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage, data || "")
    setDebugLogs((prev) => [...prev, logMessage + (data ? ` | Data: ${JSON.stringify(data)}` : "")])
    if (data) {
      setDebugData((prev) => ({ ...prev, [message]: data }))
    }
  }

  // Copy debug info to clipboard
  const copyDebugInfo = async () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      userAddress,
      logs: debugLogs,
      debugData,
      error: claimError,
      miniKitInstalled: MiniKit.isInstalled(),
      userAgent: navigator.userAgent,
      currentAction: actionsToTest[currentActionIndex],
      allActionsToTest: actionsToTest,
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      alert("Debug info copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy debug info:", err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, 3000)

    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        addDebugLog("Starting authentication check")
        const response = await fetch("/api/auth/session")
        addDebugLog("Auth response status", response.status)

        if (response.ok) {
          const data = await response.json()
          addDebugLog("Auth response data", data)

          if (data.user) {
            setUser(data.user)
            setUserAddress(data.user.walletAddress)
            addDebugLog("User authenticated", { address: data.user.walletAddress })
          } else {
            addDebugLog("No user in response, redirecting to login")
            router.push("/")
          }
        } else {
          addDebugLog("Auth response not OK, redirecting to login")
          router.push("/")
        }
      } catch (error) {
        addDebugLog("Auth error", error)
        console.error("Erro ao verificar autenticação:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    // Obter o idioma atual
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)
    addDebugLog("Language set", currentLang)

    // Check MiniKit installation
    addDebugLog("MiniKit installed", MiniKit.isInstalled())
    addDebugLog("User Agent", navigator.userAgent)

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
      addDebugLog("Fetching contract balance...")
      const balanceData = await getContractBalance()
      addDebugLog("Contract balance response", balanceData)

      if (balanceData.success) {
        setContractBalance(balanceData.balance)
        setFormattedBalance(Number(balanceData.balance).toLocaleString())
        setApiError(null)
      } else {
        addDebugLog("Contract balance error", balanceData.error)
        setApiError(balanceData.error || "Failed to fetch contract balance")
      }
    } catch (error) {
      addDebugLog("Contract balance fetch error", error)
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
      addDebugLog("Checking claim status for address", userAddress)
      const statusData = await getAirdropStatus(userAddress)
      addDebugLog("Airdrop status response", statusData)

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

            addDebugLog("Setting countdown", { hours, minutes, seconds })
            setTimeLeft({ hours, minutes, seconds })
          } else {
            addDebugLog("Time remaining is zero or negative, rechecking...")
            setTimeout(checkClaimStatus, 1000)
          }
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
        }
      } else {
        addDebugLog("Airdrop status error", statusData.error)
        setApiError(statusData.error || "Failed to fetch airdrop status")
      }
    } catch (error) {
      addDebugLog("Claim status check error", error)
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

  // Função para testar próxima action
  const tryNextAction = () => {
    if (currentActionIndex < actionsToTest.length - 1) {
      setCurrentActionIndex(currentActionIndex + 1)
      addDebugLog("Switching to next action", actionsToTest[currentActionIndex + 1])
    } else {
      addDebugLog("All actions tested, resetting to first")
      setCurrentActionIndex(0)
    }
  }

  // Função de claim com World ID + Airdrop
  const handleClaim = async () => {
    if (!canClaim || isClaiming || isContractBalanceLow) return

    try {
      setIsClaiming(true)
      setClaimError(null)
      setClaimSuccess(false)
      setTxId(null)
      setDebugLogs([]) // Clear previous logs

      const currentAction = actionsToTest[currentActionIndex]

      addDebugLog("=== STARTING CLAIM PROCESS ===")
      addDebugLog("User address", userAddress)
      addDebugLog("Can claim", canClaim)
      addDebugLog("Contract balance low", isContractBalanceLow)
      addDebugLog("Current action being tested", currentAction)
      addDebugLog("Action index", `${currentActionIndex + 1}/${actionsToTest.length}`)

      // Verificar se MiniKit está instalado
      addDebugLog("Checking MiniKit installation...")
      const miniKitInstalled = MiniKit.isInstalled()
      addDebugLog("MiniKit installed", miniKitInstalled)

      if (!miniKitInstalled) {
        const errorMsg = "World App is required for verification. Please install World App."
        addDebugLog("MiniKit not installed", errorMsg)
        setClaimError(errorMsg)
        return
      }

      // PASSO 1: Verificação World ID
      addDebugLog("=== STEP 1: World ID Verification ===")

      const verifyPayload: VerifyCommandInput = {
        action: currentAction,
        signal: userAddress,
        verification_level: VerificationLevel.Orb,
      }

      addDebugLog("Verify payload", verifyPayload)
      addDebugLog("Starting World ID verification...")

      const verifyResult = await MiniKit.commandsAsync.verify(verifyPayload)
      addDebugLog("World ID verification result", verifyResult)

      const { finalPayload } = verifyResult
      addDebugLog("Final payload", finalPayload)

      if (finalPayload.status === "error") {
        addDebugLog("World ID verification failed", finalPayload)

        // Se for malformed_request, tentar próxima action automaticamente
        if (finalPayload.error_code === "malformed_request") {
          addDebugLog("Malformed request detected, will try next action")

          let errorMessage = `Action "${currentAction}" failed with malformed_request. `

          if (currentActionIndex < actionsToTest.length - 1) {
            errorMessage += `Click "Try Next Action" to test "${actionsToTest[currentActionIndex + 1]}".`
          } else {
            errorMessage += "All actions tested. Please check your World ID Portal configuration."
          }

          setClaimError(errorMessage)
          return
        }

        // Outros tipos de erro
        let errorMessage = "World ID verification failed"
        switch (finalPayload.error_code) {
          case "already_verified":
            errorMessage = "You have already verified for this action."
            break
          case "verification_rejected":
            errorMessage = "Verification was rejected or cancelled."
            break
          default:
            errorMessage = `World ID error: ${finalPayload.error_code || "Unknown error"}`
        }

        setClaimError(errorMessage)
        return
      }

      addDebugLog("World ID verification successful!")

      // PASSO 2: Verificar a prova no backend
      addDebugLog("=== STEP 2: Backend Verification ===")

      const verifyRequestBody = {
        payload: finalPayload as ISuccessResult,
        action: currentAction,
        signal: userAddress,
      }

      addDebugLog("Verify request body", verifyRequestBody)

      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyRequestBody),
      })

      addDebugLog("Verify response status", verifyResponse.status)
      addDebugLog("Verify response headers", Object.fromEntries(verifyResponse.headers.entries()))

      const verifyResponseJson = await verifyResponse.json()
      addDebugLog("Verify response JSON", verifyResponseJson)

      if (!verifyResponseJson.success) {
        addDebugLog("Backend verification failed", verifyResponseJson)

        // Se for erro de action não encontrada, tentar próxima action
        if (
          verifyResponseJson.details?.code === "action_not_found" ||
          verifyResponseJson.error?.includes("action") ||
          verifyResponseJson.status === 404
        ) {
          let errorMessage = `Action "${currentAction}" not found in World ID Portal. `

          if (currentActionIndex < actionsToTest.length - 1) {
            errorMessage += `Click "Try Next Action" to test "${actionsToTest[currentActionIndex + 1]}".`
          } else {
            errorMessage += "All actions tested. Please check your World ID Portal configuration."
          }

          setClaimError(errorMessage)
          return
        }

        setClaimError(`Verification failed: ${verifyResponseJson.error || "Unknown backend error"}`)
        return
      }

      addDebugLog("Backend verification successful!")

      // PASSO 3: Processar o airdrop
      addDebugLog("=== STEP 3: Processing Airdrop ===")

      const airdropRequestBody = {
        userAddress: userAddress,
        worldIdVerified: true,
      }

      addDebugLog("Airdrop request body", airdropRequestBody)

      const airdropResponse = await fetch("/api/airdrop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(airdropRequestBody),
      })

      addDebugLog("Airdrop response status", airdropResponse.status)

      const airdropResult = await airdropResponse.json()
      addDebugLog("Airdrop response JSON", airdropResult)

      if (airdropResult.success) {
        addDebugLog("=== CLAIM SUCCESSFUL ===")
        setClaimSuccess(true)
        setTxId(airdropResult.txId)

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
        addDebugLog("Airdrop processing failed", airdropResult)
        setClaimError(airdropResult.error || "Failed to process airdrop. Please try again.")
      }
    } catch (error) {
      addDebugLog("=== CLAIM ERROR ===", error)
      console.error("Error during claim process:", error)
      setClaimError(error instanceof Error ? error.message : "An error occurred during the claim. Please try again.")
    } finally {
      setIsClaiming(false)
      addDebugLog("=== CLAIM PROCESS ENDED ===")
    }
  }

  const formatTime = (time: number) => {
    return time < 10 ? `0${time}` : time
  }

  // Verificar se o saldo do contrato é suficiente
  const isContractBalanceLow = Number(contractBalance) <= 2000

  return (
    <main className="relative flex min-h-screen flex-col items-center pt-6 pb-20 overflow-hidden">
      <BackgroundEffect />

      {/* Debug Panel */}
      {showDebug && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg p-4 max-h-96 overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold">Debug Console</h3>
            <div className="flex gap-2">
              <button
                onClick={copyDebugInfo}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Copy debug info"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={() => setShowDebug(false)} className="text-red-400 hover:text-red-300 transition-colors">
                ✕
              </button>
            </div>
          </div>

          {/* Action Tester */}
          <div className="mb-4 p-2 bg-gray-800 rounded">
            <div className="text-white text-sm mb-2">
              Testing Action: <span className="text-yellow-400">{actionsToTest[currentActionIndex]}</span>
              <span className="text-gray-400">
                {" "}
                ({currentActionIndex + 1}/{actionsToTest.length})
              </span>
            </div>
            <button
              onClick={tryNextAction}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
            >
              Try Next Action: {actionsToTest[(currentActionIndex + 1) % actionsToTest.length]}
            </button>
          </div>

          <div className="text-xs text-gray-300 space-y-1 font-mono">
            {debugLogs.map((log, index) => (
              <div key={index} className="break-all">
                {log}
              </div>
            ))}
          </div>
        </motion.div>
      )}

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

        {/* Debug Toggle Button */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-300 transition-colors"
          title="Toggle debug console"
        >
          <Bug className="h-4 w-4" />
        </button>
      </motion.div>

      {/* Action Tester Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="w-full max-w-md px-4 mb-4 relative z-10"
      >
        <div className="bg-purple-900/20 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30">
          <div className="flex items-start gap-2">
            <Bug className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-purple-200 text-xs leading-relaxed">
                Testing action: <span className="font-mono text-yellow-300">"{actionsToTest[currentActionIndex]}"</span>
              </p>
              <p className="text-purple-300 text-xs mt-1">
                {currentActionIndex + 1} of {actionsToTest.length} actions tested
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TPulseFi Control Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="w-full max-w-md px-4 mb-4 relative z-10"
      >
        <div className="bg-blue-900/20 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-200 text-xs leading-relaxed">
              Currently under maintenance, we promise to be brief.
            </p>
          </div>
        </div>
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
          className="mt-6 relative z-10 flex flex-col items-center gap-3"
        >
          <button
            className={`w-56 py-3 px-5 rounded-full ${
              canClaim && !isContractBalanceLow
                ? "bg-gradient-to-b from-gray-300 to-gray-400 text-gray-800"
                : "bg-gradient-to-b from-gray-700 to-gray-800 text-gray-400"
            } font-bold text-xs shadow-lg border border-gray-300/30 relative overflow-hidden hover:scale-105 active:scale-95 transition-transform`}
            onClick={handleClaim}
            disabled={!canClaim || isClaiming || isContractBalanceLow}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-b ${canClaim && !isContractBalanceLow ? "from-white/30" : "from-white/10"} to-transparent opacity-70`}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent ${canClaim && !isContractBalanceLow ? "animate-shine" : ""}`}
            />

            <div className="relative flex items-center justify-center gap-2">
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-gray-800 border-gray-400 rounded-full animate-spin" />
                  <span>{t.airdrop?.processing}</span>
                </>
              ) : isContractBalanceLow ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  INSUFFICIENT BALANCE
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M9.375 3a1.875 1.875 0 000 3.75h1.875v4.5H3.375A1.875 0 011.5 9.375v-.75c0-1.036.84-1.875 1.875-1.875h3.193A3.375 3.375 0 0112 2.753a3.375 3.375 0 015.432 3.997h3.943c1.035 0 1.875.84 1.875 1.875v.75c0 1.036-.84 1.875-1.875 1.875H12.75v-4.5h1.875a1.875 1.875 0 10-1.875-1.875V6.75h-1.5V4.875C11.25 3.839 10.41 3 9.375 3zM11.25 12.75H3v6.75a2.25 2.25 0 002.25 2.25h6v-9zM12.75 12.75v9h6.75a2.25 2.25 0 002.25-2.25v-6.75h-9z" />
                  </svg>
                  {t.airdrop?.claimButton}
                </>
              )}
            </div>
          </button>

          {/* Try Next Action Button */}
          {claimError && claimError.includes("malformed_request") && (
            <button
              onClick={tryNextAction}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-full transition-colors"
            >
              Try Next Action: {actionsToTest[(currentActionIndex + 1) % actionsToTest.length]}
            </button>
          )}
        </motion.div>
      )}

      {isContractBalanceLow && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-center max-w-md">
          <div className="flex items-center justify-center mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-yellow-400 mr-2"
            >
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="font-medium text-yellow-400">Airdrop Depleted</span>
          </div>
          <p className="text-yellow-200 text-xs">
            The airdrop balance has run out, come back tomorrow for more rewards!
          </p>
        </div>
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
        <div className="mt-4 p-2 bg-red-900/30 border border-red-500/30 rounded-lg text-center max-w-md">
          <div className="flex items-center justify-center gap-2">
            <span className="text-red-400 text-xs break-all">{claimError}</span>
            <button
              onClick={copyDebugInfo}
              className="text-red-300 hover:text-red-200 transition-colors flex-shrink-0"
              title="Copy error details"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {user && <BottomNav activeTab="airdrop" />}
    </main>
  )
}
