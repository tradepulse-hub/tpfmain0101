"use client"

import { useState, useEffect } from "react"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw } from "lucide-react"

interface Transaction {
  id: string
  type: "send" | "receive"
  amount: number
  date: string
  address: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)

            // Simular carregamento de saldo e transações
            setTimeout(() => {
              setBalance(1250.75)
              setTransactions([
                {
                  id: "tx1",
                  type: "receive",
                  amount: 500,
                  date: "2025-05-16T14:30:00",
                  address: "0x1a2b...3c4d",
                },
                {
                  id: "tx2",
                  type: "send",
                  amount: 120.5,
                  date: "2025-05-15T10:15:00",
                  address: "0x5e6f...7g8h",
                },
                {
                  id: "tx3",
                  type: "receive",
                  amount: 871.25,
                  date: "2025-05-14T18:45:00",
                  address: "0x9i0j...1k2l",
                },
              ])
              setLoading(false)
            }, 1500)
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
      }
    }

    checkAuth()
  }, [router])

  const formatAddress = (address: string) => {
    if (!address) return ""
    if (address.length < 10) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 relative overflow-hidden pb-20">
      <BackgroundEffect />

      <div className="z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {user && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-gray-300" />
                </div>
                <span className="text-sm text-gray-300">{formatAddress(user.walletAddress)}</span>
              </div>
            )}
          </div>

          {/* Saldo */}
          <Card className="w-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 mb-6">
            <CardHeader className="pb-2">
              <CardDescription>Seu saldo</CardDescription>
              {loading ? (
                <div className="h-8 w-32 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                <CardTitle className="text-3xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-white">
                    {balance.toLocaleString("pt-BR", { style: "currency", currency: "USD" })}
                  </span>
                </CardTitle>
              )}
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
                <Button variant="outline" className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700">
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Receber
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transações recentes */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Transações recentes</h2>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <Card key={tx.id} className="bg-gray-800/80 border border-gray-700">
                    <CardContent className="p-3">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === "receive" ? "bg-green-500/20" : "bg-red-500/20"
                          }`}
                        >
                          {tx.type === "receive" ? (
                            <ArrowDownLeft className={`w-5 h-5 text-green-400`} />
                          ) : (
                            <ArrowUpRight className={`w-5 h-5 text-red-400`} />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <div className="font-medium">{tx.type === "receive" ? "Recebido" : "Enviado"}</div>
                            <div className={`font-medium ${tx.type === "receive" ? "text-green-400" : "text-red-400"}`}>
                              {tx.type === "receive" ? "+" : "-"}
                              {tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "USD" })}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(tx.date)}
                            </div>
                            <div>{formatAddress(tx.address)}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Mostrar a barra de navegação apenas quando o usuário estiver autenticado */}
      {user && <BottomNav activeTab="wallet" />}
    </main>
  )
}
