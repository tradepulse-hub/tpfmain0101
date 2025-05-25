"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import QRCode from "react-qr-code"
import { Copy, Check, AlertTriangle, X } from "lucide-react"
import { getCurrentLanguage } from "../lib/i18n"

interface ReceiveTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function ReceiveTokenModal({ isOpen, onClose, walletAddress }: ReceiveTokenModalProps) {
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [translations, setTranslations] = useState({
    title: "Receive Tokens",
    attention: "ATTENTION:",
    warningText: "Only receive tokens from Worldchain. Tokens from other networks may be permanently lost.",
    yourAddress: "Your address",
  })

  useEffect(() => {
    const updateLanguage = () => {
      const currentLang = getCurrentLanguage()
      setLanguage(currentLang)

      if (currentLang === "pt") {
        setTranslations({
          title: "Receber Tokens",
          attention: "ATENÇÃO:",
          warningText:
            "Receba apenas tokens da Worldchain. Tokens de outras redes poderão ser perdidos permanentemente.",
          yourAddress: "Seu endereço",
        })
      } else {
        setTranslations({
          title: "Receive Tokens",
          attention: "ATTENTION:",
          warningText: "Only receive tokens from Worldchain. Tokens from other networks may be permanently lost.",
          yourAddress: "Your address",
        })
      }
    }

    updateLanguage()
    window.addEventListener("languageChange", updateLanguage)
    return () => window.removeEventListener("languageChange", updateLanguage)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copying:", err)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`
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
              <h3 className="text-base font-bold text-white">{translations.title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mb-2 text-xs text-amber-400 bg-amber-900/30 p-1.5 rounded flex items-start">
              <AlertTriangle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">{translations.attention}</span> {translations.warningText}
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <div className="bg-white p-2 rounded">
                <QRCode value={walletAddress} size={128} />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded p-2">
              <div className="text-gray-400 text-xs mb-1">{translations.yourAddress}</div>
              <div className="flex items-center justify-between">
                <div className="text-white font-mono text-xs overflow-hidden overflow-ellipsis">
                  {formatAddress(walletAddress)}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded transition-colors"
                  aria-label="Copy address"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
