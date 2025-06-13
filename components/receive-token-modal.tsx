"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Copy, Check, QrCode } from "lucide-react"
import { toast } from "sonner"

interface ReceiveTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function ReceiveTokenModal({ isOpen, onClose, walletAddress }: ReceiveTokenModalProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success("Endereço copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copying:", err)
      toast.error("Erro ao copiar endereço")
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
                <Download size={20} className="mr-2 text-green-400" />
                Receber Tokens
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="text-center space-y-4">
              {/* QR Code Placeholder */}
              <div className="w-48 h-48 mx-auto bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
                <QrCode size={64} className="text-gray-600" />
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Seu endereço da carteira:</p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <p className="text-white font-mono text-sm break-all">{walletAddress}</p>
                </div>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg flex items-center justify-center"
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    Copiar Endereço
                  </>
                )}
              </button>

              <p className="text-gray-500 text-xs">
                Compartilhe este endereço para receber tokens TPF e outros tokens da Worldchain
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
