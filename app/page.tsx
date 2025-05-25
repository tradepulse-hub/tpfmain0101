"use client"

import { useState, useEffect } from "react"
import { BackgroundEffect } from "@/components/background-effect"
import { Title } from "@/components/title"
import { VibratingLogo } from "@/components/vibrating-logo"
import { ConnectButton } from "@/components/connect-button"
import { BottomNav } from "@/components/bottom-nav"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const router = useRouter()

  // Verificar se o usuário já está conectado
  useEffect(() => {
    // Limpar qualquer sessão anterior ao iniciar o aplicativo
    localStorage.removeItem("walletAddress")
    setIsConnected(false)
    setWalletAddress(null)
  }, [])

  const handleConnect = (address: string) => {
    console.log("Handling connection for address:", address)
    setIsConnected(true)
    setWalletAddress(address)

    // Salvar o endereço no localStorage
    localStorage.setItem("walletAddress", address)

    // Redirecionar para o perfil após conectar
    setTimeout(() => {
      router.push("/profile")
    }, 1000)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 relative overflow-hidden">
      <BackgroundEffect />

      <div className="z-10 w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          <VibratingLogo intensity={3} />
          <Title />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-xs mt-10"
          >
            <ConnectButton isConnected={isConnected} onConnect={handleConnect} />

            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-green-400 mt-4 text-center"
              >
                Conectado! Redirecionando para o perfil...
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Mostrar a barra de navegação apenas quando o usuário estiver conectado */}
      {isConnected && <BottomNav />}
    </main>
  )
}
