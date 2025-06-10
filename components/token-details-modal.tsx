"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, ExternalLink, Copy, Check } from "lucide-react"
import { getCurrentLanguage, getTranslations } from "../lib/i18n"
import { enhancedTokenService } from "../services/holdstation-service"

interface TokenDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  tokenSymbol: string
  tokenBalance: string
  walletAddress: string
}

export function TokenDetailsModal({
  isOpen,
  onClose,
  tokenSymbol,
  tokenBalance,
  walletAddress,
}: TokenDetailsModalProps) {
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [refreshedBalance, setRefreshedBalance] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const translations = getTranslations(language)

  useEffect(() => {
    const updateLanguage = () => {
      setLanguage(getCurrentLanguage())
    }
    updateLanguage()
    window.addEventListener("languageChange", updateLanguage)
    return () => window.removeEventListener("languageChange", updateLanguage)
  }, [])

  useEffect(() => {
    if (isOpen && tokenSymbol && walletAddress) {
      fetchLatestBalance()
    }
  }, [isOpen, tokenSymbol, walletAddress])

  const fetchLatestBalance = async () => {
    try {
      setLoading(true)
      const balance = await enhancedTokenService.getTokenBalance(walletAddress, tokenSymbol)
      setRefreshedBalance(balance)
    } catch (error) {
      console.error("Error fetching latest balance:", error)
      setRefreshedBalance(tokenBalance)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copying:", err)
    }
  }

  const tokenInfo = enhancedTokenService.getTokenInfo(tokenSymbol)
  const displayBalance = refreshedBalance || tokenBalance

  if (!tokenInfo) {
    return null
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
              <h3 className="text-lg font-bold text-white">
                {translations.wallet?.tokenDetails || "Detalhes do Token"}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                <Image
                  src={tokenInfo.logo || "/placeholder.svg"}
                  alt={tokenInfo.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{tokenSymbol}</h4>
                <p className="text-gray-400 text-sm">{tokenInfo.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-1">
                  {translations.wallet?.balance || "Saldo"}
                  {loading && <span className="ml-2 text-xs">(atualizando...)</span>}
                </div>
                <div className="text-white font-mono text-lg">
                  {Number(displayBalance).toLocaleString(language === "pt" ? "pt-BR" : "en-US")} {tokenSymbol}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-1">
                  {translations.wallet?.contractAddress || "Endereço do Contrato"}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white font-mono text-sm overflow-hidden overflow-ellipsis">
                    {`${tokenInfo.address.substring(0, 10)}...${tokenInfo.address.substring(tokenInfo.address.length - 8)}`}
                  </div>
                  <button
                    onClick={() => copyToClipboard(tokenInfo.address)}
                    className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded transition-colors ml-2"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-2">
                  {translations.wallet?.tokenInfo || "Informações do Token"}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Decimals:</span>
                    <span className="text-white">{tokenInfo.decimals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white">Worldchain</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(`https://worldscan.org/token/${tokenInfo.address}`, "_blank")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center"
                >
                  <ExternalLink size={14} className="mr-1" />
                  {translations.wallet?.viewOnExplorer || "Ver no Explorer"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
