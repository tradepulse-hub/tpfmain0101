"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, RefreshCw, Download, Send, ExternalLink, Filter, ChevronDown, Calendar } from "lucide-react"
import { walletService } from "@/services/wallet-service"
import "../app/dark-theme.css"
import { MiniKit } from "@worldcoin/minikit-js"
import { getCurrentLanguage, getTranslations, type Language, type Translations } from "@/lib/i18n"

interface TransactionHistoryPageProps {
  onBack: () => void
  userAddress: string
}

export const TransactionHistoryPage = ({ onBack, userAddress }: TransactionHistoryPageProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [actualAddress, setActualAddress] = useState(userAddress)
  const [filter, setFilter] = useState<"all" | string>("all") // Filtro padrão para mostrar todos os tokens
  const [tokensInfo, setTokensInfo] = useState<any>({})
  const [visibleCount, setVisibleCount] = useState(10) // Número de transações visíveis inicialmente
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [transactionDates, setTransactionDates] = useState<string[]>([])
  const [language, setLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState<Translations>(getTranslations("en"))

  useEffect(() => {
    // Load current language from localStorage
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)
    setTranslations(getTranslations(currentLang))

    // Add listener for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setLanguage(newLang)
      setTranslations(getTranslations(newLang))
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  // Verificar se temos o endereço correto
  useEffect(() => {
    // Tentar obter o endereço diretamente do MiniKit
    if (MiniKit.isInstalled() && MiniKit.user && MiniKit.user.walletAddress) {
      console.log("Using wallet address from MiniKit:", MiniKit.user.walletAddress)
      setActualAddress(MiniKit.user.walletAddress)
    } else if (userAddress) {
      console.log("Using provided wallet address:", userAddress)
      setActualAddress(userAddress)
    }

    // Obter informações dos tokens
    const tokenInfo = walletService.getTokensInfo()
    setTokensInfo(tokenInfo)
  }, [userAddress])

  const fetchAllTokensTransactions = async (showLoading = true) => {
    if (!actualAddress) {
      console.error("No wallet address available")
      return
    }

    if (showLoading) {
      setIsLoading(true)
    }

    try {
      console.log("Fetching all token transactions for address:", actualAddress)

      // Explicitly list all tokens to ensure we fetch transactions for each one
      const tokenSymbols = Object.keys(tokensInfo)
      let allTransactions = []

      // Fetch transactions for each token individually to ensure we get all of them
      for (const symbol of tokenSymbols) {
        console.log(`Fetching transactions for ${symbol}...`)
        try {
          const tokenTransactions = await walletService.getTokenTransactions(actualAddress, symbol)
          console.log(`Found ${tokenTransactions.length} transactions for ${symbol}`)
          allTransactions = [...allTransactions, ...tokenTransactions]
        } catch (error) {
          console.error(`Error fetching ${symbol} transactions:`, error)
        }
      }

      // Sort all transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      console.log("All transactions fetched:", allTransactions.length)

      // Extract unique dates for grouping
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
      saveTransactionsToLocalStorage(allTransactions)
    } catch (error) {
      console.error("Error fetching all token transactions:", error)
    } finally {
      setIsLoading(false)
      setInitialLoadComplete(true)
    }
  }

  // Adicionar função para salvar transações no localStorage
  const saveTransactionsToLocalStorage = (transactions: Transaction[]) => {
    try {
      localStorage.setItem(`transactions_${actualAddress}`, JSON.stringify(transactions))
      console.log("Transactions saved to localStorage")
    } catch (error) {
      console.error("Error saving transactions to localStorage:", error)
    }
  }

  // Adicionar função para carregar transações do localStorage
  const loadTransactionsFromLocalStorage = () => {
    try {
      const savedTransactions = localStorage.getItem(`transactions_${actualAddress}`)
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions) as Transaction[]
        console.log("Loaded transactions from localStorage:", parsedTransactions.length)
        return parsedTransactions
      }
    } catch (error) {
      console.error("Error loading transactions from localStorage:", error)
    }
    return null
  }

  // Carregar dados iniciais quando o componente montar ou o endereço mudar
  useEffect(() => {
    if (actualAddress) {
      console.log("Loading initial transaction data for address:", actualAddress)

      // Tentar carregar do localStorage primeiro
      const savedTransactions = loadTransactionsFromLocalStorage()
      if (savedTransactions && savedTransactions.length > 0) {
        console.log("Using cached transactions from localStorage")
        setTransactions(savedTransactions)

        // Extrair datas únicas para agrupamento
        const dates = [
          ...new Set(
            savedTransactions.map((tx) => {
              const date = new Date(tx.date)
              return date.toISOString().split("T")[0]
            }),
          ),
        ]
          .sort()
          .reverse()

        setTransactionDates(dates)
        setIsLoading(false)

        // Ainda buscar dados atualizados em segundo plano
        fetchAllTokensTransactions(false)
      } else {
        // Se não houver dados no localStorage, buscar normalmente
        console.log("No cached transactions, fetching from API")
        console.log("Will fetch transactions for tokens: TPF, WLD, DNA, CASH, WDD")
        fetchAllTokensTransactions(true)
      }
    }
  }, [actualAddress])

  // Adicione este novo useEffect para detectar transações globais
  useEffect(() => {
    if (!initialLoadComplete) return

    // Adicionar listener para transações globais
    const handleGlobalTransaction = (event: CustomEvent) => {
      const tx = event.detail
      console.log("Global transaction detected in history page:", tx)

      // Verificar se esta transação envolve o endereço atual
      if (tx.from === actualAddress || tx.to === actualAddress) {
        console.log("Transaction involves current address, refreshing transaction history...")
        fetchAllTokensTransactions(false) // Não mostrar indicador de carregamento
      }
    }

    // Adicionar listener para o evento personalizado
    window.addEventListener("tpf_transaction_completed", handleGlobalTransaction as EventListener)
    window.addEventListener("token_transfer_completed", handleGlobalTransaction as EventListener)

    return () => {
      window.removeEventListener("tpf_transaction_completed", handleGlobalTransaction as EventListener)
      window.removeEventListener("token_transfer_completed", handleGlobalTransaction as EventListener)
    }
  }, [actualAddress, initialLoadComplete])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await fetchAllTokensTransactions(false)
      // Resetar para mostrar apenas as primeiras 10 transações após atualizar
      setVisibleCount(10)
    } catch (error) {
      console.error("Error refreshing transaction history:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Função para carregar mais transações
  const handleLoadMore = () => {
    setIsLoadingMore(true)
    // Simular um pequeno atraso para mostrar o indicador de carregamento
    setTimeout(() => {
      setVisibleCount((prevCount) => prevCount + 10) // Adicionar exatamente 10 transações
      setIsLoadingMore(false)
    }, 500)
  }

  // Obter lista de tokens únicos para o filtro
  const uniqueTokens = [...new Set(transactions.map((tx) => tx.token || "TPF"))]

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
    {} as Record<string, Transaction[]>,
  )

  // Limitar o número de transações visíveis
  const visibleTransactions = filteredTransactions.slice(0, visibleCount)
  const hasMoreTransactions = filteredTransactions.length > visibleCount

  // Agrupar transações visíveis por data
  const visibleGroupedTransactions = visibleTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date).toISOString().split("T")[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, Transaction[]>,
  )

  // Obter datas únicas das transações visíveis
  const visibleDates = [
    ...new Set(
      visibleTransactions.map((tx) => {
        const date = new Date(tx.date)
        return date.toISOString().split("T")[0]
      }),
    ),
  ]
    .sort()
    .reverse()

  // Formatar data para exibição
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split("T")[0]) {
      return translations.history.today || "Today"
    } else if (dateStr === yesterday.toISOString().split("T")[0]) {
      return translations.history.yesterday || "Yesterday"
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  return (
    <div className="fixed inset-0 dark-bg flex flex-col p-3 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-200">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold metallic-title">{translations.history.title}</h1>
        <button onClick={handleRefresh} disabled={isRefreshing} className="text-gray-400 hover:text-gray-200">
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filtros de tipo */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-900 rounded-lg p-1 flex">
          <button
            className={`px-3 py-1 text-sm rounded-md ${filter === "all" ? "bg-gray-700 text-white" : "text-gray-400"}`}
            onClick={() => setFilter("all")}
          >
            {translations.history.all}
          </button>
        </div>
      </div>

      {/* Filtros de token */}
      <div className="flex justify-center mb-4 overflow-x-auto">
        <div className="bg-gray-900 rounded-lg p-1 flex">
          <button
            className={`px-3 py-1 text-sm rounded-md mx-1 ${
              filter === "all" ? "bg-gray-700 text-white font-bold" : "text-gray-400"
            }`}
            onClick={() => setFilter("all")}
          >
            {translations.all || "All"}
          </button>
          {Object.keys(tokensInfo).map((symbol) => (
            <button
              key={symbol}
              className={`px-3 py-1 text-sm rounded-md mx-1 flex items-center ${
                filter === symbol ? "bg-gray-700 text-white font-bold" : "text-gray-400"
              }`}
              onClick={() => setFilter(symbol)}
            >
              {tokensInfo[symbol]?.logo && (
                <img
                  src={tokensInfo[symbol].logo || "/placeholder.svg"}
                  alt={symbol}
                  className="w-4 h-4 mr-1 rounded-full"
                />
              )}
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de transações */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="dark-loading-metallic mr-2"></div>
            <span className="text-sm metallic-text">{translations.history.loading}</span>
          </div>
        ) : visibleTransactions.length > 0 ? (
          <div className="space-y-6">
            {visibleDates.map((dateStr) => {
              if (!visibleGroupedTransactions[dateStr] || visibleGroupedTransactions[dateStr].length === 0) return null

              return (
                <div key={dateStr} className="space-y-3">
                  <div className="flex items-center mb-2">
                    <Calendar size={16} className="text-gray-500 mr-2" />
                    <h3 className="text-sm font-medium text-gray-400">{formatDateHeader(dateStr)}</h3>
                  </div>

                  {visibleGroupedTransactions[dateStr].map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      type={tx.type as "send" | "receive"}
                      amount={tx.amount}
                      date={tx.date}
                      from={tx.from}
                      to={tx.to}
                      status={tx.status}
                      hash={tx.transactionHash}
                      blockNumber={tx.blockNumber}
                      token={tx.token || "TPF"}
                      tokensInfo={tokensInfo}
                      translations={translations}
                    />
                  ))}
                </div>
              )
            })}

            {/* Botão "Carregar Mais" */}
            {hasMoreTransactions && (
              <div className="flex justify-center mt-4 mb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="dark-btn-metallic px-4 py-2 rounded-lg flex items-center justify-center w-full max-w-xs"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="dark-loading-metallic mr-2 w-4 h-4"></div>
                      <span className="metallic-text">Loading...</span>
                    </>
                  ) : (
                    <>
                      <span className="metallic-text mr-2">{translations.history.loadMore || "Load more"}</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Filter size={40} className="text-gray-700 mb-3" />
            <p className="text-gray-500">{translations.history.noTransactions}</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface Transaction {
  id: string
  type: string
  amount: string
  date: string
  from?: string
  to?: string
  status: string
  transactionHash?: string
  blockNumber?: number
  token?: string
}

interface TransactionItemProps {
  type: "send" | "receive"
  amount: string
  date: string
  from?: string
  to?: string
  status?: string
  hash?: string
  blockNumber?: number
  token: string
  tokensInfo: any
  translations: Translations
}

const TransactionItem = ({
  type,
  amount,
  date,
  from,
  to,
  status = "completed",
  hash,
  blockNumber,
  token,
  tokensInfo,
  translations,
}: TransactionItemProps) => {
  const isReceive = type === "receive"
  const formattedDate = new Date(date).toLocaleDateString()
  const formattedTime = new Date(date).toLocaleTimeString()

  // Obter informações do token
  const tokenInfo = tokensInfo[token] || { name: token, symbol: token }

  const openTransactionExplorer = () => {
    if (hash) {
      window.open(`https://worldscan.org/tx/${hash}`, "_blank")
    }
  }

  // Função para obter o caminho do logo do token
  const getTokenLogo = () => {
    if (tokenInfo && tokenInfo.logo) {
      return tokenInfo.logo
    }
    return "/images/logo-tpf.png" // Logo padrão
  }

  return (
    <div className="dark-card-metallic p-3 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isReceive ? "bg-green-900" : "bg-red-900"
            }`}
          >
            {isReceive ? (
              <Download size={16} className="text-green-400" />
            ) : (
              <Send size={16} className="text-red-400" />
            )}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <p className="text-sm font-medium text-white">
                {isReceive ? translations.history.received : translations.history.sent}
              </p>
              <div className="flex items-center ml-2">
                <img src={getTokenLogo() || "/placeholder.svg"} alt={token} className="w-4 h-4 rounded-full mr-1" />
                <span className="text-sm font-medium metallic-text">{token}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{formattedTime}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${isReceive ? "text-green-400" : "text-red-400"}`}>
            {isReceive ? "+" : "-"}
            {amount} {token}
          </p>
          <p className="text-xs text-gray-400">{status}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-2 text-xs">
        <div className="flex justify-between mb-1">
          <span className="text-gray-500">{translations.history.from}</span>
          <span className="text-gray-300 font-mono">{formatAddress(from || "")}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-500">{translations.history.to}</span>
          <span className="text-gray-300 font-mono">{formatAddress(to || "")}</span>
        </div>
        {blockNumber && (
          <div className="flex justify-between">
            <span className="text-gray-500">{translations.history.block}</span>
            <span className="text-gray-300">{blockNumber}</span>
          </div>
        )}
        {hash && (
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
            <span className="text-gray-500">{translations.history.txHash}</span>
            <div className="flex items-center">
              <span className="text-gray-300 font-mono mr-2">{formatTxHash(hash)}</span>
              <button
                onClick={openTransactionExplorer}
                className="text-blue-400 hover:text-blue-300"
                title="View on Explorer"
              >
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatAddress(address: string): string {
  if (!address) return ""
  return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address
}

function formatTxHash(hash: string): string {
  if (!hash) return ""
  return hash.length > 16 ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash
}
