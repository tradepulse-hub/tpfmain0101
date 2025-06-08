"use client"

import { useState, useEffect } from "react"
import { Crown, Copy, CheckCircle, Star, Award, Sparkles } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { motion } from "framer-motion"
import { BackgroundEffect } from "@/components/background-effect"

export default function MembershipPage() {
  const { t } = useTranslation()
  const [walletCopied, setWalletCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const destinationWallet = "0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677"
  const supportEmail = "support@tradepulsetoken.com"

  useEffect(() => {
    setMounted(true)
  }, [])

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

  if (!mounted) return null

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effect */}
      <BackgroundEffect className="fixed inset-0 z-0" />

      {/* Floating Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-yellow-500/10 dark:bg-yellow-500/5"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.3,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 py-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center mb-10"
        >
          <div className="relative mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 blur-md opacity-70"
              style={{ width: "100%", height: "100%", transform: "scale(1.2)" }}
            />
            <Crown className="h-16 w-16 text-yellow-500 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500 mb-2">
            {t.membership?.title || "TPulseFi Membership"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center text-lg">
            {t.membership?.subtitle || "Premium Membership"}
          </p>

          <motion.div
            className="w-24 h-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mt-4"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </motion.div>

        <div className="space-y-8 max-w-3xl mx-auto">
          {/* Main Question */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 animate-pulse" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-xl">
              <div className="absolute top-0 right-0 -mt-6 -mr-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Sparkles className="h-12 w-12 text-yellow-500/30" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400">
                {t.membership?.readyQuestion || "Are you ready to become a true TPulseFi membership?"}
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300">
                {t.membership?.exclusiveAccess || "Exclusive access to premium features and rewards"}
              </p>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl border border-green-200 dark:border-green-900/50 shadow-xl">
              <div className="flex items-center mb-4">
                <Award className="h-8 w-8 text-green-500 mr-3" />
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                  {t.membership?.whatWeOffer || "What do we have to offer?"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-lg text-gray-700 dark:text-gray-200">
                      {t.membership?.benefitDescription ||
                        "Part of TPF transaction fees goes to our members on the 9th of every month!"}
                    </p>
                  </div>
                </div>

                <motion.div
                  className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-lg"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(52, 211, 153, 0.2)",
                      "0 0 15px rgba(52, 211, 153, 0.5)",
                      "0 0 0 rgba(52, 211, 153, 0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <p className="text-lg font-medium text-green-700 dark:text-green-400">
                    {t.membership?.benefitNote || "And it's not that little!"}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Price */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-xl">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md" />
                  <div className="relative bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold text-2xl rounded-full w-16 h-16 flex items-center justify-center">
                    20
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400">
                  {t.membership?.price || "20 WLD"}{" "}
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {t.membership?.priceForever || "forever!"}
                  </span>
                </h3>

                <p className="text-lg text-center text-gray-700 dark:text-gray-200">
                  {t.membership?.priceExplanation || "That means you pay 20 WLD and get the fees forever!"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Payment Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-xl">
              <h3 className="text-xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                {t.membership?.paymentInfo || "Payment Information"}
              </h3>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                  {t.membership?.destinationWallet || "Destination Wallet:"}
                </p>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-md blur-sm transform scale-105" />
                  <div className="relative flex items-center bg-white dark:bg-gray-800 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                    <code className="text-sm flex-1 overflow-x-auto font-mono text-gray-800 dark:text-gray-200">
                      {destinationWallet}
                    </code>
                    <motion.button
                      onClick={() => copyToClipboard(destinationWallet, "wallet")}
                      className="ml-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Copy wallet address"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {walletCopied ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* After Payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="relative overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-violet-500/20" />
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-xl">
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400">
                {t.membership?.afterPayment || "After Payment"}
              </h3>

              <p className="mb-4 text-gray-700 dark:text-gray-200">
                {t.membership?.contactSupport || "After payment, contact the support team with the screenshot to:"}
              </p>

              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-md blur-sm transform scale-105" />
                <div className="relative flex items-center bg-white dark:bg-gray-800 p-4 rounded-md border border-purple-200 dark:border-purple-800">
                  <code className="text-sm flex-1 font-mono text-gray-800 dark:text-gray-200">{supportEmail}</code>
                  <motion.button
                    onClick={() => copyToClipboard(supportEmail, "email")}
                    className="ml-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Copy email address"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {emailCopied ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-purple-500 hover:text-purple-600 dark:hover:text-purple-400" />
                    )}
                  </motion.button>
                </div>
              </div>

              <motion.div
                className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800/50"
                animate={{
                  boxShadow: [
                    "0 0 0 rgba(234, 179, 8, 0.2)",
                    "0 0 10px rgba(234, 179, 8, 0.3)",
                    "0 0 0 rgba(234, 179, 8, 0.2)",
                  ],
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      {t.membership?.tip || "Tip:"}
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      {t.membership?.tipDescription ||
                        "Include the transaction screenshot and your wallet address in the email."}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
