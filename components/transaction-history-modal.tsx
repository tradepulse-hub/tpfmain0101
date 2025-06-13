"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowUpRight, ArrowDownLeft, ArrowUpDown, ExternalLink, RefreshCw } from "lucide-react"
import { holdstationHistoryService } from "@/services/holdstation-history-service"
import type { Transaction } from "@/services/types"
import { useTranslation } from "@/lib/i18n"

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function TransactionHistoryModal({ isOpen, onClose, walletAddress }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetch, setRefetch] = useState(false)
  const { t } = useTranslation()
  const watcherSetupRef = useRef(false)

  // Setup real-time transaction watching
  useEffect(() => {
    if (!isOpen || !walletAddress || watcherSetupRef.current) return

    const setupWatcher = async () => {
      try {
        console.log("🔄 Setting up transaction watcher...")

        // Setup watcher with callback to trigger refetch
        await holdstationHistoryService.watchTransactions(walletAddress, () => {
          console.log("📡 New transaction detected, refetching...")
          setRefetch((prev) => !prev)
        })

        watcherSetupRef.current = true
        console.log("✅ Transaction watcher setup completed")
      } catch (error) {
        console.error("❌ Error setting up transaction watcher:", error)
      }
    }

    setupWatcher()

    // Cleanup watcher when modal closes or component unmounts
    return () => {
      if (watcherSetupRef.current) {
        holdstationHistoryService.stopWatching(walletAddress)
        watcherSetupRef.current = false
      }
    }
  }, [isOpen, walletAddress])

  // Load transactions when modal opens or refetch is triggered
  useEffect(() => {
    if (isOpen && walletAddress) {
      loadTransactions()
    }
  }, [isOpen, walletAddress, refetch])

  const loadTransactions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("📜 Loading transactions for modal...")

      // Use Holdstation service to fetch transactions
      const fetchedTransactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, 50)

      setTransactions(fetchedTransactions)
      console.log(`✅ Loaded ${fetchedTransactions.length} transactions`)
    } catch (error) {
      console.error("❌ Error loading transactions:", error)
      setError("Erro ao carregar histórico de transações")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (isLoading || !walletAddress) return

    console.log("🔄 Manual refresh triggered")
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

  const formatAddress = (address: string) => {
    if (!address) return ""
    if (address.length < 10) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">{t.history?.title || "Transaction History"}</h3>
                <p className="text-xs text-gray-400 mt-1">{formatAddress(walletAddress)} • Powered by Holdstation</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Refresh transactions"
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{getTransactionTypeText(tx.type)}</div>
                          <div className="text-xs text-gray-400">
                            {formatTime(tx.timestamp)} • Block {tx.blockNumber}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-medium ${
                            tx.type === "receive"
                              ? "text-green-400"
                              : tx.type === "send"
                                ? "text-red-400"
                                : "text-blue-400"
                          }`}
                        >
                          {tx.type === "send" ? "-" : "+"}
                          {Number.parseFloat(tx.amount).toLocaleString()} {tx.tokenSymbol}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              tx.status === "completed"
                                ? "bg-green-900/20 text-green-400"
                                : "bg-yellow-900/20 text-yellow-400"
                            }`}
                          >
                            {tx.status}
                          </span>
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
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-sm">{t.history?.noTransactions || "No recent transactions"}</div>
                    <div className="text-xs mt-2 text-gray-500">
                      Transactions will appear here when detected by Holdstation SDK
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
