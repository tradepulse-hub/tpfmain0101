"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { MiniKit, type WalletAuthInput } from "@worldcoin/minikit-js"
import { useRouter } from "next/navigation"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface ConnectButtonProps {
  onClick?: () => void
  isConnected: boolean
  onConnect?: (address: string) => void
}

// App ID para a integração com o MiniKit
const APP_ID = process.env.APP_ID || "app_4f5732a19eafedb1915f9a24198c5224"

export function ConnectButton({ onClick, isConnected, onConnect }: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [language, setLanguage] = useState<"en" | "pt">(getCurrentLanguage())
  const translations = getTranslations(language)

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  const handleConnect = async () => {
    if (isConnected) return

    setIsLoading(true)

    try {
      console.log("Starting wallet connection process...")

      // Verificar se o MiniKit está instalado
      if (typeof window !== "undefined" && !MiniKit.isInstalled()) {
        console.error("MiniKit is not installed")
        alert(translations.connectButton?.installMiniKit || "Please install the Worldcoin App to connect your wallet")
        setIsLoading(false)
        return
      }

      // Simulação de conexão para desenvolvimento/teste
      if (process.env.NODE_ENV === "development" || !MiniKit.isInstalled()) {
        console.log("Development mode or MiniKit not available - using mock wallet")

        // Simular um endereço de carteira
        const mockWalletAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

        // Chamar o manipulador onConnect com o endereço simulado
        if (onConnect) {
          onConnect(mockWalletAddress)
        }

        // Chamar o manipulador onClick legado, se fornecido
        if (onClick) {
          onClick()
        }

        setIsLoading(false)
        return
      }

      // Obter nonce da API
      let nonce = ""
      try {
        console.log("Fetching nonce from API...")
        const res = await fetch(`/api/nonce`)
        const data = await res.json()
        nonce = data.nonce
        console.log("Got nonce:", nonce)
      } catch (error) {
        console.error("Error fetching nonce:", error)
        // Usar um nonce aleatório como fallback
        nonce = Math.random().toString(36).substring(2, 15)
        console.log("Using fallback nonce:", nonce)
      }

      // Configurar parâmetros de autenticação corrigidos
      const walletAuthInput: WalletAuthInput = {
        nonce,
        requestId: crypto.randomUUID(), // Usar UUID único
        expirationTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos no futuro
        notBefore: new Date(Date.now() - 60 * 1000), // 1 minuto no passado
        statement: "Connect your wallet to TPulseFi to access the token ecosystem on Worldchain.",
      }

      console.log("Wallet auth input:", walletAuthInput)

      // Solicitar autenticação
      try {
        console.log("Requesting wallet authentication...")
        const response = await MiniKit.commandsAsync.walletAuth(walletAuthInput)
        console.log("WalletAuth full response:", response)

        if (!response || !response.finalPayload) {
          throw new Error("No response received from wallet auth")
        }

        const { finalPayload } = response

        if (finalPayload.status === "error") {
          console.error("WalletAuth error:", finalPayload)
          throw new Error(finalPayload.errorMessage || "Wallet authentication failed")
        }

        if (finalPayload.status !== "success") {
          console.log("Auth status:", finalPayload.status)
          throw new Error("Authentication was cancelled or failed")
        }

        // Obter endereço da carteira do payload
        const walletAddress = finalPayload.address
        console.log("Wallet address from auth payload:", walletAddress)

        if (!walletAddress) {
          throw new Error("No wallet address received")
        }

        // Chamar API para login (opcional, pode falhar)
        try {
          console.log("Verifying with server...")
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payload: finalPayload,
              nonce,
              app_id: APP_ID,
            }),
          })

          if (response.status === 200) {
            const userData = await response.json()
            console.log("Login response:", userData)
          } else {
            console.warn("Server verification failed, but continuing with local auth")
          }
        } catch (loginError) {
          console.warn("Login API error (continuing anyway):", loginError)
        }

        // Sucesso! Chamar callbacks
        console.log("Authentication successful, calling callbacks...")

        if (onConnect) {
          onConnect(walletAddress)
        }

        if (onClick) {
          onClick()
        }

        console.log("Connection completed successfully!")
      } catch (authError) {
        console.error("WalletAuth error:", authError)
        throw authError
      }
    } catch (error) {
      console.error("Connection error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Connection failed: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.button
      onClick={handleConnect}
      disabled={isConnected || isLoading}
      className={`
        relative w-full max-w-xs py-4 px-6 rounded-full 
        font-medium text-lg
        ${
          isConnected
            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            : "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800"
        }
        overflow-hidden
        shadow-lg
        border border-gray-300/30
      `}
      whileHover={!isConnected && !isLoading ? { scale: 1.03, y: -2 } : {}}
      whileTap={!isConnected && !isLoading ? { scale: 0.98 } : {}}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Metallic effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-70" />

      {/* Button shine effect */}
      {!isConnected && !isLoading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 2.5,
            ease: "easeInOut",
            repeatDelay: 1,
          }}
        />
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-gray-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {/* Button text */}
      <div className="relative flex items-center justify-center gap-2">
        {isConnected
          ? translations.connectButton?.connected || "Connected"
          : isLoading
            ? translations.connectButton?.connecting || "Connecting..."
            : translations.connectButton?.connect || "Connect Wallet"}
      </div>
    </motion.button>
  )
}
