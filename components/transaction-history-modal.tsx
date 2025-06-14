"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowUpRight, ArrowDownLeft, ArrowUpDown, ExternalLink, RefreshCw, Bug, Plus } from "lucide-react"
import { holdstationHistoryService } from "@/services/holdstation-history-service"
import type { Transaction } from "@/services/types"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function TransactionHistoryModal({ isOpen, onClose, walletAddress }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetch, setRefetch] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebugLogs, setShowDebugLogs] = useState(false)
  const [currentLimit, setCurrentLimit] = useState(10) // Começar com 10
  const [hasMore, setHasMore] = useState(true)
  const { t } = useTranslation()
  const watcherSetupRef = useRef(false)

  // Função helper para adicionar logs
  const addDebugLog = (message: string) => {
    console.log(message)
    setDebugLogs((prev) => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Setup real-time transaction watching
  useEffect(() => {
    if (!isOpen || !walletAddress || watcherSetupRef.current) return

    const setupWatcher = async () => {
      try {
        addDebugLog("=== CONFIGURANDO WATCHER DE TRANSAÇÕES ===")
        addDebugLog(`Endereço da carteira: ${walletAddress}`)

        // Setup watcher with callback to trigger refetch
        await holdstationHistoryService.watchTransactions(walletAddress, () => {
          addDebugLog("📡 Nova transação detectada pelo watcher!")
          setRefetch((prev) => !prev)
        })

        watcherSetupRef.current = true
        addDebugLog("✅ Watcher de transações configurado com sucesso")
      } catch (error) {
        addDebugLog(`❌ Erro ao configurar watcher: ${error.message}`)
        console.error("❌ Error setting up transaction watcher:", error)
      }
    }

    setupWatcher()

    // Cleanup watcher when modal closes or component unmounts
    return () => {
      if (watcherSetupRef.current) {
        addDebugLog("🧹 Limpando watcher de transações...")
        holdstationHistoryService.stopWatching(walletAddress)
        watcherSetupRef.current = false
      }
    }
  }, [isOpen, walletAddress])

  // Load transactions when modal opens or refetch is triggered
  useEffect(() => {
    if (isOpen && walletAddress) {
      // Reset quando abrir o modal
      setCurrentLimit(10)
      setHasMore(true)
      setTransactions([])
      loadTransactions(10, true) // true = reset
    }
  }, [isOpen, walletAddress, refetch])

  const loadTransactions = async (limit: number = currentLimit, reset = false) => {
    if (reset) {
      setIsLoading(true)
      setTransactions([])
    } else {
      setIsLoadingMore(true)
    }

    setError(null)

    try {
      addDebugLog(`=== CARREGANDO HISTÓRICO DE TRANSAÇÕES ===`)
      addDebugLog(`Endereço: ${walletAddress}`)
      addDebugLog(`Limite: ${limit} transações`)
      addDebugLog(`Reset: ${reset}`)

      // Verificar se o serviço Holdstation está disponível
      addDebugLog("🔍 Verificando disponibilidade do serviço Holdstation...")

      if (!holdstationHistoryService) {
        addDebugLog("❌ Serviço Holdstation não está disponível")
        throw new Error("Holdstation service not available")
      }

      addDebugLog("✅ Serviço Holdstation disponível")

      // Use Holdstation service to fetch transactions
      addDebugLog("📡 Fazendo chamada para holdstationHistoryService.getTransactionHistory...")
      const fetchedTransactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, limit)

      addDebugLog(`📊 Resposta recebida: ${fetchedTransactions.length} transações`)
      addDebugLog(`Dados brutos: ${JSON.stringify(fetchedTransactions.slice(0, 2), null, 2)}`)

      // Processar e validar transações
      addDebugLog("🔄 Processando transações...")
      const validTransactions = fetchedTransactions.filter((tx) => {
        const isValid = tx.id && tx.hash && tx.type && tx.amount && tx.tokenSymbol
        if (!isValid) {
          addDebugLog(`⚠️ Transação inválida filtrada: ${JSON.stringify(tx)}`)
        }
        return isValid
      })

      addDebugLog(`✅ ${validTransactions.length} transações válidas após filtro`)

      // Ordenar por timestamp (mais recente primeiro)
      validTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      addDebugLog("📅 Transações ordenadas por timestamp")

      if (reset) {
        setTransactions(validTransactions)
      } else {
        // Adicionar novas transações evitando duplicatas
        setTransactions((prev) => {
          const existingHashes = new Set(prev.map((tx) => tx.hash))
          const newTransactions = validTransactions.filter((tx) => !existingHashes.has(tx.hash))
          return [...prev, ...newTransactions]
        })
      }

      // Verificar se há mais transações
      setHasMore(validTransactions.length >= limit)

      addDebugLog(`✅ Estado atualizado com ${validTransactions.length} transações`)

      // Log detalhado das primeiras transações
      if (validTransactions.length > 0) {
        addDebugLog("=== PRIMEIRAS 5 TRANSAÇÕES ===")
        validTransactions.slice(0, 5).forEach((tx, index) => {
          addDebugLog(`${index + 1}. ${tx.type.toUpperCase()} - ${tx.amount} ${tx.tokenSymbol} - ${tx.hash}`)
        })
      }

      // Log resumo por token
      const tokenSummary = validTransactions.reduce(
        (acc, tx) => {
          acc[tx.tokenSymbol] = (acc[tx.tokenSymbol] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
      addDebugLog(`📊 Resumo por token: ${JSON.stringify(tokenSummary)}`)
    } catch (error) {
      addDebugLog("=== ERRO AO CARREGAR TRANSAÇÕES ===")
      addDebugLog(`Tipo do erro: ${typeof error}`)
      addDebugLog(`Mensagem: ${error.message}`)
      addDebugLog(`Stack: ${error.stack}`)

      console.error("❌ Error loading transactions:", error)
      setError("Erro ao carregar histórico de transações")

      // Tentar carregar transações mock como fallback
      addDebugLog("🔄 Tentando carregar transações mock como fallback...")
      try {
        const mockTransactions = await loadMockTransactions()
        if (reset) {
          setTransactions(mockTransactions)
        } else {
          setTransactions((prev) => [...prev, ...mockTransactions])
        }
        addDebugLog(`✅ ${mockTransactions.length} transações mock carregadas`)
      } catch (mockError) {
        addDebugLog(`❌ Erro ao carregar mock: ${mockError.message}`)
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      addDebugLog("=== FIM DO CARREGAMENTO ===")
    }
  }

  const loadMockTransactions = async (): Promise<Transaction[]> => {
    addDebugLog("📝 Gerando transações mock com TODOS os tokens...")

    const mockTransactions: Transaction[] = [
      // TPF Transactions
      {
        id: "mock_tpf_1",
        hash: "0x123...abc",
        type: "receive",
        amount: "1000.0",
        tokenSymbol: "TPF",
        tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
        from: "0x456...def",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: "completed",
        blockNumber: 12345,
      },
      {
        id: "mock_tpf_2",
        hash: "0x456...def",
        type: "send",
        amount: "500.0",
        tokenSymbol: "TPF",
        tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
        from: walletAddress,
        to: "0x789...ghi",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "completed",
        blockNumber: 12344,
      },
      // WLD Transactions
      {
        id: "mock_wld_1",
        hash: "0x789...ghi",
        type: "receive",
        amount: "25.5",
        tokenSymbol: "WLD",
        tokenAddress: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        from: "0xabc...123",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
        status: "completed",
        blockNumber: 12343,
      },
      {
        id: "mock_wld_2",
        hash: "0xabc...123",
        type: "send",
        amount: "10.0",
        tokenSymbol: "WLD",
        tokenAddress: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        from: walletAddress,
        to: "0xdef...456",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
        status: "completed",
        blockNumber: 12342,
      },
      // DNA Transactions
      {
        id: "mock_dna_1",
        hash: "0xdef...456",
        type: "receive",
        amount: "2500.0",
        tokenSymbol: "DNA",
        tokenAddress: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
        from: "0x111...222",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18),
        status: "completed",
        blockNumber: 12341,
      },
      {
        id: "mock_dna_2",
        hash: "0x111...222",
        type: "send",
        amount: "1000.0",
        tokenSymbol: "DNA",
        tokenAddress: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
        from: walletAddress,
        to: "0x333...444",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
        status: "completed",
        blockNumber: 12340,
      },
      // WDD Transactions
      {
        id: "mock_wdd_1",
        hash: "0x333...444",
        type: "receive",
        amount: "150.0",
        tokenSymbol: "WDD",
        tokenAddress: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
        from: "0x555...666",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        status: "completed",
        blockNumber: 12339,
      },
      {
        id: "mock_wdd_2",
        hash: "0x555...666",
        type: "send",
        amount: "75.0",
        tokenSymbol: "WDD",
        tokenAddress: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
        from: walletAddress,
        to: "0x777...888",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
        status: "completed",
        blockNumber: 12338,
      },
      // Swap Transactions
      {
        id: "mock_swap_1",
        hash: "0x777...888",
        type: "swap",
        amount: "100.0",
        tokenSymbol: "WLD",
        tokenAddress: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        from: walletAddress,
        to: "0x999...aaa",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30),
        status: "completed",
        blockNumber: 12337,
      },
      {
        id: "mock_swap_2",
        hash: "0x999...aaa",
        type: "swap",
        amount: "500.0",
        tokenSymbol: "TPF",
        tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
        from: walletAddress,
        to: "0xbbb...ccc",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 54),
        status: "completed",
        blockNumber: 12336,
      },
    ]

    addDebugLog(`Mock gerado: ${mockTransactions.length} transações`)
    addDebugLog(`Tokens incluídos: TPF, WLD, DNA, WDD`)
    addDebugLog(`Tipos incluídos: RECEIVE, SEND, SWAP`)
    return mockTransactions
  }

  const handleRefresh = async () => {
    if (isLoading || !walletAddress) return

    addDebugLog("🔄 Refresh manual acionado")
    setCurrentLimit(10)
    setHasMore(true)
    await loadTransactions(10, true) // Reset
  }

  const handleLoadMore = async () => {
    if (isLoadingMore || !walletAddress || !hasMore) return

    addDebugLog("➕ Load More acionado")
    const newLimit = currentLimit + 10
    setCurrentLimit(newLimit)
    await loadTransactions(newLimit, false) // Não reset
  }

  const inspectHoldstationService = () => {
    addDebugLog("=== INSPEÇÃO DO SERVIÇO HOLDSTATION ===")

    try {
      if (holdstationHistoryService) {
        addDebugLog("✅ holdstationHistoryService está disponível")

        // Verificar métodos disponíveis
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(holdstationHistoryService))
        addDebugLog(`Métodos disponíveis: ${methods.join(", ")}`)

        // Verificar se getTransactionHistory existe
        if (typeof holdstationHistoryService.getTransactionHistory === "function") {
          addDebugLog("✅ getTransactionHistory está disponível")
        } else {
          addDebugLog("❌ getTransactionHistory não encontrado")
        }

        // Verificar se watchTransactions existe
        if (typeof holdstationHistoryService.watchTransactions === "function") {
          addDebugLog("✅ watchTransactions está disponível")
        } else {
          addDebugLog("❌ watchTransactions não encontrado")
        }
      } else {
        addDebugLog("❌ holdstationHistoryService não está disponível")
      }
    } catch (error) {
      addDebugLog(`❌ Erro na inspeção: ${error.message}`)
    }
  }

  // Inspecionar serviço quando modal abrir
  useEffect(() => {
    if (isOpen) {
      inspectHoldstationService()
    }
  }, [isOpen])

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

  // Contar transações por token
  const getTokenCounts = () => {
    const counts = transactions.reduce(
      (acc, tx) => {
        acc[tx.tokenSymbol] = (acc[tx.tokenSymbol] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return counts
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-400">{formatAddress(walletAddress)} • Powered by Holdstation</p>
                  {transactions.length > 0 && (
                    <div className="text-xs text-blue-400">
                      {Object.entries(getTokenCounts())
                        .map(([token, count]) => `${token}:${count}`)
                        .join(" • ")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDebugLogs(!showDebugLogs)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Toggle Debug Logs"
                >
                  <Bug size={16} />
                </button>
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

            {/* Debug Logs */}
            {showDebugLogs && debugLogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="border-b border-gray-800 bg-gray-800/30"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Debug Logs ({debugLogs.length})</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(debugLogs.join("\n"))
                        toast.success("Logs copiados!")
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {debugLogs.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                  <button
                    onClick={() => setShowDebugLogs(true)}
                    className="text-xs text-red-400 hover:text-red-300 mt-1"
                  >
                    Ver logs de debug →
                  </button>
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
                  <>
                    {transactions.map((tx) => (
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
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center pt-4"
                      >
                        <button
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                          {isLoadingMore ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              More (+10)
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-sm">{t.history?.noTransactions || "No recent transactions"}</div>
                    <div className="text-xs mt-2 text-gray-500">
                      Transactions will appear here when detected by Holdstation SDK
                    </div>
                    <button
                      onClick={() => setShowDebugLogs(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                    >
                      Ver logs de debug →
                    </button>
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
