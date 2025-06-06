"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronDown, X, ArrowUpDown, Loader2 } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "../lib/i18n"
import { holdstationService } from "../services/holdstation-service"
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
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState(getTranslations("en").swap || {})
  const [walletTokens, setWalletTokens] = useState<any[]>([])
  const [showTokenInDropdown, setShowTokenInDropdown] = useState(false)
  const [showTokenOutDropdown, setShowTokenOutDropdown] = useState(false)

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

  useEffect(() => {
    const loadWalletTokens = async () => {
      if (walletAddress) {
        try {
          const tokens = await holdstationService.getTokenBalances(walletAddress)
          setWalletTokens(tokens)
          console.log("Loaded real wallet tokens:", tokens)
        } catch (error) {
          console.error("Error loading wallet tokens:", error)
          setWalletTokens([])
        }
      }
    }
    loadWalletTokens()
  }, [walletAddress])

  const selectedTokenIn = walletTokens.find((t) => t.symbol === tokenIn) || walletTokens[0]
  const selectedTokenOut = walletTokens.find((t) => t.symbol === tokenOut) || walletTokens[1]

  // Obter cotação quando o valor de entrada mudar
  useEffect(() => {
    const getQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) <= 0) {
        setAmountOut("")
        return
      }

      setIsQuoting(true)
      try {
        const quote = await holdstationService.getSmartQuote(tokenIn, tokenOut, Number.parseFloat(slippage))
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

    if (!amountIn || Number.parseFloat(amountIn) <= 0) {
      toast.error(translations.enterAmount || "Enter amount")
      return
    }

    if (tokenIn === tokenOut) {
      toast.error(translations.error || "Cannot swap same token")
      return
    }

    setIsLoading(true)
    try {
      // Obter cotação final usando a API da Holdstation
      const quoteParams = {
        tokenIn: holdstationService.getTokenAddress(tokenIn),
        tokenOut: holdstationService.getTokenAddress(tokenOut),
        amountIn,
        slippage,
        fee: "0.2",
      }

      const quote = await holdstationService.getQuote(quoteParams)

      // Executar swap real usando a API da Holdstation
      const swapParams = {
        tokenIn: quoteParams.tokenIn,
        tokenOut: quoteParams.tokenOut,
        amountIn,
        tx: quote,
        fee: "0.2",
        feeAmountOut: quote.feeAmountOut,
        feeReceiver: walletAddress || ethers.ZeroAddress,
      }

      const txHash = await holdstationService.executeSwap(swapParams)

      toast.success(translations.success || "Swap completed successfully!", {
        description: `${amountIn} ${tokenIn} → ${amountOut} ${tokenOut}`,
        action: {
          label: "View TX",
          onClick: () => window.open(`https://worldscan.org/tx/${txHash}`, "_blank"),
        },
      })

      // Limpar campos e fechar modal
      setAmountIn("")
      setAmountOut("")
      onClose()

      // Recarregar saldos da carteira
      const loadWalletTokens = async () => {
        if (walletAddress) {
          try {
            const tokens = await holdstationService.getTokenBalances(walletAddress)
            setWalletTokens(tokens)
            console.log("Loaded real wallet tokens:", tokens)
          } catch (error) {
            console.error("Error loading wallet tokens:", error)
            setWalletTokens([])
          }
        }
      }
      loadWalletTokens()
    } catch (error) {
      console.error("Error executing swap:", error)
      toast.error(translations.error || "Swap failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = () => {
      setShowTokenInDropdown(false)
      setShowTokenOutDropdown(false)
    }

    if (showTokenInDropdown || showTokenOutDropdown) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [showTokenInDropdown, showTokenOutDropdown])

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
              <h2 className="text-lg font-bold text-white">{translations.title || "Swap"}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSwap} className="p-3 space-y-3">
              {/* Token de entrada */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">{translations.from || "From"}</span>
                  <button
                    type="button"
                    className="flex items-center space-x-1 text-white hover:text-gray-300"
                    onClick={() => setShowTokenInDropdown(!showTokenInDropdown)}
                  >
                    <div className="w-4 h-4 rounded-full overflow-hidden">
                      <Image
                        src={selectedTokenIn?.icon || "/placeholder.svg"}
                        alt={selectedTokenIn?.name || "Token"}
                        width={16}
                        height={16}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedTokenIn?.symbol || "Select"}</span>
                    <ChevronDown size={12} />
                  </button>

                  {showTokenInDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                      {walletTokens
                        .filter((t) => t.symbol !== tokenOut)
                        .map((token) => (
                          <button
                            key={token.symbol}
                            type="button"
                            className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-700 text-gray-300"
                            onClick={() => {
                              setTokenIn(token.symbol)
                              setShowTokenInDropdown(false)
                            }}
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden mr-2">
                              <Image
                                src={token.icon || "/placeholder.svg"}
                                alt={token.name}
                                width={16}
                                height={16}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-gray-400">{Number.parseFloat(token.balance).toFixed(4)}</div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  className="w-full bg-transparent text-lg font-semibold text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {/* Botão de troca */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapTokens}
                  className="p-1 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white transition-colors"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

              {/* Token de saída */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">{translations.to || "To"}</span>
                  <button
                    type="button"
                    className="flex items-center space-x-1 text-white hover:text-gray-300"
                    onClick={() => setShowTokenOutDropdown(!showTokenOutDropdown)}
                  >
                    <div className="w-4 h-4 rounded-full overflow-hidden">
                      <Image
                        src={selectedTokenOut?.icon || "/placeholder.svg"}
                        alt={selectedTokenOut?.name || "Token"}
                        width={16}
                        height={16}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedTokenOut?.symbol || "Select"}</span>
                    <ChevronDown size={12} />
                  </button>

                  {showTokenOutDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                      {walletTokens
                        .filter((t) => t.symbol !== tokenIn)
                        .map((token) => (
                          <button
                            key={token.symbol}
                            type="button"
                            className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-700 text-gray-300"
                            onClick={() => {
                              setTokenOut(token.symbol)
                              setShowTokenOutDropdown(false)
                            }}
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden mr-2">
                              <Image
                                src={token.icon || "/placeholder.svg"}
                                alt={token.name}
                                width={16}
                                height={16}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left flex-1">
                              <div className="font-medium">{token.symbol}</div>
                              <div className="text-xs text-gray-400">{Number.parseFloat(token.balance).toFixed(4)}</div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
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
              </div>

              {/* Slippage compacto */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{translations.slippage || "Slippage"}:</span>
                <div className="flex space-x-1">
                  {["1", "3", "5"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSlippage(value)}
                      className={`px-2 py-1 rounded text-xs ${
                        slippage === value ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !amountIn || !amountOut}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={14} className="animate-spin mr-2" />
                    {translations.processing || "Swapping..."}
                  </div>
                ) : (
                  translations.swapButton || "Swap"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
