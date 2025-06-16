"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Copy, Check, QrCode, Info } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface ReceiveTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function ReceiveTokenModal({ isOpen, onClose, walletAddress }: ReceiveTokenModalProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success(t.wallet?.addressCopied || "Address copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copying:", err)
      toast.error(t.receiveToken?.errorCopyingAddress || "Error copying address")
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
            className="bg-gray-900 rounded-lg border border-gray-800 p-2 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Download size={20} className="mr-2 text-green-400" />
                {t.receiveToken?.title || "Receive Tokens"}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="text-center space-y-2">
              {/* QR Code Placeholder */}
              <div className="w-32 h-32 mx-auto bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
                <QrCode size={48} className="text-gray-600" />
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">
                  {t.receiveToken?.yourWalletAddress || "Your wallet address:"}
                </p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
                  <p className="text-white font-mono text-sm break-all">{walletAddress}</p>
                </div>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-lg flex items-center justify-center"
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-2" />
                    {t.receiveToken?.copied || "Copied!"}
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    {t.receiveToken?.copyAddress || "Copy Address"}
                  </>
                )}
              </button>

              {/* Instructions */}
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-2">
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-blue-200/80 text-xs text-left">
                    {t.receiveToken?.receiveInstructions ||
                      "Share this address to receive TPF tokens and other Worldchain tokens"}
                  </p>
                </div>
              </div>

              {/* Supported Networks */}
              <div className="bg-gray-800/30 rounded-lg p-2">
                <h4 className="text-gray-300 font-medium mb-1 text-sm">
                  {t.receiveToken?.supportedNetworks || "Supported Networks:"}
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <span className="text-gray-400 text-sm">Worldchain Mainnet</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
