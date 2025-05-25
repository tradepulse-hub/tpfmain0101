"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { walletService } from "@/services/wallet-service"
import { ArrowUpRight, ArrowDownLeft, Clock, ExternalLink, Filter, RefreshCw, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

// Adicionar o parâmetro daysToShow às props
interface TransactionHistoryProps {
  walletAddress: string
  className?: string
  daysToShow?: number
  tokenSymbol?: string
}

export function TransactionHistory({
  walletAddress,
  className = "",
  daysToShow = 7,
  tokenSymbol = "TPF",
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | string>("all") // Filtro padrão para mostrar todos os tokens
  const [tokensInfo, setTokensInfo] = useState<any>({})
  const [transactionDates, setTransactionDates] = useState<string[]>([])
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage())
  const [translations, setTranslations] = useState(getTranslations(currentLanguage).history || {})

  // Carregar informações dos tokens
  useEffect(() => {
    const tokenInfo = walletService.getTokensInfo()
    setTokensInfo(tokenInfo)
  }, [])

  // Atualizar traduções quando o idioma mudar
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLanguage = getCurrentLanguage()
      setCurrentLanguage(newLanguage)
      setTranslations(getTranslations(newLanguage).history || {})
    }

    // Carregar idioma atual
    handleLanguageChange()

    // Adicionar listener para mudanças de idioma
    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  const fetchAllTokensTransactions = async () => {
    if (!walletAddress) {
      console.error("No wallet address available")
      return
    }

    setIsLoading(true)

    try {
      console.log("Fetching all token transactions for address:", walletAddress)

      // Lista de todos os tokens suportados
      const tokenSymbols = Object.keys(tokensInfo)
      let allTransactions: any[] = []

      // Buscar transações para cada token
      for (const symbol of tokenSymbols) {
        try {
          console.log(`Fetching transactions for ${symbol}...`)
          const tokenTransactions = await walletService.getTokenTransactions(walletAddress, symbol)
          console.log(`Found ${tokenTransactions.length} ${symbol} transactions`)
          allTransactions = [...allTransactions, ...tokenTransactions]
        } catch (error) {
          console.error(`Error fetching ${symbol} transactions:`, error)
        }
      }

      // Ordenar transações por data (mais recente primeiro)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Extrair datas únicas para agrupamento
      const dates = [
        ...new Set(
          allTransactions.map((tx) => {
            const date = new Date(tx.date)
            return date.toISOString().split("T")[0]
          }),
        ),
      ]
        .sort()
        .reverse()

      setTransactionDates(dates)
      setTransactions(allTransactions)
    } catch (error) {
      console.error("Error fetching token transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar dados iniciais quando o componente montar ou o endereço mudar
  useEffect(() => {
    if (walletAddress) {
      fetchAllTokensTransactions()
    }
  }, [walletAddress])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await fetchAllTokensTransactions()
    } catch (error) {
      console.error("Error refreshing transaction history:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Filtrar transações com base no filtro selecionado
  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true
    // Filtrar por token específico
    return tx.token === filter
  })

  // Agrupar transações por data
  const groupedTransactions = filteredTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date).toISOString().split("T")[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, any[]>,
  )

  // Formatar data para exibição
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split("T")[0]) {
      return translations.today || "Today"
    } else if (dateStr === yesterday.toISOString().split("T")[0]) {
      return translations.yesterday || "Yesterday"
    } else {
      return date.toLocaleDateString(currentLanguage === "pt" ? "pt-BR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  // Formatação de endereço para exibição
  const formatAddress = (address: string) => {
    if (!address) return ""
    if (address.length < 10) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Formatação de data para exibição
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(currentLanguage === "pt" ? "pt-BR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Função para formatar o hash da transação
  function formatTxHash(hash: string): string {
    if (!hash) return ""
    return hash.length > 16 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-white">{translations.title || "Transaction History"}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Filtros de token */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs"
        >
          {translations.all || "All"}
        </Button>
        {Object.keys(tokensInfo).map((symbol) => (
          <Button
            key={symbol}
            variant={filter === symbol ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(symbol)}
            className="text-xs flex items-center"
          >
            {tokensInfo[symbol]?.logo && (
              <img
                src={tokensInfo[symbol].logo || "/placeholder.svg"}
                alt={symbol}
                className="w-4 h-4 mr-1 rounded-full"
              />
            )}
            {symbol}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : Object.keys(groupedTransactions).length > 0 ? (
        <div className="space-y-6">
          {transactionDates.map((dateStr) => {
            if (!groupedTransactions[dateStr] || groupedTransactions[dateStr].length === 0) return null

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center mb-2">
                  <Calendar size={16} className="text-gray-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-400">{formatDateHeader(dateStr)}</h3>
                </div>

                {groupedTransactions[dateStr].map((tx) => {
                  const tokenInfo = tokensInfo[tx.token] || { symbol: tx.token, logo: "/placeholder.svg" }

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-800/80 border border-gray-700 rounded-lg p-3"
                    >
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
                            <div className="font-medium">
                              {tx.type === "receive"
                                ? translations.received || "Received"
                                : translations.sent || "Sent"}
                            </div>
                            <div className={`font-medium ${tx.type === "receive" ? "text-green-400" : "text-red-400"}`}>
                              {tx.type === "receive" ? "+" : "-"}
                              {Number(tx.amount).toLocaleString(currentLanguage === "pt" ? "pt-BR" : "en-US")}{" "}
                              {tokenInfo.symbol}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(tx.date)}
                            </div>
                            <div className="flex items-center">
                              {tx.hash && (
                                <a
                                  href={`https://worldscan.org/tx/${tx.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-400 hover:text-blue-300"
                                >
                                  <span className="mr-1">{currentLanguage === "pt" ? "Ver" : "View"}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detalhes adicionais da transação */}
                      <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-400">
                        <div className="flex justify-between">
                          <span>{translations.from || "From"}:</span>
                          <span className="font-mono">{formatAddress(tx.from || "")}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>{translations.to || "To"}:</span>
                          <span className="font-mono">{formatAddress(tx.to || "")}</span>
                        </div>
                        {tx.transactionHash && (
                          <div className="flex justify-between mt-1">
                            <span>{translations.txHash || "Transaction Hash"}:</span>
                            <div className="flex items-center">
                              <span className="font-mono mr-1">{formatTxHash(tx.transactionHash)}</span>
                              <a
                                href={`https://worldscan.org/tx/${tx.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                                title={currentLanguage === "pt" ? "Ver na blockchain" : "View on blockchain"}
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <Filter size={40} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">{translations.noTransactions || "No transactions found"}</p>
        </div>
      )}
    </div>
  )
}
