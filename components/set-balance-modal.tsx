"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { balanceSyncService } from "@/services/balance-sync-service"

interface SetBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  walletAddress: string
}

export function SetBalanceModal({ isOpen, onClose, currentBalance, walletAddress }: SetBalanceModalProps) {
  const [amount, setAmount] = useState(currentBalance.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const amountValue = Number.parseFloat(amount)
      if (isNaN(amountValue) || amountValue < 0) {
        throw new Error("Valor inválido")
      }

      // Update balance using balance sync service
      balanceSyncService.updateTPFBalance(walletAddress, amountValue)

      setSuccess("Saldo atualizado com sucesso!")
      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro desconhecido")
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
          className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-800 p-3 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-white">Definir Saldo TPF</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Fechar">
                ✕
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-3">
              Defina manualmente o saldo de TPF até que a integração com a blockchain esteja disponível.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="amount" className="text-xs text-gray-300">
                    Quantidade de TPF
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">TPF</div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-400 px-2 py-1 rounded text-xs">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-900/30 border border-green-800 text-green-400 px-2 py-1 rounded text-xs">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 rounded font-medium text-sm flex items-center justify-center ${
                  isLoading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Saldo"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
