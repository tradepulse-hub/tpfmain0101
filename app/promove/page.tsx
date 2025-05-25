"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MiniKit } from "@worldcoin/minikit-js"
import { BottomNav } from "@/components/bottom-nav"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"
import { ExternalLink, ArrowRightLeft, LinkIcon, MousePointer, Clock } from "lucide-react"

interface Promotion {
  id: string
  url: string
  title: string
  description: string
  clicks: number
  createdAt: string
  userId: string
}

export default function PromovePage() {
  const [translations, setTranslations] = useState(getTranslations(getCurrentLanguage()))
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userAddress, setUserAddress] = useState("")
  const [promotions, setPromotions] = useState<Promotion[]>([])

  // Form states
  const [linkUrl, setLinkUrl] = useState("")
  const [linkTitle, setLinkTitle] = useState("")
  const [linkDescription, setLinkDescription] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)

  // Target address for transfer
  const TARGET_ADDRESS = "0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677"

  useEffect(() => {
    const handleLanguageChange = () => {
      setTranslations(getTranslations(getCurrentLanguage()))
    }

    handleLanguageChange()
    window.addEventListener("languageChange", handleLanguageChange)

    return () => {
      window.removeEventListener("languageChange", handleLanguageChange)
    }
  }, [])

  useEffect(() => {
    // Clear any previous authorization on page load
    if (typeof window !== "undefined") {
      // Clear all promove authorizations
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("promove_authorized_")) {
          localStorage.removeItem(key)
        }
      })
    }

    checkConnection()
    loadPromotions()
    setIsAuthorized(false) // Always start unauthorized

    // Auto-refresh promotions every 10 seconds
    const interval = setInterval(loadPromotions, 10000)
    return () => clearInterval(interval)
  }, [])

  const checkConnection = () => {
    if (MiniKit.isInstalled() && MiniKit.user) {
      setIsConnected(true)
      setUserAddress(MiniKit.user.walletAddress || "")
    }
  }

  const loadPromotions = async () => {
    try {
      const response = await fetch("/api/promove/links")
      if (response.ok) {
        const data = await response.json()
        setPromotions(Array.isArray(data.promotions) ? data.promotions : [])
      }
    } catch (error) {
      console.error("Error loading promotions:", error)
      setPromotions([]) // Ensure it's always an array
    }
  }

  const handleTransfer = async () => {
    if (!isConnected || !userAddress) {
      alert(translations.promove?.connectWallet || "Connect your wallet to continue")
      return
    }

    setIsProcessing(true)

    try {
      console.log("Starting transfer process...")

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        to: TARGET_ADDRESS,
        value: "0xde0b6b3a7640000", // 1 WLD in wei (hex)
        data: "0x",
      })

      console.log("Transfer result:", finalPayload)

      if (finalPayload.status === "error") {
        throw new Error(finalPayload.message || "Transfer failed")
      }

      if (finalPayload.status === "success") {
        console.log("Transfer successful!")

        // Only save authorization if transfer was successful
        localStorage.setItem(`promove_authorized_${userAddress}`, "true")
        setIsAuthorized(true)

        // Save transfer record
        try {
          await fetch("/api/promove/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userAddress,
              transactionHash: finalPayload.transaction_id || "unknown",
              amount: "1.0",
              token: "WLD",
            }),
          })
        } catch (paymentError) {
          console.error("Error saving payment record:", paymentError)
        }

        alert(translations.promove?.transferSuccess || "Transfer successful! You can now create promotions.")
      } else {
        throw new Error(`Unexpected status: ${finalPayload.status}`)
      }
    } catch (error) {
      console.error("Transfer error:", error)

      // Do NOT authorize if transfer failed
      setIsAuthorized(false)
      localStorage.removeItem(`promove_authorized_${userAddress}`)

      alert(`Transfer failed. ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePublishLink = async () => {
    if (!isAuthorized) {
      alert("You must complete the transfer first to promote links.")
      return
    }

    if (!linkUrl || !linkTitle) {
      alert(translations.promove?.enterValidUrl || "Please enter a valid URL and title")
      return
    }

    setIsPublishing(true)

    try {
      const response = await fetch("/api/promove/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: linkUrl,
          title: linkTitle,
          description: linkDescription,
          userId: userAddress,
        }),
      })

      if (response.ok) {
        setLinkUrl("")
        setLinkTitle("")
        setLinkDescription("")
        loadPromotions()
        alert(translations.promove?.linkPublished || "Link published successfully!")
      } else {
        throw new Error("Failed to publish link")
      }
    } catch (error) {
      console.error("Error publishing link:", error)
      alert("Error publishing link. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleLinkClick = async (promotionId: string, url: string) => {
    // Track click
    try {
      await fetch(`/api/promove/links/${promotionId}/click`, {
        method: "POST",
      })
      // Update local state with safety check
      setPromotions((prev) =>
        Array.isArray(prev) ? prev.map((p) => (p.id === promotionId ? { ...p, clicks: p.clicks + 1 } : p)) : [],
      )
    } catch (error) {
      console.error("Error tracking click:", error)
    }

    // Open link
    window.open(url, "_blank")
  }

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt).getTime()
    const now = Date.now()
    const elapsed = now - created
    const remaining = 3600000 - elapsed // 1 hour in ms

    if (remaining <= 0) return "Expired"

    const minutes = Math.floor(remaining / 60000)
    return `${minutes}m remaining`
  }

  // Debug info
  console.log("Promove Debug:", { isConnected, isAuthorized, userAddress })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {translations.promove?.title || "Promote"}
          </h1>
          <p className="text-gray-300 text-sm">
            {translations.promove?.subtitle || "Promote your links for 1 hour by transferring 1 WLD"}
          </p>
        </motion.div>

        {/* Debug Info - Remove after testing */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4 text-xs">
          <p>Debug: Connected: {isConnected ? "Yes" : "No"}</p>
          <p>Debug: Authorized: {isAuthorized ? "Yes" : "No"}</p>
          <p>Debug: Address: {userAddress || "None"}</p>
          <p>Debug: MiniKit installed: {typeof window !== "undefined" && MiniKit.isInstalled() ? "Yes" : "No"}</p>
          <p>Debug: MiniKit user: {typeof window !== "undefined" && MiniKit.user ? "Yes" : "No"}</p>
          <p>Debug: Target: {TARGET_ADDRESS}</p>
          <p>Debug: Promotions count: {Array.isArray(promotions) ? promotions.length : "Not array"}</p>
        </div>

        {!isConnected ? (
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ArrowRightLeft className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-4">
              {translations.promove?.connectWallet || "Connect your wallet to continue"}
            </p>
          </motion.div>
        ) : !isAuthorized ? (
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center mb-6">
              <ArrowRightLeft className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2 text-white">Transfer Required</h2>
              <p className="text-gray-300 text-sm mb-4">
                Transfer 1 WLD to unlock link promotion features. You can create unlimited promotions after this
                one-time transfer.
              </p>
            </div>

            <motion.button
              onClick={handleTransfer}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing
                ? translations.promove?.processing || "Processing transfer..."
                : translations.promove?.transferButton || "Transfer 1 WLD"}
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Create Promotion Form - Only shows after successful transfer */}
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-blue-400" />
                {translations.promove?.createPromotion || "Create Promotion"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {translations.promove?.linkUrl || "Link URL"}
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {translations.promove?.linkTitle || "Title"}
                  </label>
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Link title..."
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {translations.promove?.linkDescription || "Description"}
                  </label>
                  <textarea
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <motion.button
                  onClick={handlePublishLink}
                  disabled={isPublishing || !linkUrl || !linkTitle}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPublishing
                    ? translations.promove?.processing || "Publishing..."
                    : translations.promove?.publishLink || "Publish Link (1h)"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Promoted Links List */}
        <motion.div
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
            <span className="flex items-center">
              <LinkIcon className="w-5 h-5 mr-2 text-green-400" />
              {translations.promove?.promotedLinks || "Promoted Links"}
            </span>
            <span className="text-sm text-gray-400">
              {Array.isArray(promotions) ? promotions.length : 0} {translations.promove?.active || "active"}
            </span>
          </h2>

          {!Array.isArray(promotions) || promotions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {translations.promove?.noPromotions || "No active promotions"}
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {promotions.map((promotion, index) => (
                <motion.div
                  key={promotion.id}
                  className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  onClick={() => handleLinkClick(promotion.id, promotion.url)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate">{promotion.title}</h3>
                      {promotion.description && (
                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">{promotion.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center">
                          <MousePointer className="w-3 h-3 mr-1" />
                          {promotion.clicks} {translations.promove?.clicksCount || "clicks"}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getTimeRemaining(promotion.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav activeTab="promove" />
    </div>
  )
}
