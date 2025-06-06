"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Copy, RefreshCw, Info, Activity, Wallet } from "lucide-react"
import { holdstationService } from "@/services/holdstation-service"
import { walletService } from "@/services/wallet-service"
import { TransactionHistory } from "@/components/transaction-history"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import Image from "next/image"
import { toast } from "sonner"

interface TokenDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  tokenSymbol: string
  tokenAddress: string
  walletAddress: string
  initialBalance?: number
}

interface TokenInfo {
  address: string
  chainId: number
  decimals: number
  symbol: string
  name: string
  balance: string
  rawBalance: string
}

export function TokenDetailsModal({
  isOpen,
  onClose,
  tokenSymbol,
  tokenAddress,
  walletAddress,
  initialBalance = 0,
}: TokenDetailsModalProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview")
  const [language, setLanguage] = useState<"en" | "pt">("en")

  // Obter traduções
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
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  // Carregar informações do token quando o modal abrir
  useEffect(() => {
    if (isOpen && tokenAddress && walletAddress) {
      fetchTokenInfo()
    }
  }, [isOpen, tokenAddress, walletAddress])

  const fetchTokenInfo = async () => {
    if (!tokenAddress || !walletAddress) return

    setLoading(true)
    setError(null)

    try {
      console.log("Fetching token info for:", tokenSymbol, tokenAddress)

      // Tentar obter informações reais do token
      const info = await holdstationService.getCompleteTokenInfo(walletAddress, tokenAddress)
      setTokenInfo(info)

      console.log("Token info loaded:", info)
    } catch (error) {
      console.error("Error fetching token info:", error)
      setError(language === "pt" ? "Erro ao carregar informações do token" : "Error loading token information")

      // Fallback para informações básicas
      const tokensInfo = walletService.getTokensInfo()
      const basicInfo = tokensInfo[tokenSymbol]

      if (basicInfo) {
        setTokenInfo({
          address: tokenAddress,
          chainId: 480,
          decimals: basicInfo.decimals,
          symbol: basicInfo.symbol,
          name: basicInfo.name,
          balance: initialBalance.toString(),
          rawBalance: (initialBalance * Math.pow(10, basicInfo.decimals)).toString(),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchTokenInfo()
    toast.success(language === "pt" ? "Informações atualizadas!" : "Information updated!")
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(language === "pt" ? `${label} copiado!` : `${label} copied!`)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast.error(language === "pt" ? "Erro ao copiar" : "Error copying")
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const getTokenLogo = () => {
    const tokensInfo = walletService.getTokensInfo()
    return tokensInfo[tokenSymbol]?.logo || "/placeholder.svg"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={getTokenLogo() || "/placeholder.svg"}
                alt={tokenSymbol}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-lg font-bold">{tokenSymbol}</div>
              {tokenInfo && <div className="text-sm text-gray-400">{tokenInfo.name}</div>}
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading} className="ml-auto">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-4">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
            className="flex-1 text-xs"
          >
            <Info size={14} className="mr-1" />
            {language === "pt" ? "Visão Geral" : "Overview"}
          </Button>
          <Button
            variant={activeTab === "transactions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("transactions")}
            className="flex-1 text-xs"
          >
            <Activity size={14} className="mr-1" />
            {language === "pt" ? "Transações" : "Transactions"}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="space-y-4">
                  <div className="h-20 bg-gray-800 animate-pulse rounded-lg"></div>
                  <div className="h-32 bg-gray-800 animate-pulse rounded-lg"></div>
                </div>
              ) : error ? (
                <Card className="bg-red-900/20 border-red-800/30">
                  <CardContent className="p-4">
                    <div className="flex items-center text-red-400">
                      <Info size={16} className="mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : tokenInfo ? (
                <>
                  {/* Saldo */}
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center">
                        <Wallet size={14} className="mr-1" />
                        {language === "pt" ? "Saldo Atual" : "Current Balance"}
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold">
                        {Number(tokenInfo.balance).toLocaleString(language === "pt" ? "pt-BR" : "en-US")}{" "}
                        {tokenInfo.symbol}
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Detalhes do Token */}
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {language === "pt" ? "Detalhes do Token" : "Token Details"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{language === "pt" ? "Nome" : "Name"}:</span>
                        <span className="text-sm font-medium">{tokenInfo.name}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{language === "pt" ? "Símbolo" : "Symbol"}:</span>
                        <Badge variant="secondary">{tokenInfo.symbol}</Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{language === "pt" ? "Decimais" : "Decimals"}:</span>
                        <span className="text-sm font-medium">{tokenInfo.decimals}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">{language === "pt" ? "Rede" : "Network"}:</span>
                        <span className="text-sm font-medium">World Chain ({tokenInfo.chainId})</span>
                      </div>

                      <Separator className="bg-gray-700" />

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">
                            {language === "pt" ? "Endereço do Contrato" : "Contract Address"}:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono">{formatAddress(tokenInfo.address)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                copyToClipboard(tokenInfo.address, language === "pt" ? "Endereço" : "Address")
                              }
                            >
                              <Copy size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(`https://worldscan.org/token/${tokenInfo.address}`, "_blank")}
                            >
                              <ExternalLink size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </motion.div>
          )}

          {activeTab === "transactions" && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TransactionHistory
                walletAddress={walletAddress}
                tokenSymbol={tokenSymbol}
                className="max-h-96 overflow-y-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
