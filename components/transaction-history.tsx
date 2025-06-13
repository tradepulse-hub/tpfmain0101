"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ExternalLink, ArrowUpDown } from "lucide-react"
import { walletService } from "@/services/wallet-service"
import type { Transaction } from "@/services/types"
import { useTranslation } from "@/lib/i18n"

interface TransactionHistoryProps {
  walletAddress: string
  daysToShow?: number
  tokenFilter?: string
}

export function TransactionHistory({ walletAddress, daysToShow = 7, tokenFilter }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (!walletAddress) return
    loadTransactions()
  }, [walletAddress, tokenFilter, daysToShow])

  const loadTransactions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Loading transactions...")
      let fetchedTransactions = await walletService.getTransactionHistory(walletAddress, 50)

      // Filter by token if specified
      if (tokenFilter) {
        fetchedTransactions = fetchedTransactions.filter((tx) => tx.tokenSymbol === tokenFilter)
      }

      // Filter by period if specified
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (isLoading || !walletAddress) return
    await loadTransactions()
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
        return t.history?.sent || "Sent"
      case "receive":
        return t.history?.received || "Received"
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
        <h3 className="text-white font-medium">
          {tokenFilter ? `Histórico ${tokenFilter}` : t.history?.title || "Recent Activity"}
        </h3>
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
              {tokenFilter
                ? `Nenhuma transação ${tokenFilter} encontrada`
                : t.history?.noTransactions || "No recent transactions"}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
