"use client"

import { useState, useEffect } from "react"
import { Crown, Copy, CheckCircle, Award, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"
import { BottomNav } from "@/components/bottom-nav"

export default function MembershipPage() {
  const { t } = useTranslation()
  const [walletCopied, setWalletCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const destinationWallet = "0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677"
  const supportEmail = "support@tradepulsetoken.com"

  useEffect(() => setMounted(true), [])

  const copyToClipboard = (text: string, type: "wallet" | "email") => {
    navigator.clipboard.writeText(text)
    if (type === "wallet") {
      setWalletCopied(true)
      setTimeout(() => setWalletCopied(false), 2000)
    } else {
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    }
  }

  const Section = ({ delay, gradient, borderColor, children }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-xl"
    >
      <div className={`absolute inset-0 ${gradient}`} />
      <div
        className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl border ${borderColor} shadow-xl`}
      >
        {children}
      </div>
    </motion.div>
  )

  const CopyButton = ({ text, type, copied }: any) => (
    <motion.button
      onClick={() => copyToClipboard(text, type)}
      className="ml-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {copied ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Copy
          className={`h-5 w-5 ${type === "wallet" ? "text-blue-500 hover:text-blue-600 dark:hover:text-blue-400" : "text-purple-500 hover:text-purple-600 dark:hover:text-purple-400"}`}
        />
      )}
    </motion.button>
  )

  if (!mounted) return null

  return (
    <div className="relative min-h-screen overflow-hidden pb-20">
      <BackgroundEffect className="fixed inset-0 z-0" />

      <div className="container relative z-10 mx-auto px-4 py-4">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500">
            {t.membership?.title || "TPulseFi Membership"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.membership?.subtitle || "Premium Membership"}</p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-3">
          {/* Compact Benefits & Price */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200 dark:border-amber-900/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Award className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg font-bold text-green-600 dark:text-green-400">
                  {t.membership?.whatWeOffer || "Benefits"}
                </h3>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold text-lg rounded-full w-12 h-12 flex items-center justify-center">
                  20
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">WLD forever!</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              {t.membership?.benefitDescription ||
                "Part of TPF transaction fees goes to our members on the 9th of every month!"}
            </p>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t.membership?.benefitNote || "And it's not that little!"}
            </p>
          </motion.div>

          {/* Compact Payment Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200 dark:border-blue-900/50"
          >
            <h3 className="text-lg font-bold mb-3 text-blue-600 dark:text-blue-400">
              {t.membership?.paymentInfo || "Payment Information"}
            </h3>
            <div className="mb-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t.membership?.destinationWallet || "Destination Wallet:"}
              </p>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                <code className="text-xs flex-1 overflow-x-auto font-mono text-gray-800 dark:text-gray-200">
                  {destinationWallet}
                </code>
                <CopyButton text={destinationWallet} type="wallet" copied={walletCopied} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t.membership?.contactSupport || "After payment, contact support:"}
              </p>
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                <code className="text-xs flex-1 font-mono text-gray-800 dark:text-gray-200">{supportEmail}</code>
                <CopyButton text={supportEmail} type="email" copied={emailCopied} />
              </div>
            </div>
          </motion.div>

          {/* Compact Tip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50"
          >
            <div className="flex items-start">
              <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                  {t.membership?.tip || "Tip:"}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {t.membership?.tipDescription ||
                    "Include the transaction screenshot and your wallet address in the email."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="membership" />
    </div>
  )
}
