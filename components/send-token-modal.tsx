"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronDown, ChevronUp, X, AlertCircle } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "../lib/i18n"
import { enhancedWalletService } from "@/services/enhanced-wallet-service"
import { toast } from "sonner"

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

export function SendTokenModal({ isOpen, onClose, walletAddress }: SendTokenModalProps) {
  const [address, setAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("TPF")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState(getTranslations("en").sendToken || {})
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    const updateLanguage = () => {
      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)
      setTranslations(getTranslations(currentLang).sendToken || {})
    }
    updateLanguage()
    window.addEventListener("languageChange", updateLanguage)
    return () => window.removeEventListener("languageChange", updateLanguage)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!address) {
      setError(translations.addressRequired || "Address is required")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError(translations.invalidAmount || "Invalid amount")
      return
    }

    setIsLoading(true)
    try {
      console.log(`Sending ${amount} ${token} to ${address} using REAL Holdstation SDK`)

      // Usar o serviço REAL para enviar tokens
      const tokenAddress = token === "ETH" ? undefined : getTokenAddress(token)

      const result = await enhancedWalletService.sendToken({
        to: address,
        amount: Number.parseFloat(amount),
        token: tokenAddress,
      })

      console.log("REAL transaction sent successfully:", result)

      // Mostrar notificação de sucesso
      toast.success(translations.transactionSuccess || "Transaction sent successfully!", {
        description: `${amount} ${token} ${translations.sentTo || "sent to"} ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        action: {
          label: translations.viewTx || "View TX",
          onClick: () => window.open(`https://worldscan.org/tx/${result.hash}`, "_blank"),
        },
      })

      // Limpar campos e fechar modal
      setAddress("")
      setAmount("")
      onClose()

      // Disparar evento para atualizar a UI
      const event = new CustomEvent("token_transfer_completed", {
        detail: {
          token,
          amount: Number.parseFloat(amount),
          to: address,
          txHash: result.hash,
          from: walletAddress,
          type: "send",
          date: new Date().toISOString(),
          status: "completed",
          id: `tx-${Date.now()}`,
        },
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error("Error sending REAL tokens:", error)
      setError(error instanceof Error ? error.message : translations.error || "Error sending tokens. Please try again.")

      // Mostrar notificação de erro
      toast.error(translations.transactionFailed || "Transaction failed", {
        description:
          error instanceof Error ? error.message : translations.error || "Error sending tokens. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Obter endereço do token
  const getTokenAddress = (symbol: string): string => {
    const TOKEN_ADDRESSES: Record<string, string> = {
      TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
      WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
      WETH: "0x4200000000000000000000000000000000000006",
      USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
    }
    return TOKEN_ADDRESSES[symbol] || ""
  }

  const tokens = [
    { id: "TPF", name: "TPulseFi", icon: "/logo-tpf.png" },
    { id: "WLD", name: "Worldcoin", icon: "/worldcoin.jpeg" },
    { id: "WETH", name: "Wrapped Ether", icon: "/ethereum-abstract.png" },
    { id: "USDCe", name: "USD Coin", icon: "/usdc-coins.png" },
    { id: "ETH", name: "Ethereum", icon: "/ethereum-abstract.png" },
  ]

  const selectedToken = tokens.find((t) => t.id === token) || tokens[0]

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
            className="relative bg-gray-900 rounded-lg border border-gray-800 shadow-xl w-full max-w-xs overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-800">
              <h2 className="text-base font-bold text-white">{translations.title || "Send Tokens"}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3">
              {showWarning && (
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400 flex items-center">
                  <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                  <div>
                    <p>{translations.warning || "Please verify the recipient address before sending tokens."}</p>
                    <p className="mt-1">
                      {translations.warningWorldchain || "Using REAL Holdstation SDK. Transactions are irreversible."}
                    </p>
                    <button
                      type="button"
                      className="text-amber-500 hover:text-amber-400 text-xs mt-1 underline"
                      onClick={() => setShowWarning(false)}
                    >
                      {translations.hideWarning || "Hide warning"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {translations.selectToken || "Select Token"}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-2 rounded border border-gray-700 bg-gray-800/50"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden mr-2 bg-gray-700 flex-shrink-0">
                        <Image
                          src={selectedToken.icon || "/placeholder.svg"}
                          alt={selectedToken.name}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{selectedToken.id}</div>
                      </div>
                    </div>
                    {isDropdownOpen ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        className="absolute z-10 mt-1 w-full rounded border border-gray-700 bg-gray-800 shadow-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="py-1">
                          {tokens.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={`w-full flex items-center px-2 py-1 text-sm ${
                                token === t.id ? "bg-blue-500/20 text-white" : "text-gray-300 hover:bg-gray-700"
                              }`}
                              onClick={() => {
                                setToken(t.id)
                                setIsDropdownOpen(false)
                              }}
                            >
                              <div className="w-5 h-5 rounded-full overflow-hidden mr-2 bg-gray-700 flex-shrink-0">
                                <Image
                                  src={t.icon || "/placeholder.svg"}
                                  alt={t.name}
                                  width={20}
                                  height={20}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-sm">{t.id}</div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mb-2">
                <label htmlFor="address" className="block text-xs font-medium text-gray-400 mb-1">
                  {translations.address || "Address"}
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="amount" className="block text-xs font-medium text-gray-400 mb-1">
                  {translations.amount || "Amount"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{token}</div>
                </div>
              </div>

              {error && <div className="mb-2 text-red-500 text-xs">{error}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {translations.processing || "Processing..."}
                  </div>
                ) : (
                  translations.send || "Send"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
