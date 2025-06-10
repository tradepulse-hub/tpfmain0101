"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, ArrowUpDown } from "lucide-react"
import { holdstationHistoryService, type Transaction } from "@/services/holdstation-history-service"

interface TransactionHistoryProps {
  walletAddress: string
  daysToShow?: number
  tokenFilter?: string // Filtrar por token específico
}

export function TransactionHistory({ walletAddress, daysToShow = 7, tokenFilter }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetch, setRefetch] = useState(false)
  const stopWatcherRef = useRef<(() => void) | null>(null)

  // Efeito para carregar transações e configurar watcher
  useEffect(() => {
    if (!walletAddress) return

    // Função para carregar transações
    const loadTransactions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("Loading transactions from Holdstation...")

        let fetchedTransactions: Transaction[]

        if (tokenFilter) {
          // Obter transações de um token específico
          fetchedTransactions = await holdstationHistoryService.getTokenTransactions(walletAddress, tokenFilter, 50)
        } else {
          // Obter todas as transações
          fetchedTransactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, 50)
        }

        // Filtrar por período se especificado
        if (daysToShow > 0) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - daysToShow)

          fetchedTransactions = fetchedTransactions.filter((tx) => tx.timestamp >= cutoffDate)
        }

        setTransactions(fetchedTransactions)
        console.log(`Loaded ${fetchedTransactions.length} transactions`)
      } catch (error) {
        console.error("Error loading transactions:", error)
        setError("Erro ao carregar histórico de transações")

        // Fallback para transações mock
        setTransactions(getMockTransactions())
      } finally {
        setIsLoading(false)
      }
    }

    // Função para configurar watcher
    const setupWatcher = async () => {
      try {
        console.log("Setting up transaction watcher...")

        // Configurar watcher seguindo a documentação
        const watcher = await holdstationHistoryService.watchTransactions(walletAddress, () => {
          console.log("New transaction detected, refreshing...")
          setRefetch((prev) => !prev) // Trigger refetch
        })

        if (watcher) {
          // Iniciar o watcher e salvar a função de parada
          await watcher.start()
          stopWatcherRef.current = watcher.stop
        }
      } catch (error) {
        console.error("Error setting up transaction watcher:", error)
      }
    }

    // Carregar transações e configurar watcher
    loadTransactions()
    setupWatcher()

    // Cleanup
    return () => {
      if (stopWatcherRef.current) {
        stopWatcherRef.current()
        stopWatcherRef.current = null
      }
    }
  }, [walletAddress, tokenFilter, daysToShow])

  // Efeito para recarregar quando refetch mudar
  useEffect(() => {
    if (refetch && walletAddress) {
      const loadTransactions = async () => {
        try {
          console.log("Reloading transactions due to refetch trigger...")
          const fetchedTransactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, 50)
          setTransactions(fetchedTransactions)
        } catch (error) {
          console.error("Error reloading transactions:", error)
        }
      }

      loadTransactions()
    }
  }, [refetch, walletAddress])

  // Função para recarregar manualmente
  const handleRefresh = async () => {
    if (isLoading || !walletAddress) return

    setIsLoading(true)
    try {
      const fetchedTransactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, 50)
      setTransactions(fetchedTransactions)
      setError(null)
    } catch (error) {
      console.error("Error refreshing transactions:", error)
      setError("Erro ao atualizar histórico")
    } finally {
      setIsLoading(false)
    }
  }

  // Transações mock para fallback
  const getMockTransactions = (): Transaction[] => {
    const mockTransactions: Transaction[] = [
      {
        id: "1",
        hash: "0x123...abc",
        type: "receive",
        amount: "1000",
        tokenSymbol: "TPF",
        tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
        from: "0x456...def",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: "completed",
      },
      {
        id: "2",
        hash: "0x456...def",
        type: "send",
        amount: "500",
        tokenSymbol: "TPF",
        tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
        from: walletAddress,
        to: "0x789...ghi",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "completed",
      },
      {
        id: "3",
        hash: "0x789...ghi",
        type: "swap",
        amount: "100",
        tokenSymbol: "WLD",
        tokenAddress: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        from: walletAddress,
        to: "0xabc...123",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
        status: "completed",
      },
    ]

    // Filtrar por token se especificado
    if (tokenFilter) {
      return mockTransactions.filter((tx) => tx.tokenSymbol === tokenFilter)
    }

    return mockTransactions
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "send":
        return <ArrowUpRight className="w-4 h-4 text-red-400" />
      case "receive":
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />
      case "swap":
        return <ArrowUpDown className="w-4 h-4 text-blue-400" />
      default:
        return <ArrowUpRight className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "Agora"
    if (hours < 24) return `${hours}h atrás`
    return `${Math.floor(hours / 24)}d atrás`
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case "send":
        return "Enviado"
      case "receive":
        return "Recebido"
      case "swap":
        return "Swap"
      default:
        return "Transação"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 rounded-lg border border-gray-800 p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">{tokenFilter ? `Histórico ${tokenFilter}` : "Atividade Recente"}</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <div className="text-sm text-white">{getTransactionTypeText(tx.type)}</div>
                  <div className="text-xs text-gray-400">{formatTime(tx.timestamp)}</div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-sm font-medium ${
                    tx.type === "receive" ? "text-green-400" : tx.type === "send" ? "text-red-400" : "text-blue-400"
                  }`}
                >
                  {tx.type === "send" ? "-" : "+"}
                  {Number.parseFloat(tx.amount).toLocaleString()} {tx.tokenSymbol}
                </div>
                {tx.hash && (
                  <button
                    onClick={() => window.open(`https://worldscan.org/tx/${tx.hash}`, "_blank")}
                    className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1"
                  >
                    <ExternalLink size={10} />
                    Ver
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-400">
            <div className="text-sm">
              {tokenFilter ? `Nenhuma transação ${tokenFilter} encontrada` : "Nenhuma transação recente"}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
