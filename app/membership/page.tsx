"use client"

import { useState } from "react"
import { Crown, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { MiniKit } from "@worldcoin/minikit-js"

export default function MembershipPage() {
  const { t } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [walletCopied, setWalletCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const destinationWallet = "0xf04a78df4cc3017c0c23f37528d7b6cbbeea6677"
  const supportEmail = "support@tradepulsetoken.com"

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

  const handleBecomeMembership = async () => {
    setIsProcessing(true)
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit not installed")
      }

      const result = await MiniKit.transfer({
        to: destinationWallet,
        amount: "20",
        token: "WLD",
      })

      if (result) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 5000)
      }
    } catch (error) {
      console.error("Error processing membership payment:", error)
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="flex items-center justify-center mb-6">
        <Crown className="h-8 w-8 text-yellow-500 mr-2 animate-pulse" />
        <h1 className="text-3xl font-bold text-center">{t.membership?.title || "TPulseFi Membership"}</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
        {t.membership?.subtitle || "Premium Membership"}
      </p>

      <div className="space-y-8">
        {/* Main Question */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-center mb-4">
            {t.membership?.readyQuestion || "Are you ready to become a true TPulseFi membership?"}
          </h2>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">{t.membership?.whatWeOffer || "What do we have to offer?"}</h3>
          <p className="text-lg mb-2">
            1-{" "}
            {t.membership?.benefitDescription ||
              "Part of TPF transaction fees goes to our members on the 9th of every month!"}
          </p>
          <p className="text-lg font-medium text-green-700 dark:text-green-400">
            {t.membership?.benefitNote || "And it's not that little!"}
          </p>
        </div>

        {/* Price */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/30 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">
            {t.membership?.price || "20 WLD"}{" "}
            <span className="text-yellow-600 dark:text-yellow-400">{t.membership?.priceForever || "forever!"}</span>
          </h3>
          <p className="text-lg">
            {t.membership?.priceExplanation || "That means you pay 20 WLD and get the fees forever!"}
          </p>
        </div>

        {/* Payment Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBecomeMembership}
            disabled={isProcessing}
            className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isProcessing ? (
              <>
                <span className="animate-pulse">{t.membership?.processing || "Processing..."}</span>
              </>
            ) : (
              <>
                <Crown className="inline-block mr-2 h-5 w-5" />
                {t.membership?.becomeButton || "Become Membership"}
              </>
            )}
          </button>
        </div>

        {/* Payment Information */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">{t.membership?.paymentInfo || "Payment Information"}</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t.membership?.destinationWallet || "Destination Wallet:"}
            </p>
            <div className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-md">
              <code className="text-sm flex-1 overflow-x-auto">{destinationWallet}</code>
              <button
                onClick={() => copyToClipboard(destinationWallet, "wallet")}
                className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {walletCopied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* After Payment */}
        <div className="bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">{t.membership?.afterPayment || "After Payment"}</h3>
          <p className="mb-4">
            {t.membership?.contactSupport || "After payment, contact the support team with the screenshot to:"}
          </p>
          <div className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-md mb-4">
            <code className="text-sm flex-1">{supportEmail}</code>
            <button
              onClick={() => copyToClipboard(supportEmail, "email")}
              className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {emailCopied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t.membership?.tip || "Tip:"}</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {t.membership?.tipDescription ||
                "Include the transaction screenshot and your wallet address in the email."}
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Toast */}
      {showSuccess && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-5/6 max-w-md bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <p>Payment initiated successfully! Remember to contact support with your screenshot.</p>
        </div>
      )}

      {showError && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-5/6 max-w-md bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>Error processing payment. Please try again or contact support.</p>
        </div>
      )}
    </div>
  )
}
