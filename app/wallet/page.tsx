"use client"

import { useState, useEffect } from "react"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  ChevronRight,
  Copy,
  TrendingUp,
} from "lucide-react"
import { walletService } from "@/services/wallet-service"
import { SendTokenModal } from "@/components/send-token-modal"
import { ReceiveTokenModal } from "@/components/receive-token-modal"
import Image from "next/image"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import { enhancedTokenService } from "@/services/holdstation-service"
import { TokenDetailsModal } from "@/components/token-details-modal"
import { SwapModal } from "@/components/swap-modal"
import { balanceSyncService } from "@/services/balance-sync-service"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { holdstationHistoryService, type Transaction } from "@/services/holdstation-history-service"

export default function WalletPage() {
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveTokenModalOpen] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const router = useRouter()

  const [selectedToken, setSelectedToken] = useState<string>("")
  const [selectedTokenBalance, setSelectedTokenBalance] = useState<string>("0")
  const [isTokenDetailsOpen, setIsTokenDetailsOpen] = useState(false)
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [transactionWatcher, setTransactionWatcher] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"assets" | "activity">("assets")

  // Obter traduções com base no idioma atual
  const translations = getTranslations(language)

  useEffect(() => {
    // Obter o idioma atual
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)

    // Adicionar listener para mudanças de idioma
    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar se há um endereço salvo no localStorage
        const savedAddress = localStorage.getItem("walletAddress")
        if (!savedAddress) {
          // Redirecionar para a página inicial se não estiver autenticado
          router.push("/")
          return
        }

        setWalletAddress(savedAddress)

        // Carregar saldo
        await fetchWalletData(savedAddress)

        // Carregar histórico de transações
        await loadTransactionHistory()

        // Configurar watcher para novas transações
        await setupTransactionWatcher()
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/")
      }
    }

    checkAuth()

    // Adicionar listener para atualizar dados quando o saldo for atualizado manualmente
    const handleBalanceUpdate = (event: any) => {
      if (event.detail && typeof event.detail.amount === "number") {
        setBalance(event.detail.amount)
      }
    }

    window.addEventListener("tpf_balance_updated", handleBalanceUpdate)

    return () => {
      window.removeEventListener("tpf_balance_updated", handleBalanceUpdate)
      // Cleanup transaction watcher
      if (transactionWatcher) {
        transactionWatcher.stop()
      }
    }
  }, [router, walletAddress])

  const fetchWalletData = async (address: string) => {
    try {
      setLoading(true)
      setError(null)

      // Verificar se os serviços estão disponíveis
      if (typeof window !== "undefined" && enhancedTokenService) {
        // Obter saldos usando o Enhanced Token Service
        const realBalances = await enhancedTokenService.getAllTokenBalances(address)
        console.log("Real token balances:", realBalances)

        // Converter para números e atualizar estados
        const tpfBalance = Number(realBalances.TPF || "0")
        setBalance(tpfBalance)

        // Sincronizar saldo TPF para outras páginas
        if (balanceSyncService) {
          balanceSyncService.updateTPFBalance(address, tpfBalance)
        }

        // Converter todos os saldos para números (apenas tokens disponíveis)
        const numericBalances: Record<string, number> = {}
        const availableTokens = ["TPF", "WLD", "DNA", "WDD"] // Removidos WETH, USDCe, CASH

        for (const symbol of availableTokens) {
          const balance = realBalances[symbol]
          numericBalances[symbol] = Number(balance || "0")
        }

        setTokenBalances(numericBalances)
      } else {
        throw new Error("Services not available")
      }
    } catch (error) {
      console.error("Erro ao carregar dados da carteira:", error)
      setError(translations.wallet?.errorMessage || "Não foi possível obter o saldo real. Tente definir manualmente.")

      // Fallback para saldos padrão em caso de erro
      const fallbackBalance = 108567827.002
      setBalance(fallbackBalance)

      // Sincronizar saldo de fallback
      if (balanceSyncService) {
        balanceSyncService.updateTPFBalance(address, fallbackBalance)
      }

      // Apenas tokens disponíveis (removidos WETH, USDCe, CASH)
      setTokenBalances({
        TPF: fallbackBalance,
        WLD: 42.67,
        DNA: 22765.884,
        WDD: 78.32,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (isRefreshing || !walletAddress) return

    setIsRefreshing(true)
    try {
      await fetchWalletData(walletAddress)
    } catch (error) {
      console.error("Erro ao atualizar saldo:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    if (address.length < 10) return address
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const loadTransactionHistory = async () => {
    if (!walletAddress) return

    setLoadingTransactions(true)
    try {
      console.log("Loading transaction history for:", walletAddress)
      const history = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, 20)
      setTransactions(history)
      console.log("Loaded transactions:", history)
    } catch (error) {
      console.error("Error loading transaction history:", error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const setupTransactionWatcher = async () => {
    if (!walletAddress || transactionWatcher) return

    try {
      const watcher = await holdstationHistoryService.watchTransactions(walletAddress, () => {
        console.log("New transaction detected, reloading history...")
        loadTransactionHistory()
      })
      setTransactionWatcher(watcher)
      if (watcher) {
        await watcher.start()
      }
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
    }
  }

  const formatTransactionType = (type: Transaction["type"]) => {
    switch (type) {
      case "send":
        return language === "pt" ? "Enviado" : "Sent"
      case "receive":
        return language === "pt" ? "Recebido" : "Received"
      case "swap":
        return language === "pt" ? "Troca" : "Swap"
      default:
        return type
    }
  }

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "send":
        return <ArrowUpRight className="w-4 h-4 text-red-400" />
      case "receive":
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />
      case "swap":
        return <ArrowUpDown className="w-4 h-4 text-blue-400" />
      default:
        return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
  }

  // Obter informações dos tokens de forma segura (apenas tokens disponíveis)
  const getTokensInfo = () => {
    try {
      if (walletService && typeof walletService.getTokensInfo === "function") {
        const allTokens = walletService.getTokensInfo()

        // Filtrar apenas os tokens disponíveis
        const availableTokens: Record<string, any> = {}
        const allowedTokens = ["TPF", "WLD", "DNA", "WDD"]

        for (const symbol of allowedTokens) {
          if (allTokens[symbol]) {
            availableTokens[symbol] = allTokens[symbol]
          }
        }

        return availableTokens
      }

      // Fallback para tokens conhecidos (apenas disponíveis)
      return {
        TPF: { symbol: "TPF", name: "TPulseFi", logo: "/logo-tpf.png", change: "+5.2%" },
        WLD: { symbol: "WLD", name: "Worldcoin", logo: "/worldcoin.jpeg", change: "+2.8%" },
        DNA: { symbol: "DNA", name: "DNA Token", logo: "/dna-token.png", change: "-1.4%" },
        WDD: { symbol: "WDD", name: "Drachma Token", logo: "/drachma-token.png", change: "+0.7%" },
      }
    } catch (error) {
      console.error("Error getting tokens info:", error)
      return {}
    }
  }

  const tokensInfo = getTokensInfo()

  // Filtrar apenas os tokens que não são TPF
  const otherTokens = Object.entries(tokensInfo)
    .filter(([symbol]) => symbol !== "TPF")
    .map(([symbol, info]) => ({
      symbol,
      name: info.name || symbol,
      logo: info.logo || "/placeholder.svg?height=32&width=32",
      balance: tokenBalances[symbol] || 0,
      change: info.change || "+0.0%",
    }))

  const handleTokenClick = (symbol: string, balance: number) => {
    setSelectedToken(symbol)
    setSelectedTokenBalance(balance.toString())
    setIsTokenDetailsOpen(true)
  }

  // Calcular valor total estimado (simplificado)
  const calculateTotalValue = () => {
    // Valores fictícios para demonstração
    const tpfValue = balance * 0.00012
    const otherTokensValue = Object.values(tokenBalances).reduce((acc, val) => acc + val * 0.0001, 0)
    return tpfValue + otherTokensValue
  }

  const totalValue = calculateTotalValue()

  return (
    <main className="flex min-h-screen flex-col items-center p-4 relative overflow-hidden pb-20">
      <BackgroundEffect />

      {/* Modais */}
      <SendTokenModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        walletAddress={walletAddress}
      />

      <ReceiveTokenModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveTokenModalOpen(false)}
        walletAddress={walletAddress}
      />

      <SwapModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} walletAddress={walletAddress} />

      <div className="z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          {/* Cabeçalho com título e endereço da carteira */}
          <div className="w-full flex flex-col mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{translations.wallet?.title || "Carteira"}</h1>

            {walletAddress && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between p-3 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-gray-700/50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{language === "en" ? "Wallet Address" : "Endereço"}</p>
                    <p className="text-sm font-medium text-gray-200">{formatAddress(walletAddress)}</p>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700"
                        onClick={copyToClipboard}
                      >
                        <Copy className={`h-4 w-4 ${copiedAddress ? "text-green-400" : "text-gray-400"}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copiedAddress ? "Copied!" : "Copy address"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}
          </div>

          {/* Card principal com saldo e valor total */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="w-full bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50 shadow-xl mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/10 z-0"></div>

              <CardHeader className="relative z-10 pb-0">
                <div className="flex justify-between items-center">
                  <CardDescription className="text-gray-300">TPF Balance</CardDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full bg-gray-800/70 hover:bg-gray-700/70 p-0"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw size={14} className={`text-gray-300 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {loading ? (
                  <div className="h-10 w-48 bg-gray-700/50 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-bold">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-white to-blue-100"></span>
                    </CardTitle>
                    <p className="text-sm text-gray-400">
                      {balance.toLocaleString(language === "pt" ? "pt-BR" : "en-US")} TPF
                    </p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="relative z-10 pt-6 pb-4">
                {/* Botões de ação */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="secondary"
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white flex flex-col items-center h-auto py-3"
                    onClick={() => setIsSendModalOpen(true)}
                  >
                    <div className="rounded-full bg-gray-700 p-2 mb-1">
                      <ArrowUpRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium">{translations.wallet?.send || "Send"}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white flex flex-col items-center h-auto py-3"
                    onClick={() => setIsReceiveTokenModalOpen(true)}
                  >
                    <div className="rounded-full bg-gray-700 p-2 mb-1">
                      <ArrowDownLeft className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium">{translations.wallet?.receive || "Receive"}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white flex flex-col items-center h-auto py-3"
                    onClick={() => setIsSwapModalOpen(true)}
                  >
                    <div className="rounded-full bg-gray-700 p-2 mb-1">
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium">{translations.wallet?.swap || "Swap"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs para Assets e Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            {/* Tab Headers */}
            <div className="grid grid-cols-2 mb-4 bg-gray-800/60 border border-gray-700/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("assets")}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "assets" ? "bg-gray-700/60 text-white" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {translations.wallet?.assets || "Assets"}
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "activity" ? "bg-gray-700/60 text-white" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {translations.wallet?.activity || "Activity"}
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "assets" && (
              <div className="mt-0">
                {/* TPF Token Card */}
                <Card className="w-full bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 mb-4 overflow-hidden">
                  <button onClick={() => handleTokenClick("TPF", balance)} className="w-full text-left">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-gray-700/50">
                            <Image src="/logo-tpf.png" alt="TPF" fill className="object-cover p-1" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">TPulseFi</h3>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-400">TPF</p>
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-900/20 text-green-400 border-green-500/30"
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                +5.2%
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="font-medium text-white">
                              {loading ? (
                                <span className="inline-block w-20 h-5 bg-gray-700 animate-pulse rounded"></span>
                              ) : (
                                balance.toLocaleString(language === "pt" ? "pt-BR" : "en-US")
                              )}
                            </p>
                            <p className="text-xs text-gray-400"></p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    </CardContent>
                  </button>
                </Card>

                {/* Outros Tokens */}
                <h3 className="text-sm font-medium text-gray-400 mb-3 ml-1">
                  {translations.wallet?.otherTokens || "Other Tokens"}
                </h3>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-gray-800/60 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {otherTokens.map((token) => (
                      <Card
                        key={token.symbol}
                        className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 overflow-hidden"
                      >
                        <button
                          onClick={() => handleTokenClick(token.symbol, token.balance)}
                          className="w-full text-left"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50">
                                  <Image
                                    src={token.logo || "/placeholder.svg"}
                                    alt={token.name}
                                    fill
                                    className="object-cover p-1"
                                  />
                                </div>
                                <div>
                                  <h3 className="font-medium text-white">{token.name}</h3>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm text-gray-400">{token.symbol}</p>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        token.change.startsWith("+")
                                          ? "bg-green-900/20 text-green-400 border-green-500/30"
                                          : "bg-red-900/20 text-red-400 border-red-500/30"
                                      }`}
                                    >
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      {token.change}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <p className="font-medium text-white">
                                    {token.balance.toLocaleString(language === "pt" ? "pt-BR" : "en-US")}
                                  </p>
                                  <p className="text-xs text-gray-400"></p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              </div>
                            </div>
                          </CardContent>
                        </button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="mt-0">
                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardDescription className="text-gray-300">
                        {translations.wallet?.recentActivity || "Recent Activity"}
                      </CardDescription>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={loadTransactionHistory}
                        disabled={loadingTransactions}
                      >
                        <RefreshCw size={14} className={`text-gray-400 ${loadingTransactions ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {loadingTransactions ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-gray-800/60 animate-pulse rounded-lg"></div>
                        ))}
                      </div>
                    ) : transactions.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/30 hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gray-700/80 border border-gray-600/50 flex items-center justify-center">
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium text-white">{formatTransactionType(tx.type)}</p>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      tx.status === "completed"
                                        ? "bg-green-900/20 text-green-400 border-green-500/30"
                                        : tx.status === "pending"
                                          ? "bg-yellow-900/20 text-yellow-400 border-yellow-500/30"
                                          : "bg-red-900/20 text-red-400 border-red-500/30"
                                    }`}
                                  >
                                    {tx.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400">
                                  {tx.timestamp.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US")}{" "}
                                  {tx.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-white">
                                {Number(tx.amount).toLocaleString(language === "pt" ? "pt-BR" : "en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6,
                                })}{" "}
                                {tx.tokenSymbol}
                              </p>
                              <p className="text-xs text-gray-400">
                                {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[200px]">
                        <div className="w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center mb-4">
                          <RefreshCw className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-300 mb-1">
                          {translations.wallet?.noActivity || "No recent activity"}
                        </h3>
                        <p className="text-sm text-gray-400 text-center max-w-xs">
                          {translations.wallet?.activityDescription ||
                            "Your transaction history will appear here once you start sending or receiving tokens."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>

          {/* Mensagem de erro ou informação */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full mt-6"
            >
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-red-300 font-medium mb-1">
                      {language === "en" ? "Error getting balance" : "Erro ao obter saldo"}
                    </h3>
                    <p className="text-red-200/80 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <TokenDetailsModal
        isOpen={isTokenDetailsOpen}
        onClose={() => setIsTokenDetailsOpen(false)}
        tokenSymbol={selectedToken}
        tokenBalance={selectedTokenBalance}
        walletAddress={walletAddress}
      />

      <BottomNav activeTab="wallet" />
    </main>
  )
}
