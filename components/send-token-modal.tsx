"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, AlertTriangle, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { walletService } from "@/services/wallet-service"
import type { TokenBalance } from "@/services/types"
import Image from "next/image"

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function SendTokenModal({ isOpen, onClose, walletAddress }: SendTokenModalProps) {
  const { t } = useTranslation()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [showWarning, setShowWarning] = useState(true)

  // Carregar tokens disponíveis quando o modal abrir
  useEffect(() => {
    if (isOpen && walletAddress) {
      loadAvailableTokens()
    }
  }, [isOpen, walletAddress])

  const loadAvailableTokens = async () => {
    setIsLoadingTokens(true)
    try {
      const tokens = await walletService.getTokenBalances(walletAddress)
      // Filtrar tokens com saldo > 0
      const tokensWithBalance = tokens.filter((token) => Number.parseFloat(token.balance) > 0)
      setAvailableTokens(tokensWithBalance)

      // Selecionar o primeiro token com saldo como padrão
      if (tokensWithBalance.length > 0 && !selectedToken) {
        setSelectedToken(tokensWithBalance[0])
      }
    } catch (error) {
      console.error("Error loading tokens:", error)
      toast.error("Erro ao carregar tokens disponíveis")
    } finally {
      setIsLoadingTokens(false)
    }
  }

  const handleTokenSelect = (token: TokenBalance) => {
    setSelectedToken(token)
    setShowTokenSelector(false)
    setAmount("") // Limpar amount quando trocar de token
  }

  const handleMaxAmount = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipient || !amount || !selectedToken) {
      toast.error(t.sendToken?.fillAllFields || "Fill all fields")
      return
    }

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      toast.error(t.sendToken?.invalidAddress || "Invalid address")
      return
    }

    const amountNum = Number.parseFloat(amount)
    const availableBalance = Number.parseFloat(selectedToken.balance)

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t.sendToken?.invalidValue || "Invalid value")
      return
    }

    if (amountNum > availableBalance) {
      toast.error(`Saldo insuficiente. Você tem ${availableBalance} ${selectedToken.symbol}`)
      return
    }

    setIsLoading(true)
    try {
      console.log(`Sending ${amount} ${selectedToken.symbol} to ${recipient}`)

      const result = await walletService.sendToken({
        to: recipient,
        amount: amountNum,
        tokenAddress: selectedToken.address,
      })

      if (result.success) {
        toast.success(t.sendToken?.tokensSentSuccess || "Tokens sent successfully!", {
          description: `${amount} ${selectedToken.symbol} ${t.sendToken?.sentTo || "sent to"} ${recipient.substring(0, 10)}...`,
          action: result.txHash
            ? {
                label: t.sendToken?.viewTx || "View TX",
                onClick: () => window.open(`https://worldscan.org/tx/${result.txHash}`, "_blank"),
              }
            : undefined,
        })

        setRecipient("")
        setAmount("")
        onClose()
      } else {
        throw new Error(result.error || "Transaction failed")
      }
    } catch (error) {
      console.error("Error sending tokens:", error)
      toast.error(t.sendToken?.errorSendingTokens || "Error sending tokens")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-800 p-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Send size={20} className="mr-2 text-blue-400" />
                {t.sendToken?.title || "Send Tokens"}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Warning Message */}
            {showWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg"
              >
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-yellow-200 text-sm mb-2">
                      {t.sendToken?.warning || "Please verify the recipient address before sending tokens."}
                    </p>
                    <p className="text-yellow-200/80 text-xs">
                      {t.sendToken?.warningWorldchain ||
                        "Do not send to wallets that don't support Worldchain, otherwise you may lose your assets. Do not send to exchanges."}
                    </p>
                    <button
                      onClick={() => setShowWarning(false)}
                      className="text-yellow-400 text-xs mt-2 hover:text-yellow-300"
                    >
                      {t.sendToken?.hideWarning || "Hide warning"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Token Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.sendToken?.selectToken || "Select Token"}</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTokenSelector(!showTokenSelector)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    disabled={isLoadingTokens}
                  >
                    {isLoadingTokens ? (
                      <span className="flex items-center">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Loading tokens...
                      </span>
                    ) : selectedToken ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                          <Image
                            src={selectedToken.icon || "/placeholder.svg"}
                            alt={selectedToken.symbol}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>
                          {selectedToken.symbol} - {selectedToken.name}
                        </span>
                        <span className="ml-auto text-gray-400 text-sm">
                          {Number.parseFloat(selectedToken.balance).toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select a token</span>
                    )}
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {/* Token Dropdown */}
                  {showTokenSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                    >
                      {availableTokens.length > 0 ? (
                        availableTokens.map((token) => (
                          <button
                            key={token.address}
                            type="button"
                            onClick={() => handleTokenSelect(token)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <Image
                                  src={token.icon || "/placeholder.svg"}
                                  alt={token.symbol}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-white text-sm">{token.symbol}</div>
                                <div className="text-gray-400 text-xs">{token.name}</div>
                              </div>
                            </div>
                            <div className="text-gray-300 text-sm">{Number.parseFloat(token.balance).toFixed(4)}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">No tokens with balance available</div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t.sendToken?.recipientAddress || "Recipient Address"}
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">{t.sendToken?.quantity || "Amount"}</label>
                  {selectedToken && (
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Max: {Number.parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.000001"
                    min="0"
                    max={selectedToken?.balance}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {selectedToken && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                      {selectedToken.symbol}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedToken || isLoadingTokens}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {t.sendToken?.processing || "Processing..."}
                  </div>
                ) : (
                  `${t.sendToken?.sendTokens || "Send"} ${selectedToken?.symbol || "Tokens"}`
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
