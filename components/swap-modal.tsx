"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, ArrowUpDown, Loader2, Settings, RefreshCw, Info } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "../lib/i18n"
import { uniswapService } from "../services/uniswap-service"
import { toast } from "sonner"

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

export function SwapModal({ isOpen, onClose, walletAddress }: SwapModalProps) {
  const [tokenIn, setTokenIn] = useState<"WLD" | "TPF">("WLD")
  const [tokenOut, setTokenOut] = useState<"WLD" | "TPF">("TPF")
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isLoading, setIsLoading] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState(getTranslations("en").swap || {})
  const [showSettings, setShowSettings] = useState(false)
  const [poolFee, setPoolFee] = useState<number | null>(null)
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({
    WLD: "0.000000",
    TPF: "0.000000",
  })
  const [poolDetails, setPoolDetails] = useState<any>(null)

  const tokens = uniswapService.getTokens()

  // Carregar informações do pool
  const loadPoolInfo = useCallback(async () => {
    try {
      const info = await uniswapService.getPoolInfo()
      if (info) {
        setPoolDetails(info)
        setPoolFee(info.fee)
        console.log("Pool info loaded:", info)
      }
    } catch (error) {
      console.error("Error loading pool info:", error)
    }
  }, [])

  useEffect(() => {
    const updateLanguage = () => {
      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)
      setTranslations(getTranslations(currentLang).swap || {})
    }
    updateLanguage()
    window.addEventListener("languageChange", updateLanguage)
    return () => window.removeEventListener("languageChange", updateLanguage)
  }, [])

  // Carregar saldos e informações do pool quando o modal abrir
  useEffect(() => {
    if (!isOpen) return

    loadPoolInfo()

    if (walletAddress) {
      loadBalances()
    }
  }, [isOpen, walletAddress, loadPoolInfo])

  // Carregar saldos reais
  const loadBalances = async () => {
    if (!walletAddress) return

    setIsLoadingBalances(true)
    try {
      console.log("Loading real token balances...")
      const balances = await uniswapService.getTokenBalances(walletAddress)

      const balanceMap: Record<string, string> = {}
      balances.forEach((balance) => {
        balanceMap[balance.symbol] = balance.formattedBalance
      })

      setTokenBalances(balanceMap)
      console.log("Token balances loaded:", balanceMap)
    } catch (error) {
      console.error("Error loading balances:", error)
      toast.error("Erro ao carregar saldos")
    } finally {
      setIsLoadingBalances(false)
    }
  }

  // Obter cotação quando o valor de entrada mudar
  useEffect(() => {
    const getQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) <= 0) {
        setAmountOut("")
        return
      }

      setIsQuoting(true)
      try {
        const quote = await uniswapService.getQuote({
          tokenIn,
          tokenOut,
          amountIn,
        })

        setAmountOut(Number.parseFloat(quote).toFixed(6))
      } catch (error) {
        console.error("Error getting quote:", error)
        setAmountOut("0")
        toast.error("Erro ao obter cotação")
      } finally {
        setIsQuoting(false)
      }
    }

    const timeoutId = setTimeout(getQuote, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [amountIn, tokenIn, tokenOut])

  const handleSwapTokens = () => {
    const tempToken = tokenIn
    const tempAmount = amountIn

    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
  }

  const handleMaxAmount = () => {
    const maxBalance = tokenBalances[tokenIn]
    if (maxBalance && Number.parseFloat(maxBalance) > 0) {
      setAmountIn(maxBalance)
    }
  }

  const handleRefreshBalances = async () => {
    if (!walletAddress || isLoadingBalances) return
    await loadBalances()
  }

  // Executar swap diretamente via MiniKit (sem janela simulada)
  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amountIn || Number.parseFloat(amountIn) <= 0) {
      toast.error(translations.enterAmount || "Enter amount")
      return
    }

    if (!walletAddress) {
      toast.error("Please connect your wallet")
      return
    }

    // Verificar se tem saldo suficiente
    const balance = Number.parseFloat(tokenBalances[tokenIn] || "0")
    const amount = Number.parseFloat(amountIn)

    if (amount > balance) {
      toast.error(`Saldo insuficiente. Você tem ${balance} ${tokenIn}`)
      return
    }

    // Verificar se MiniKit está disponível
    if (typeof window === "undefined" || !(window as any).MiniKit) {
      toast.error("MiniKit não disponível. Use o World App.")
      return
    }

    setIsLoading(true)
    try {
      // Calcular minimum amount out com slippage
      const slippageMultiplier = 1 - Number.parseFloat(slippage) / 100
      const amountOutMinimum = (Number.parseFloat(amountOut) * slippageMultiplier).toString()

      console.log("Executing swap via MiniKit:", {
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMinimum,
        recipient: walletAddress,
      })

      // Executar swap via MiniKit - isso vai abrir a janela nativa do World App
      const txHash = await uniswapService.executeSwap({
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMinimum,
        recipient: walletAddress,
      })

      toast.success("Swap realizado com sucesso!", {
        description: `${amountIn} ${tokenIn} → ${amountOut} ${tokenOut}`,
        action: {
          label: "Ver TX",
          onClick: () => window.open(`https://worldchain-mainnet.explorer.alchemy.com/tx/${txHash}`, "_blank"),
        },
      })

      // Limpar campos e fechar modal
      setAmountIn("")
      setAmountOut("")
      onClose()

      // Atualizar saldos após o swap
      setTimeout(() => {
        handleRefreshBalances()
      }, 3000)
    } catch (error) {
      console.error("Error executing swap:", error)
      toast.error("Falha no swap. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative bg-gray-900 rounded-lg border border-gray-800 shadow-xl w-full max-w-sm overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">WLD ⇄ TPF Swap</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshBalances}
                  disabled={isLoadingBalances}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Refresh Balances"
                >
                  <RefreshCw size={16} className={isLoadingBalances ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Settings"
                >
                  <Settings size={16} />
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-800 bg-gray-800/30"
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Slippage Tolerance</span>
                      <div className="flex space-x-1">
                        {["0.1", "0.5", "1.0"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSlippage(value)}
                            className={`px-2 py-1 rounded text-xs ${
                              slippage === value
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {value}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>
                        Pool: {uniswapService.getContractAddresses().TPF_WLD_POOL.slice(0, 6)}...
                        {uniswapService.getContractAddresses().TPF_WLD_POOL.slice(-4)}
                      </div>
                      {poolDetails && (
                        <>
                          <div>
                            Fee: {poolDetails.fee / 10000}% | Tick: {poolDetails.tick}
                          </div>
                          <div>Liquidity: {Number(poolDetails.liquidity).toExponential(2)}</div>
                          <div className={poolDetails.isValid ? "text-green-400" : "text-red-400"}>
                            {poolDetails.isValid ? "✅ Pool Verified" : "⚠️ Pool Invalid"}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSwap} className="p-3 space-y-3">
              {/* Token de entrada */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">From</span>
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-5 h-5 rounded-full overflow-hidden">
                      <Image
                        src={tokens[tokenIn].icon || "/placeholder.svg"}
                        alt={tokens[tokenIn].name}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{tokens[tokenIn].symbol}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.00"
                    step="0.000001"
                    min="0"
                    className="flex-1 bg-transparent text-lg font-semibold text-white placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 rounded"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {isLoadingBalances ? (
                    <span className="flex items-center">
                      <Loader2 size={10} className="animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    `Balance: ${tokenBalances[tokenIn]} ${tokenIn}`
                  )}
                </div>
              </div>

              {/* Botão de troca */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapTokens}
                  className="p-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white transition-colors"
                >
                  <ArrowUpDown size={16} />
                </button>
              </div>

              {/* Token de saída */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">To</span>
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-5 h-5 rounded-full overflow-hidden">
                      <Image
                        src={tokens[tokenOut].icon || "/placeholder.svg"}
                        alt={tokens[tokenOut].name}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{tokens[tokenOut].symbol}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={amountOut}
                    readOnly
                    placeholder="0.00"
                    className="w-full bg-transparent text-lg font-semibold text-white placeholder-gray-500 focus:outline-none"
                  />
                  {isQuoting && <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {isLoadingBalances ? (
                    <span className="flex items-center">
                      <Loader2 size={10} className="animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    `Balance: ${tokenBalances[tokenOut]} ${tokenOut}`
                  )}
                </div>
              </div>

              {/* Informações de taxa */}
              <div className="text-xs text-gray-400 flex items-center justify-between px-1">
                <span className="flex items-center">
                  <Info size={12} className="mr-1" />
                  Taxa: {poolFee ? poolFee / 10000 : "0.3"}%
                </span>
                <span>Slippage: {slippage}%</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !amountIn || !amountOut || isLoadingBalances || isQuoting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Executando via MiniKit...
                  </div>
                ) : (
                  `Swap ${tokenIn} → ${tokenOut}`
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
