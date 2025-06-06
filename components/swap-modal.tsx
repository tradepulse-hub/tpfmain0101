"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronDown, X, ArrowUpDown, Loader2 } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "../lib/i18n"
import { swapService } from "../services/swap-service"
import { toast } from "sonner"

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
      // Simular swap bem-sucedido
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success(translations.success || "Swap completed successfully!", {
        description: `${amountIn} ${tokenIn} → ${amountOut} ${tokenOut}`,
      })

      // Limpar campos e fechar modal
      setAmountIn("")
      setAmountOut("")
      onClose()
    } catch (error) {
      console.error("Error executing swap:", error)
      toast.error(translations.error || "Swap failed. Please try again.")
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
              <h2 className="text-lg font-bold text-white">{translations.title || "Swap"}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSwap} className="p-3 space-y-3">
              {/* Token de entrada */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">{translations.from || "From"}</span>
                  <div className="flex items-center space-x-1 text-white">
                    <div className="w-4 h-4 rounded-full overflow-hidden">
                      <Image
                        src={selectedTokenIn.icon || "/placeholder.svg"}
                        alt={selectedTokenIn.name}
                        width={16}
                        height={16}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedTokenIn.id}</span>
                    <ChevronDown size={12} />
                  </div>
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
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">{translations.to || "To"}</span>
                  <div className="flex items-center space-x-1 text-white">
                    <div className="w-4 h-4 rounded-full overflow-hidden">
                      <Image
                        src={selectedTokenOut.icon || "/placeholder.svg"}
                        alt={selectedTokenOut.name}
                        width={16}
                        height={16}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedTokenOut.id}</span>
                    <ChevronDown size={12} />
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
