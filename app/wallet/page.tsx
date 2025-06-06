"use client"

import { useState, useEffect } from "react"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Wallet, ArrowUpRight, ArrowDownLeft, AlertCircle, RefreshCw, ArrowUpDown } from "lucide-react"
import { walletService } from "@/services/wallet-service"
import { SendTokenModal } from "@/components/send-token-modal"
import { ReceiveTokenModal } from "@/components/receive-token-modal"
import Image from "next/image"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import { enhancedTokenService } from "@/services/enhanced-token-service"
import { TokenDetailsModal } from "@/components/token-details-modal"
import { SwapModal } from "@/components/swap-modal"

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
    }
  }, [router, walletAddress])

  const fetchWalletData = async (address: string) => {
    try {
      setLoading(true)
      setError(null)

      // Obter saldos usando o Enhanced Token Service
      const realBalances = await enhancedTokenService.getAllTokenBalances(address)
      console.log("Real token balances:", realBalances)

      // Converter para números e atualizar estados
      const tpfBalance = Number(realBalances.TPF || "0")
      setBalance(tpfBalance)

      // Converter todos os saldos para números
      const numericBalances: Record<string, number> = {}
      for (const [symbol, balance] of Object.entries(realBalances)) {
        numericBalances[symbol] = Number(balance || "0")
      }
      setTokenBalances(numericBalances)
    } catch (error) {
      console.error("Erro ao carregar dados da carteira:", error)
      setError(translations.wallet?.errorMessage || "Não foi possível obter o saldo real. Tente definir manualmente.")

      // Fallback para saldos padrão em caso de erro
      setBalance(1000)
      setTokenBalances({
        TPF: 1000,
        WLD: 42.67,
        DNA: 125.45,
        CASH: 310.89,
        WDD: 78.32,
        WETH: 0.5,
        USDCe: 250.0,
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

  // Obter informações dos tokens
  const tokensInfo = walletService.getTokensInfo()

  // Filtrar apenas os tokens que não são TPF
  const otherTokens = Object.entries(tokensInfo)
    .filter(([symbol]) => symbol !== "TPF")
    .map(([symbol, info]) => ({
      symbol,
      name: info.name,
      logo: info.logo,
      balance: tokenBalances[symbol] || 0,
    }))

  const handleTokenClick = (symbol: string, balance: number) => {
    setSelectedToken(symbol)
    setSelectedTokenBalance(balance.toString())
    setIsTokenDetailsOpen(true)
  }

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
          <div className="w-full flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">{translations.wallet?.title || "Carteira"}</h1>
            {walletAddress && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-gray-300" />
                </div>
                <span className="text-sm text-gray-300">{formatAddress(walletAddress)}</span>
              </div>
            )}
          </div>

          {/* Saldo TPF */}
          <Card className="w-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardDescription>{translations.wallet?.balance || "Saldo TPF"}</CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={`text-gray-400 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
              {loading ? (
                <div className="h-8 w-32 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                <CardTitle className="text-3xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-white">
                    {balance.toLocaleString(language === "pt" ? "pt-BR" : "en-US")} TPF
                  </span>
                </CardTitle>
              )}
            </CardHeader>
            <CardContent className="pb-4">
              {/* Botões compactos */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white text-xs py-2"
                  onClick={() => setIsSendModalOpen(true)}
                >
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {translations.wallet?.send || "Enviar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white text-xs py-2"
                  onClick={() => setIsReceiveTokenModalOpen(true)}
                >
                  <ArrowDownLeft className="w-3 h-3 mr-1" />
                  {translations.wallet?.receive || "Receber"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white text-xs py-2"
                  onClick={() => setIsSwapModalOpen(true)}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  {translations.wallet?.swap || "Swap"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Outros Tokens Confiáveis */}
          <Card className="w-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 mt-4 mb-6">
            <CardHeader className="pb-2">
              <CardDescription>{translations.wallet?.otherTokens || "Outros Tokens Confiáveis"}</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {otherTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleTokenClick(token.symbol, token.balance)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-800/50 border border-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                          <Image src={token.logo || "/placeholder.svg"} alt={token.name} width={32} height={32} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{token.symbol}</div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {token.balance.toLocaleString(language === "pt" ? "pt-BR" : "en-US")}
                        </div>
                        <div className="text-xs text-gray-400">{token.symbol}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mensagem de erro ou informação */}
          {error && (
            <div className="w-full mb-6">
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
            </div>
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
