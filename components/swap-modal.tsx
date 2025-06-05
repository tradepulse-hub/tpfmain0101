"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Loader2 } from "lucide-react"
import { enhancedWalletService } from "@/services/enhanced-wallet-service"
import { getCurrentLanguage, getTranslations } from "@/lib/i18n"

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function SwapModal({ isOpen, onClose, walletAddress }: SwapModalProps) {
  const [tokenIn, setTokenIn] = useState("")
  const [tokenOut, setTokenOut] = useState("")
  const [amountIn, setAmountIn] = useState("")
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")

  const translations = getTranslations(language)

  useEffect(() => {
    const currentLang = getCurrentLanguage()
    setLanguage(currentLang)

    const handleLanguageChange = () => {
      setLanguage(getCurrentLanguage())
    }

    window.addEventListener("languageChange", handleLanguageChange)
    return () => window.removeEventListener("languageChange", handleLanguageChange)
  }, [])

  const tokens = [
    { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006" },
    { symbol: "USDCe", name: "USD Coin", address: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1" },
    { symbol: "WLD", name: "Worldcoin", address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003" },
    { symbol: "TPF", name: "TPulseFi Token", address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45" },
  ]

  const handleGetQuote = async () => {
    if (!tokenIn || !tokenOut || !amountIn) return

    setLoading(true)
    try {
      const quoteResult = await enhancedWalletService.getSwapQuote(tokenIn, tokenOut, amountIn)
      setQuote(quoteResult)
    } catch (error) {
      console.error("Error getting quote:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!quote) return

    setSwapping(true)
    try {
      const result = await enhancedWalletService.executeSwap({
        tokenIn,
        tokenOut,
        amountIn,
        quote,
      })
      console.log("Swap successful:", result)
      onClose()
    } catch (error) {
      console.error("Error executing swap:", error)
    } finally {
      setSwapping(false)
    }
  }

  const swapTokens = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    setQuote(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">{language === "pt" ? "Trocar Tokens" : "Swap Tokens"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token In */}
          <div className="space-y-2">
            <Label className="text-gray-300">{language === "pt" ? "De" : "From"}</Label>
            <Select value={tokenIn} onValueChange={setTokenIn}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder={language === "pt" ? "Selecionar token" : "Select token"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {tokens.map((token) => (
                  <SelectItem key={token.address} value={token.address} className="text-white">
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount In */}
          <div className="space-y-2">
            <Label className="text-gray-300">{language === "pt" ? "Quantidade" : "Amount"}</Label>
            <Input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={swapTokens} className="text-gray-400 hover:text-white">
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Token Out */}
          <div className="space-y-2">
            <Label className="text-gray-300">{language === "pt" ? "Para" : "To"}</Label>
            <Select value={tokenOut} onValueChange={setTokenOut}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder={language === "pt" ? "Selecionar token" : "Select token"} />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {tokens.map((token) => (
                  <SelectItem key={token.address} value={token.address} className="text-white">
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quote */}
          {quote && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-300">
                {language === "pt" ? "Você receberá aproximadamente:" : "You will receive approximately:"}
              </p>
              <p className="text-lg font-semibold text-white">{quote.amountOut}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={handleGetQuote}
              disabled={!tokenIn || !tokenOut || !amountIn || loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === "pt" ? "Obter Cotação" : "Get Quote"}
            </Button>

            {quote && (
              <Button onClick={handleSwap} disabled={swapping} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {swapping && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === "pt" ? "Trocar" : "Swap"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
