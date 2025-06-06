"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronDown, ChevronUp, X, ArrowUpDown, AlertCircle, Loader2 } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "../lib/i18n"
import { swapService } from "../services/swap-service"
import { toast } from "sonner"
import { ethers } from "ethers"

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

export function SwapModal({ isOpen, onClose, walletAddress }: SwapModalProps) {
  const [tokenIn, setTokenIn] = useState("WETH")
  const [tokenOut, setTokenOut] = useState("USDCe")
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [slippage, setSlippage] = useState("3")
  const [isLoading, setIsLoading] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [error, setError] = useState("")
  const [isTokenInDropdownOpen, setIsTokenInDropdownOpen] = useState(false)
  const [isTokenOutDropdownOpen, setIsTokenOutDropdownOpen] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState(getTranslations("en").swap || {})

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

  const tokens = [
    { id: "WETH", name: "Wrapped Ethereum", icon: "/ethereum-abstract.png" },
    { id: "USDCe", name: "USD Coin", icon: "/usdc-coins.png" },
    { id: "TPF", name: "TPulseFi", icon: "/logo-tpf.png" },
    { id: "WLD", name: "Worldcoin", icon: "/worldcoin.jpeg" },
    { id: "DNA", name: "DNA Token", icon: "/dna-token.png" },
    { id: "CASH", name: "Cash", icon: "/cash-token.png" },
    { id: "WDD", name: "Drachma", icon: "/drachma-token.png" },
  ]

  const selectedTokenIn = tokens.find((t) => t.id === tokenIn) || tokens[0]
  const selectedTokenOut = tokens.find((t) => t.id === tokenOut) || tokens[1]

  // Obter cotação quando o valor de entrada mudar
  useEffect(() => {
    const getQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) <= 0) {
        setAmountOut("")
        return
      }

      setIsQuoting(true)
      try {
        const quote = await swapService.getSmartQuote(tokenIn, tokenOut, Number.parseFloat(slippage))
        const outputAmount = Number.parseFloat(amountIn) * Number.parseFloat(quote)
        setAmountOut(outputAmount.toFixed(6))
      } catch (error) {
        console.error("Error getting quote:", error)
        setAmountOut("0")
      } finally {
        setIsQuoting(false)
      }
    }

    const timeoutId = setTimeout(getQuote, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [amountIn, tokenIn, tokenOut, slippage])

  const handleSwapTokens = () => {
    const tempToken = tokenIn
    const tempAmount = amountIn

    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
  }

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!amountIn || Number.parseFloat(amountIn) <= 0) {
      setError(translations.invalidAmount || "Invalid amount")
      return
    }

    if (tokenIn === tokenOut) {
      setError(translations.sameToken || "Cannot swap same token")
      return
    }

    setIsLoading(true)
    try {
      // Obter cotação final
      const quoteParams = {
        tokenIn: swapService.getTokenAddress(tokenIn)!,
        tokenOut: swapService.getTokenAddress(tokenOut)!,
        amountIn,
        slippage,
        fee: "0.2",
      }

      const quote = await swapService.getQuote(quoteParams)

      // Executar swap
      const swapParams = {
        tokenIn: quoteParams.tokenIn,
        tokenOut: quoteParams.tokenOut,
        amountIn,
        tx: quote,
        fee: "0.2",
        feeAmountOut: quote.feeAmountOut,
        feeReceiver: walletAddress || ethers.ZeroAddress,
      }

      const txHash = await swapService.executeSwap(swapParams)

      toast.success(translations.swapSuccess || "Swap completed successfully!", {
        description: `${amountIn} ${tokenIn} → ${amountOut} ${tokenOut}`,
        action: {
          label: translations.viewTx || "View TX",
          onClick: () => window.open(`https://worldscan.org/tx/${txHash}`, "_blank"),
        },
      })

      // Limpar campos e fechar modal
      setAmountIn("")
      setAmountOut("")
      onClose()

      // Disparar evento para atualizar saldos
      const event = new CustomEvent("token_swap_completed", {
        detail: {
          tokenIn,
          tokenOut,
          amountIn: Number.parseFloat(amountIn),
          amountOut: Number.parseFloat(amountOut),
          txHash,
          walletAddress,
          type: "swap",
          date: new Date().toISOString(),
          status: "completed",
          id: `swap-${Date.now()}`,
        },
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error executing swap:", error)
      setError(error instanceof Error ? error.message : translations.swapError || "Swap failed. Please try again.")

      toast.error(translations.swapError || "Swap failed", {
        description: error instanceof Error ? error.message : translations.swapError || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-2"
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
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">{translations.title || "Swap Tokens"}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSwap} className="p-4">
              {/* Token de entrada */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">{translations.from || "From"}</label>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      type="button"
                      className="flex items-center space-x-2 text-white hover:text-gray-300"
                      onClick={() => setIsTokenInDropdownOpen(!isTokenInDropdownOpen)}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={selectedTokenIn.icon || "/placeholder.svg"}
                          alt={selectedTokenIn.name}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium">{selectedTokenIn.id}</span>
                      {isTokenInDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.00"
                    step="0.000001"
                    min="0"
                    className="w-full bg-transparent text-xl font-semibold text-white placeholder-gray-500 focus:outline-none"
                  />

                  <AnimatePresence>
                    {isTokenInDropdownOpen && (
                      <motion.div
                        className="absolute z-10 mt-2 w-full max-w-xs rounded border border-gray-700 bg-gray-800 shadow-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="py-1 max-h-48 overflow-y-auto">
                          {tokens
                            .filter((t) => t.id !== tokenOut)
                            .map((token) => (
                              <button
                                key={token.id}
                                type="button"
                                className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-700 ${
                                  tokenIn === token.id ? "bg-blue-500/20 text-white" : "text-gray-300"
                                }`}
                                onClick={() => {
                                  setTokenIn(token.id)
                                  setIsTokenInDropdownOpen(false)
                                }}
                              >
                                <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                                  <Image
                                    src={token.icon || "/placeholder.svg"}
                                    alt={token.name}
                                    width={20}
                                    height={20}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-left">
                                  <div className="font-medium">{token.id}</div>
                                  <div className="text-xs text-gray-400">{token.name}</div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Botão de troca */}
              <div className="flex justify-center mb-4">
                <button
                  type="button"
                  onClick={handleSwapTokens}
                  className="p-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white transition-colors"
                >
                  <ArrowUpDown size={16} />
                </button>
              </div>

              {/* Token de saída */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">{translations.to || "To"}</label>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      type="button"
                      className="flex items-center space-x-2 text-white hover:text-gray-300"
                      onClick={() => setIsTokenOutDropdownOpen(!isTokenOutDropdownOpen)}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={selectedTokenOut.icon || "/placeholder.svg"}
                          alt={selectedTokenOut.name}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium">{selectedTokenOut.id}</span>
                      {isTokenOutDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="text"
                      value={amountOut}
                      readOnly
                      placeholder="0.00"
                      className="w-full bg-transparent text-xl font-semibold text-white placeholder-gray-500 focus:outline-none"
                    />
                    {isQuoting && <Loader2 size={16} className="animate-spin text-gray-400 ml-2" />}
                  </div>

                  <AnimatePresence>
                    {isTokenOutDropdownOpen && (
                      <motion.div
                        className="absolute z-10 mt-2 w-full max-w-xs rounded border border-gray-700 bg-gray-800 shadow-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="py-1 max-h-48 overflow-y-auto">
                          {tokens
                            .filter((t) => t.id !== tokenIn)
                            .map((token) => (
                              <button
                                key={token.id}
                                type="button"
                                className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-700 ${
                                  tokenOut === token.id ? "bg-blue-500/20 text-white" : "text-gray-300"
                                }`}
                                onClick={() => {
                                  setTokenOut(token.id)
                                  setIsTokenOutDropdownOpen(false)
                                }}
                              >
                                <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                                  <Image
                                    src={token.icon || "/placeholder.svg"}
                                    alt={token.name}
                                    width={20}
                                    height={20}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-left">
                                  <div className="font-medium">{token.id}</div>
                                  <div className="text-xs text-gray-400">{token.name}</div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Configurações de slippage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {translations.slippage || "Slippage Tolerance"} (%)
                </label>
                <div className="flex space-x-2">
                  {["1", "3", "5"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-1 rounded text-sm ${
                        slippage === value ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                    placeholder="Custom"
                    step="0.1"
                    min="0"
                    max="50"
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded flex items-center">
                  <AlertCircle size={16} className="text-red-400 mr-2 flex-shrink-0" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !amountIn || !amountOut}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {translations.swapping || "Swapping..."}
                  </div>
                ) : (
                  translations.swap || "Swap"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
