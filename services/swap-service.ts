```typescriptreact
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, ArrowUpDown, Loader2, Settings, RefreshCw, Zap, Info } from 'lucide-react'
import { toast } from "sonner"
import { ethers } from "ethers"

// Holdstation SDK Imports
import { Client, Multicall3, Quoter, SwapHelper } from "@holdstation/worldchain-ethers-v5"
import { config, inmemoryTokenStorage, TokenProvider } from "@holdstation/worldchain-sdk"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens suportados
const TOKENS = {
  WLD: {
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    symbol: "WLD",
    name: "Worldcoin",
    decimals: 18,
    icon: "/worldcoin.jpeg",
  },
  TPF: {
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    symbol: "TPF",
    name: "TPulseFi",
    decimals: 18,
    icon: "/logo-tpf.png",
  },
  DNA: {
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    symbol: "DNA",
    name: "DNA Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
  WDD: {
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    symbol: "WDD",
    name: "WDD Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
  CASH: {
    address: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
    symbol: "CASH",
    name: "Cash Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
}

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

// Classe para gerenciar o Holdstation SDK
class HoldstationSwapService {
  private provider: ethers.providers.StaticJsonRpcProvider | null = null
  private client: Client | null = null
  private multicall3: Multicall3 | null = null
  private tokenProvider: TokenProvider | null = null
  private quoter: Quoter | null = null
  private swapHelper: SwapHelper | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation SDK...")

      // Configurar provider
      this.provider = new ethers.providers.StaticJsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Inicializar componentes do Holdstation SDK
      this.client = new Client(this.provider)
      this.multicall3 = new Multicall3(this.provider)

      // Configurar SDK global
      config.client = this.client
      config.multicall3 = this.multicall3

      // Inicializar serviços
      this.tokenProvider = new TokenProvider()
      this.quoter = new Quoter(this.client)
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      console.log("✅ Holdstation SDK initialized successfully")
      this.initialized = true
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation SDK:", error)
      throw error
    }
  }

  async getTokenBalances(walletAddress: string) {
    if (!this.initialized) await this.initialize()

    const balances = []
    
    for (const [symbol, token] of Object.entries(TOKENS)) {
      try {
        const contract = new ethers.Contract(
          token.address,
          ["function balanceOf(address) view returns (uint256)"],
          this.provider!
        )
        
        const balance = await contract.balanceOf(walletAddress)
        const formattedBalance = ethers.utils.formatUnits(balance, token.decimals)

        balances.push({
          symbol: symbol as keyof typeof TOKENS,
          balance: balance.toString(),
          formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
        })
      } catch (error) {
        console.error(`Error getting balance for ${symbol}:`, error)
        balances.push({
          symbol: symbol as keyof typeof TOKENS,
          balance: "0",
          formattedBalance: "0.000000",
        })
      }
    }

    return balances
  }

  async getQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    if (!this.initialized) await this.initialize()

    try {
      console.log(`💱 Getting quote: ${amountIn} ${tokenIn} → ${tokenOut}`)

      const tokenInAddress = TOKENS[tokenIn as keyof typeof TOKENS].address
      const tokenOutAddress = TOKENS[tokenOut as keyof typeof TOKENS].address

      // Usar SwapHelper para obter cotação
      const quoteParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn,
        slippage: "0.5", // 0.5% slippage
        fee: "0.0", // Sem taxa
      }

      const estimate = await this.swapHelper!.quote(quoteParams)
      console.log("✅ Quote estimate:", estimate)

      return estimate
    } catch (error) {
      console.error("❌ Error getting quote:", error)
      throw error
    }
  }

  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    quoteData: any,
    walletAddress: string
  ) {
    if (!this.initialized) await this.initialize()

    try {
      console.log("🚀 Executing swap via Holdstation...")

      const tokenInAddress = TOKENS[tokenIn as keyof typeof TOKENS].address
      const tokenOutAddress = TOKENS[tokenOut as keyof typeof TOKENS].address

      // Preparar parâmetros do swap
      const swapParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn,
        tx: {
          data: quoteData.data,
          to: quoteData.to,
          value: quoteData.value || "0",
        },
        feeAmountOut: quoteData.addons?.feeAmountOut || "0",
        fee: "0.0",
        feeReceiver: ethers.constants.AddressZero,
      }

      // Verificar MiniKit
      if (typeof window === "undefined") {
        throw new Error("Window not available")
      }

      const MiniKit = (window as any).MiniKit
      if (!MiniKit?.isInstalled()) {
        throw new Error("MiniKit not available. Please use World App.")
      }

      // Executar swap via MiniKit
      console.log("📋 Swap transaction:", swapParams.tx)

      const result = await MiniKit.commandsAsync.sendTransaction({
        to: swapParams.tx.to,
        data: swapParams.tx.data,
        value: swapParams.tx.value,
      })

      if (!result.success) {
        throw new Error(`Swap transaction failed: ${result.error}`)
      }

      console.log("✅ Swap executed successfully:", result.transactionId)
      return result.transactionId
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }
}

// Instância global do serviço
const holdstationService = new HoldstationSwapService()

export default function SwapModal({ isOpen, onClose, walletAddress }: SwapModalProps) {
  const [tokenIn, setTokenIn] = useState<keyof typeof TOKENS>("WLD")
  const [tokenOut, setTokenOut] = useState<keyof typeof TOKENS>("TPF")
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isLoading, setIsLoading] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [quoteData, setQuoteData] = useState<any>(null)
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({
    WLD: "0.000000",
    TPF: "0.000000",
    DNA: "0.000000",
    WDD: "0.000000",
    CASH: "0.000000",
  })

  // Carregar saldos quando o modal abrir
  useEffect(() => {
    if (!isOpen) return

    if (walletAddress) {
      loadBalances()
    }
  }, [isOpen, walletAddress])

  const loadBalances = async () => {
    if (!walletAddress) return

    setIsLoadingBalances(true)
    try {
      console.log("Loading token balances...")
      const balances = await holdstationService.getTokenBalances(walletAddress)

      const balanceMap: Record<string, string> = {}
      balances.forEach((balance) => {
        balanceMap[balance.symbol] = balance.formattedBalance
      })

      setTokenBalances(balanceMap)
      console.log("Token balances loaded:", balanceMap)
    } catch (error) {
      console.error("Error loading balances:", error)
      toast.error("Erro ao carregar saldos")
    } finally {
      setIsLoadingBalances(false)
    }
  }

  // Obter cotação quando o valor de entrada mudar
  useEffect(() => {
    const getQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) <= 0) {
        setAmountOut("")
        setQuoteData(null)
        return
      }

      if (tokenIn === tokenOut) {
        setAmountOut(amountIn)
        return
      }

      setIsQuoting(true)
      try {
        console.log("Getting quote via Holdstation...")
        const quote = await holdstationService.getQuote(tokenIn, tokenOut, amountIn)

        if (quote && quote.amountOut) {
          setAmountOut(quote.amountOut)
          setQuoteData(quote)
          console.log(`Quote: ${quote.amountOut} ${tokenOut}`)
        } else {
          setAmountOut("0")
          setQuoteData(null)
        }
      } catch (error) {
        console.error("Error getting quote:", error)
        setAmountOut("0")
        setQuoteData(null)
        toast.error("Erro ao obter cotação")
      } finally {
        setIsQuoting(false)
      }
    }

    const timeoutId = setTimeout(getQuote, 1000) // Debounce
    return () => clearTimeout(timeoutId)
  }, [amountIn, tokenIn, tokenOut])

  const handleSwapTokens = () => {
    const tempToken = tokenIn
    const tempAmount = amountIn

    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
    setQuoteData(null)
  }

  const handleMaxAmount = () => {
    const maxBalance = tokenBalances[tokenIn]
    if (maxBalance && Number.parseFloat(maxBalance) > 0) {
      setAmountIn(maxBalance)
    }
  }

  const handleRefreshBalances = async () => {
    if (!walletAddress || isLoadingBalances) return
    await loadBalances()
  }

  // Executar swap usando Holdstation
  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amountIn || Number.parseFloat(amountIn) <= 0) {
      toast.error("Digite o valor para swap")
      return
    }

    if (!walletAddress) {
      toast.error("Conecte sua carteira")
      return
    }

    if (!quoteData) {
      toast.error("Obtenha uma cotação primeiro")
      return
    }

    // Verificar se tem saldo suficiente
    const balance = Number.parseFloat(tokenBalances[tokenIn] || "0")
    const amount = Number.parseFloat(amountIn)

    if (amount > balance) {
      toast.error(`Saldo insuficiente. Você tem ${balance} ${tokenIn}`)
      return
    }

    setIsLoading(true)
    try {
      console.log("🚀 Executing Holdstation swap:")
      console.log(`├─ ${amountIn} ${tokenIn} -> ${tokenOut}`)
      console.log(`├─ Expected out: ${amountOut}`)
      console.log(`├─ Slippage: ${slippage}%`)
      console.log(`└─ Recipient: ${walletAddress}`)

      // Executar swap via Holdstation
      const txHash = await holdstationService.executeSwap(
        tokenIn,
        tokenOut,
        amountIn,
        quoteData,
        walletAddress
      )

      console.log("✅ Holdstation swap completed successfully!")
      console.log(`└─ Transaction hash: ${txHash}`)

      toast.success("🎉 Swap Realizado com Sucesso!", {
        description: `${amountIn} ${tokenIn} → ${amountOut} ${tokenOut}`,
        action: {
          label: "Ver TX",
          onClick: () => window.open(`https://worldscan.org/tx/${txHash}`, "_blank"),
        },
      })

      // Limpar campos e fechar modal
      setAmountIn("")
      setAmountOut("")
      setQuoteData(null)
      onClose()

      // Atualizar saldos após o swap
      setTimeout(() => {
        handleRefreshBalances()
      }, 5000)
    } catch (error: any) {
      console.error("❌ Holdstation swap failed:", error)

      let errorMessage = "Falha no swap. Tente novamente."

      if (error.message.includes("MiniKit")) {
        errorMessage = "Erro do MiniKit. Verifique se está usando o World App."
      } else if (error.message.includes("insufficient")) {
        errorMessage = "Saldo insuficiente para o swap."
      } else if (error.message.includes("slippage")) {
        errorMessage = "Preço mudou muito. Tente aumentar o slippage."
      }

      toast.error(errorMessage, {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative bg-gray-900 rounded-lg border border-gray-800 shadow-xl w-full max-w-sm overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center p-3 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Zap size={20} className="mr-2 text-blue-400" />
                Holdstation Swap
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshBalances}
                  disabled={isLoadingBalances}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Refresh Balances"
                >
                  <RefreshCw size={16} className={isLoadingBalances ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-white p-1"
                  aria-label="Settings"
                >
                  <Settings size={16} />
                </button>
                <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-gray-800 bg-gray-800/30"
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Slippage Tolerance</span>
                      <div className="flex space-x-1">
                        {["0.1", "0.5", "1.0"].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSlippage(value)}
                            className={`px-2 py-1 rounded text-xs ${
                              slippage === value
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {value}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div className="text-blue-400">⚡ Powered by Holdstation SDK</div>
                      <div className="text-green-400">✅ Smart Routing Enabled</div>
                      <div className="text-yellow-400">🔄 Multicall3 Optimized</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSwap} className="p-3 space-y-3">
              {/* Token de entrada */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">From</span>
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-5 h-5 rounded-full overflow-hidden">
                      <Image
                        src={TOKENS[tokenIn].icon || "/placeholder.svg"}
                        alt={TOKENS[tokenIn].name}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{TOKENS[tokenIn].symbol}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.00"
                    step="0.000001"
                    min="0"
                    className="flex-1 bg-transparent text-lg font-semibold text-white placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 rounded"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {isLoadingBalances ? (
                    <span className="flex items-center">
                      <Loader2 size={10} className="animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    `Balance: ${tokenBalances[tokenIn]} ${tokenIn}`
                  )}
                </div>
              </div>

              {/* Botão de troca */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapTokens}
                  className="p-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white transition-colors"
                >
                  <ArrowUpDown size={16} />
                </button>
              </div>

              {/* Token de saída */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">To</span>
                  <div className="flex items-center space-x-2 text-white">
                    <div className="w-5 h-5 rounded-full overflow-hidden">
                      <Image
                        src={TOKENS[tokenOut].icon || "/placeholder.svg"}
                        alt={TOKENS[tokenOut].name}
                        width={20}
                        height={20}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{TOKENS[tokenOut].symbol}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={amountOut}
                    readOnly
                    placeholder="0.00"
                    className="w-full bg-transparent text-lg font-semibold text-white placeholder-gray-500 focus:outline-none"
                  />
                  {isQuoting && <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {isLoadingBalances ? (
                    <span className="flex items-center">
                      <Loader2 size={10} className="animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    `Balance: ${tokenBalances[tokenOut]} ${tokenOut}`
                  )}
                </div>
              </div>

              {/* Informações */}
              <div className="text-xs text-gray-400 flex items-center justify-between px-1">
                <span className="flex items-center text-blue-400">
                  <Info size={12} className="mr-1" />
                  Holdstation SDK
                </span>
                <span>Slippage: {slippage}%</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !amountIn || !amountOut || isLoadingBalances || isQuoting || !quoteData}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Executando via Holdstation...
                  </div>
                ) : (
                  `⚡ Swap ${tokenIn} → ${tokenOut}`
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```
