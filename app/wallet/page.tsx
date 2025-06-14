"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
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
  FileText,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { walletService } from "@/services/wallet-service"
import { balanceSyncService } from "@/services/balance-sync-service"
import { SetBalanceModal } from "@/components/set-balance-modal"
import { SendTokenModal } from "@/components/send-token-modal"
import { ReceiveTokenModal } from "@/components/receive-token-modal"
import { SwapModal } from "@/components/swap-modal"
import { TransactionHistoryModal } from "@/components/transaction-history-modal"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

export default function WalletPage() {
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedAddress, setCopiedAddress] = useState(false)

  // Modal states
  const [isSetBalanceModalOpen, setIsSetBalanceModalOpen] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false)
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedAddress = localStorage.getItem("walletAddress")
        if (!savedAddress) {
          router.push("/")
          return
        }

        setWalletAddress(savedAddress)
        await fetchWalletData(savedAddress)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/")
      }
    }

    checkAuth()

    // Listen for balance updates
    const unsubscribe = balanceSyncService.onBalanceChange((newBalance) => {
      console.log("Balance updated:", newBalance)
      setBalance(newBalance)
      setTokenBalances((prev) => ({ ...prev, TPF: newBalance }))
    })

    return unsubscribe
  }, [router])

  const fetchWalletData = async (address: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Fetching wallet data for:", address)

      // Get token balances
      const balances = await walletService.getTokenBalances(address)
      console.log("Token balances:", balances)

      // Update TPF balance
      const tpfToken = balances.find((b) => b.symbol === "TPF")
      const tpfBalance = tpfToken ? Number.parseFloat(tpfToken.balance) : 0

      // If TPF balance is 0, force update to get stored balance
      const finalTpfBalance = tpfBalance > 0 ? tpfBalance : await balanceSyncService.forceBalanceUpdate(address)

      console.log("Final TPF balance:", finalTpfBalance)
      setBalance(finalTpfBalance)

      // Convert all balances to numbers
      const numericBalances: Record<string, number> = {}
      balances.forEach((token) => {
        numericBalances[token.symbol] = token.symbol === "TPF" ? finalTpfBalance : Number.parseFloat(token.balance)
      })

      setTokenBalances(numericBalances)
      console.log("Final balances:", numericBalances)
    } catch (error) {
      console.error("Erro ao carregar dados da carteira:", error)
      setError("Não foi possível obter o saldo real. Tente definir manualmente.")

      // Fallback balances
      const fallbackBalance = await balanceSyncService.forceBalanceUpdate(address)
      setBalance(fallbackBalance)
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
      toast.success(t.wallet?.balancesUpdated || "Balances updated!")
    } catch (error) {
      console.error("Erro ao atualizar saldo:", error)
      toast.error(t.wallet?.errorUpdatingBalances || "Error updating balances")
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
      toast.success(t.wallet?.addressCopied || "Address copied!")
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  const tokensInfo = walletService.getTokensInfo()

  // Filter other tokens (not TPF)
  const otherTokens = Object.entries(tokensInfo)
    .filter(([symbol]) => symbol !== "TPF")
    .map(([symbol, info]) => ({
      symbol,
      name: info.name || symbol,
      logo: info.logo || "/placeholder.svg?height=32&width=32",
      balance: tokenBalances[symbol] || 0,
      change: symbol === "WLD" ? "+2.8%" : symbol === "DNA" ? "-1.4%" : "+0.7%",
    }))

  return (
    <main className="flex min-h-screen flex-col items-center p-4 relative overflow-hidden pb-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-gray-900/10" />

      {/* Modals */}
      <SetBalanceModal
        isOpen={isSetBalanceModalOpen}
        onClose={() => setIsSetBalanceModalOpen(false)}
        currentBalance={balance}
        walletAddress={walletAddress}
      />

      <SendTokenModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        walletAddress={walletAddress}
      />

      <ReceiveTokenModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        walletAddress={walletAddress}
      />

      <SwapModal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} walletAddress={walletAddress} />

      <TransactionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        walletAddress={walletAddress}
      />

      <div className="z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex flex-col mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">{t.wallet?.title || "Wallet"}</h1>

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
                    <p className="text-xs text-gray-400">{t.wallet?.address || "Address"}</p>
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
                      <p>
                        {copiedAddress ? t.wallet?.addressCopied || "Copied!" : t.wallet?.copyAddress || "Copy address"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}
          </div>

          {/* Main Balance Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="w-full bg-gradient-to-br from-gray-800/80 to-gray-900/90 border border-gray-700/50 shadow-xl mb-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/10 z-0"></div>

              <CardHeader className="relative z-10 pb-0">
                <div className="flex justify-between items-center">
                  <CardDescription className="text-gray-300">{t.wallet?.balance || "TPF Balance"}</CardDescription>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full bg-gray-800/70 hover:bg-gray-700/70 p-0"
                            onClick={() => setIsHistoryModalOpen(true)}
                          >
                            <FileText size={14} className="text-gray-300" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.wallet?.activity || "Transaction History"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full bg-gray-800/70 hover:bg-gray-700/70 p-0"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                          >
                            <RefreshCw size={14} className={`text-gray-300 ${isRefreshing ? "animate-spin" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t.wallet?.refreshBalances || "Refresh balances"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {loading ? (
                  <div className="h-10 w-48 bg-gray-700/50 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-white">
                      {balance > 0 ? balance.toLocaleString("pt-BR") : "0"} TPF
                    </CardTitle>
                  </div>
                )}
              </CardHeader>

              <CardContent className="relative z-10 pt-6 pb-4">
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="secondary"
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white flex flex-col items-center h-auto py-3"
                    onClick={() => setIsSendModalOpen(true)}
                  >
                    <div className="rounded-full bg-gray-700 p-2 mb-1">
                      <ArrowUpRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium">{t.wallet?.send || "Send"}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white flex flex-col items-center h-auto py-3"
                    onClick={() => setIsReceiveModalOpen(true)}
                  >
                    <div className="rounded-full bg-gray-700 p-2 mb-1">
                      <ArrowDownLeft className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium">{t.wallet?.receive || "Receive"}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white flex flex-col items-center h-auto py-3"
                    onClick={() => setIsSwapModalOpen(true)}
                  >
                    <div className="rounded-full bg-gray-700 p-2 mb-1">
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs font-medium">{t.wallet?.swap || "Swap"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Assets Section - Removido tabs, apenas mostra assets diretamente */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <div className="space-y-4">
              {/* TPF Token Card */}
              <Card className="w-full bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 overflow-hidden">
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
                            `${balance > 0 ? balance.toLocaleString("pt-BR") : "0"}`
                          )}
                        </p>
                        <p className="text-xs text-gray-400">TPF</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Tokens */}
              <h3 className="text-sm font-medium text-gray-400 mb-3 ml-1">{t.wallet?.otherTokens || "Other Tokens"}</h3>

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
                              <p className="font-medium text-white">{token.balance.toLocaleString("pt-BR")}</p>
                              <p className="text-xs text-gray-400">{token.symbol}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Error Message */}
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
                    <h3 className="text-red-300 font-medium mb-1">Erro ao obter saldo</h3>
                    <p className="text-red-200/80 text-sm">
                      {t.wallet?.errorMessage || "Could not get real balance. Try setting it manually."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-red-800 text-red-300 hover:bg-red-900/20"
                      onClick={() => setIsSetBalanceModalOpen(true)}
                    >
                      Definir Saldo Manualmente
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      {/* Navigation Bar - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50">
        <div className="flex justify-around items-center py-3 px-4 max-w-md mx-auto">
          <button onClick={() => router.push("/wallet")} className="flex flex-col items-center space-y-1 text-blue-400">
            <Wallet className="w-5 h-5" />
            <span className="text-xs">Wallet</span>
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white"
          >
            <div className="w-5 h-5 rounded-full bg-gray-600"></div>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </main>
  )
}
