"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function SendTokenModal({ isOpen, onClose, walletAddress }: SendTokenModalProps) {
  const { t } = useTranslation()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!recipient || !amount) {
      toast.error(t.sendToken?.fillAllFields || "Fill all fields")
      return
    }

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      toast.error(t.sendToken?.invalidAddress || "Invalid address")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t.sendToken?.invalidValue || "Invalid value")
      return
    }

    setIsLoading(true)
    try {
      console.log(`Sending ${amount} TPF to ${recipient}`)

      // Simular envio por enquanto
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast.success(t.sendToken?.tokensSentSuccess || "Tokens sent successfully!", {
        description: `${amount} TPF ${t.sendToken?.sentTo || "sent to"} ${recipient.substring(0, 10)}...`,
      })

      setRecipient("")
      setAmount("")
      onClose()
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

              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.sendToken?.quantity || "Quantity (TPF)"}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {t.sendToken?.processing || "Processing..."}
                  </div>
                ) : (
                  t.sendToken?.sendTokens || "Send Tokens"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
