"use client"

import { MiniKit, type WalletAuthInput } from "@worldcoin/minikit-js"
import { useState } from "react"
import "../app/dark-theme.css"
import { walletService } from "@/services/wallet-service"

const walletAuthInput = (nonce: string): WalletAuthInput => {
  return {
    nonce,
    requestId: "0",
    expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
    statement: "Welcome to TPulseFi",
  }
}

type LoginProps = {
  onLoginSuccess?: (user: any) => void
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [loading, setLoading] = useState(false)

  // Removemos completamente a função refreshUserData e o useEffect
  // para garantir que não haja tentativa de auto login

  const handleLogin = async () => {
    try {
      setLoading(true)
      console.log("Starting login process...")

      const res = await fetch(`/api/nonce`)
      const { nonce } = await res.json()
      console.log("Got nonce:", nonce)

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth(walletAuthInput(nonce))
      console.log("WalletAuth response:", finalPayload)

      if (finalPayload.status === "error") {
        console.error("WalletAuth error:", finalPayload)
        setLoading(false)
        return
      } else {
        // Obter o endereço da carteira diretamente do payload
        const walletAddress = finalPayload.address
        console.log("Wallet address from auth payload:", walletAddress)

        // Também verificar se o MiniKit.user está disponível
        if (MiniKit.user) {
          console.log("MiniKit user after auth:", MiniKit.user)
        }

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: finalPayload,
            nonce,
          }),
        })

        if (response.status === 200) {
          const userData = await response.json()
          console.log("Login response:", userData)

          // Usar o endereço da carteira do payload ou do MiniKit.user
          const userInfo = {
            ...userData.user,
            walletAddress: walletAddress || (MiniKit.user ? MiniKit.user.walletAddress : null),
          }

          console.log("Final user info:", userInfo)

          // Inicializar o serviço de carteira
          if (userInfo && userInfo.walletAddress) {
            // Pré-carregar o saldo e as transações
            const balance = await walletService.getBalance(userInfo.walletAddress)
            console.log("Loaded balance after login:", balance)
          }

          if (onLoginSuccess) {
            onLoginSuccess(userInfo)
          }
        }
        setLoading(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full py-3 transition-all duration-200 bg-gray-800 hover:bg-gray-700"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="dark-loading-metallic mr-2"></div>
            <span className="metallic-text">Connecting...</span>
          </div>
        ) : (
          <span className="metallic-text-glow">CONNECT WALLET</span>
        )}
      </button>
    </div>
  )
}

export default Login
