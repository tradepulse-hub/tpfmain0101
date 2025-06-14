"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, ArrowUpDown, Loader2, Settings, RefreshCw, Zap, Info, Bug } from "lucide-react"
import { toast } from "sonner"
import { holdstationService } from "@/services/holdstation-service"
import { walletService } from "@/services/wallet-service"

interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress?: string
}

// Tokens disponíveis para swap
const AVAILABLE_TOKENS = {
  WLD: {
    symbol: "WLD",
    name: "Worldcoin",
    icon: "/worldcoin.jpeg",
    decimals: 18,
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  },
  TPF: {
    symbol: "TPF",
    name: "TPulseFi",
    icon: "/logo-tpf.png",
    decimals: 18,
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  },
  DNA: {
    symbol: "DNA",
    name: "DNA Token",
    icon: "/dna-token.png",
    decimals: 18,
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  },
  WDD: {
    symbol: "WDD",
    name: "Drachma Token",
    icon: "/drachma-token.png",
    decimals: 18,
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
  },
} as const

type TokenSymbol = keyof typeof AVAILABLE_TOKENS

export function SwapModal({ isOpen, onClose, walletAddress }: SwapModalProps) {
  const [tokenIn, setTokenIn] = useState<TokenSymbol>("WLD")
  const [tokenOut, setTokenOut] = useState<TokenSymbol>("TPF")
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [isLoading, setIsLoading] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDebugLogs, setShowDebugLogs] = useState(false)
  const [quoteData, setQuoteData] = useState<any>(null)
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({
    WLD: "0",
    TPF: "0",
    DNA: "0",
    WDD: "0",
  })
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [selectedToken, setSelectedToken] = useState<TokenSymbol | null>(null)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [amount, setAmount] = useState("")

  // Função helper para adicionar logs
  const addDebugLog = (message: string) => {
    console.log(`🔄 SWAP DEBUG: ${message}`)
    setDebugLogs((prev) => [...prev.slice(-30), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Carregar saldos quando o modal abrir
  useEffect(() => {
    if (!isOpen) return
    if (walletAddress) {
      addDebugLog("=== MODAL SWAP ABERTO ===")
      addDebugLog(`Endereço da carteira: ${walletAddress}`)
      loadBalances()
    }
  }, [isOpen, walletAddress])

  const loadBalances = async () => {
    setIsLoadingBalances(true)
    addDebugLog("=== CARREGANDO SALDOS DOS TOKENS ===")

    try {
      addDebugLog("Verificando disponibilidade do walletService...")

      if (walletService && typeof walletService.getTokenBalances === "function") {
        addDebugLog("✅ walletService disponível, fazendo chamada...")

        const balances = await walletService.getTokenBalances(walletAddress!)
        addDebugLog(`📊 Saldos recebidos: ${balances.length} tokens`)
        addDebugLog(`Dados brutos: ${JSON.stringify(balances, null, 2)}`)

        const balanceMap: Record<string, string> = {}
        balances.forEach((balance) => {
          if (AVAILABLE_TOKENS[balance.symbol as TokenSymbol]) {
            balanceMap[balance.symbol] = balance.formattedBalance || balance.balance
            addDebugLog(`💰 ${balance.symbol}: ${balance.formattedBalance || balance.balance}`)
          }
        })

        setTokenBalances(balanceMap)
        addDebugLog(`✅ Saldos carregados: ${JSON.stringify(balanceMap)}`)
      } else {
        addDebugLog("❌ walletService não disponível")
        throw new Error("walletService not available")
      }
    } catch (error) {
      addDebugLog(`❌ Erro ao carregar saldos: ${error.message}`)
      console.error("Error loading balances:", error)
      toast.error("Erro ao carregar saldos")
    } finally {
      setIsLoadingBalances(false)
      addDebugLog("=== FIM DO CARREGAMENTO DE SALDOS ===")
    }
  }

  const handleTokenSelect = (token: TokenSymbol) => {
    addDebugLog(`🔄 Token selecionado: ${token}`)
    setSelectedToken(token)
    setShowTokenSelector(false)
    setAmount("") // Limpar amount quando trocar de token
    addDebugLog(`✅ Token alterado para: ${token}, amount limpo`)
  }

  const handleMaxAmount = () => {
    if (selectedToken) {
      const maxBalance = tokenBalances[tokenIn]
      addDebugLog(`📊 MAX clicado para ${tokenIn}: ${maxBalance}`)
      if (maxBalance && Number.parseFloat(maxBalance) > 0) {
        setAmountIn(maxBalance)
        addDebugLog(`✅ Amount definido para MAX: ${maxBalance}`)
      } else {
        addDebugLog(`⚠️ Saldo insuficiente para MAX: ${maxBalance}`)
      }
    }
  }

  // Obter cotação usando Holdstation Service
  useEffect(() => {
    const getQuote = async () => {
      if (!amountIn || Number.parseFloat(amountIn) <= 0) {
        addDebugLog("⏭️ Pulando cotação: amount vazio ou zero")
        setAmountOut("")
        setQuoteData(null)
        return
      }

      if (tokenIn === tokenOut) {
        addDebugLog("⏭️ Pulando cotação: tokens iguais")
        setAmountOut(amountIn)
        return
      }

      setIsQuoting(true)
      addDebugLog("=== OBTENDO COTAÇÃO ===")
      addDebugLog(`📊 Parâmetros:`)
      addDebugLog(`├─ Token IN: ${tokenIn} (${AVAILABLE_TOKENS[tokenIn].address})`)
      addDebugLog(`├─ Token OUT: ${tokenOut} (${AVAILABLE_TOKENS[tokenOut].address})`)
      addDebugLog(`├─ Amount IN: ${amountIn}`)
      addDebugLog(`└─ Slippage: ${slippage}%`)

      try {
        addDebugLog("🔍 Verificando disponibilidade do holdstationService...")

        if (holdstationService && typeof holdstationService.getSwapQuote === "function") {
          addDebugLog("✅ holdstationService disponível")
          addDebugLog("📡 Fazendo chamada para getSwapQuote...")

          const quoteParams = {
            tokenIn: AVAILABLE_TOKENS[tokenIn].address,
            tokenOut: AVAILABLE_TOKENS[tokenOut].address,
            amountIn: amountIn,
            slippage: slippage,
          }

          addDebugLog(`📋 Parâmetros da cotação: ${JSON.stringify(quoteParams, null, 2)}`)

          const quote = await holdstationService.getSwapQuote(quoteParams)

          addDebugLog("📊 Cotação recebida:")
          addDebugLog(`├─ Raw response: ${JSON.stringify(quote, null, 2)}`)
          addDebugLog(`├─ Amount Out: ${quote?.amountOut}`)
          addDebugLog(`├─ Data: ${quote?.data?.substring(0, 20)}...`)
          addDebugLog(`└─ To: ${quote?.to}`)

          if (quote && quote.amountOut && Number.parseFloat(quote.amountOut) > 0) {
            setAmountOut(quote.amountOut)
            setQuoteData(quote)
            addDebugLog(`✅ Cotação aplicada: ${quote.amountOut} ${tokenOut}`)

            // Log detalhado dos addons se disponível
            if (quote.addons) {
              addDebugLog("📈 Detalhes da cotação:")
              addDebugLog(`├─ Rate Swap: ${quote.addons.rateSwap}`)
              addDebugLog(`├─ Min Received: ${quote.addons.minReceived}`)
              addDebugLog(`├─ Fee Amount: ${quote.addons.feeAmountOut}`)
              addDebugLog(`└─ USD Value: ${quote.addons.amountOutUsd}`)
            }
          } else {
            addDebugLog("❌ Cotação inválida recebida")
            addDebugLog(`├─ Quote object: ${!!quote}`)
            addDebugLog(`├─ Amount out: ${quote?.amountOut}`)
            addDebugLog(`└─ Amount parsed: ${Number.parseFloat(quote?.amountOut || "0")}`)

            setAmountOut("0")
            setQuoteData(null)
            toast.error("Cotação inválida recebida")
          }
        } else {
          addDebugLog("❌ holdstationService não disponível")
          addDebugLog(`├─ Service exists: ${!!holdstationService}`)
          addDebugLog(`└─ getSwapQuote function: ${typeof holdstationService?.getSwapQuote}`)

          setAmountOut("0")
          setQuoteData(null)
          toast.error("Serviço de cotação não disponível")
        }
      } catch (error) {
        addDebugLog("❌ ERRO NA COTAÇÃO:")
        addDebugLog(`├─ Tipo: ${typeof error}`)
        addDebugLog(`├─ Mensagem: ${error.message}`)
        addDebugLog(`├─ Stack: ${error.stack}`)
        addDebugLog(`└─ Objeto completo: ${JSON.stringify(error, null, 2)}`)

        console.error("Error getting quote:", error)
        setAmountOut("0")
        setQuoteData(null)
        toast.error(`Erro ao obter cotação: ${error.message}`)
      } finally {
        setIsQuoting(false)
        addDebugLog("=== FIM DA COTAÇÃO ===")
      }
    }

    const timeoutId = setTimeout(getQuote, 500)
    return () => clearTimeout(timeoutId)
  }, [amountIn, tokenIn, tokenOut, slippage])

  const handleSwapTokens = () => {
    addDebugLog("🔄 INVERTENDO TOKENS")
    addDebugLog(`├─ Antes: ${tokenIn} → ${tokenOut}`)

    const tempToken = tokenIn
    const tempAmount = amountIn

    setTokenIn(tokenOut)
    setTokenOut(tempToken)
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
    setQuoteData(null)

    addDebugLog(`├─ Depois: ${tokenOut} → ${tempToken}`)
    addDebugLog(`└─ Amounts: ${amountOut} → ${tempAmount}`)
  }

  const handleRefreshBalances = async () => {
    if (!walletAddress || isLoadingBalances) return
    addDebugLog("🔄 REFRESH MANUAL DE SALDOS")
    await loadBalances()
  }

  // Executar swap usando Holdstation Service
  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()

    addDebugLog("=== INICIANDO SWAP ===")
    addDebugLog(`📊 Parâmetros iniciais:`)
    addDebugLog(`├─ Amount IN: ${amountIn}`)
    addDebugLog(`├─ Token IN: ${tokenIn}`)
    addDebugLog(`├─ Token OUT: ${tokenOut}`)
    addDebugLog(`├─ Wallet: ${walletAddress}`)
    addDebugLog(`└─ Quote Data: ${!!quoteData}`)

    if (!amountIn || Number.parseFloat(amountIn) <= 0) {
      addDebugLog("❌ Validação falhou: Amount inválido")
      toast.error("Digite o valor para swap")
      return
    }

    if (!walletAddress) {
      addDebugLog("❌ Validação falhou: Wallet não conectada")
      toast.error("Conecte sua carteira")
      return
    }

    // Verificar saldo suficiente
    const balance = Number.parseFloat(tokenBalances[tokenIn] || "0")
    const amount = Number.parseFloat(amountIn)

    addDebugLog("💰 VERIFICAÇÃO DE SALDO:")
    addDebugLog(`├─ Saldo disponível: ${balance} ${tokenIn}`)
    addDebugLog(`├─ Quantidade solicitada: ${amount} ${tokenIn}`)
    addDebugLog(`└─ Suficiente: ${amount <= balance}`)

    if (amount > balance) {
      addDebugLog("❌ Validação falhou: Saldo insuficiente")
      toast.error(`Saldo insuficiente. Você tem ${balance} ${tokenIn}`)
      return
    }

    if (!quoteData) {
      addDebugLog("❌ Validação falhou: Sem cotação")
      toast.error("Obtenha uma cotação primeiro")
      return
    }

    setIsLoading(true)
    addDebugLog("🚀 EXECUTANDO SWAP...")

    try {
      addDebugLog("📋 Parâmetros do swap:")
      addDebugLog(`├─ Token IN: ${AVAILABLE_TOKENS[tokenIn].address}`)
      addDebugLog(`├─ Token OUT: ${AVAILABLE_TOKENS[tokenOut].address}`)
      addDebugLog(`├─ Amount IN: ${amountIn}`)
      addDebugLog(`├─ Expected OUT: ${amountOut}`)
      addDebugLog(`└─ Slippage: ${slippage}%`)

      addDebugLog("🔍 Verificando holdstationService...")
      if (holdstationService && typeof holdstationService.executeSwap === "function") {
        addDebugLog("✅ holdstationService.executeSwap disponível")

        const swapParams = {
          tokenIn: AVAILABLE_TOKENS[tokenIn].address,
          tokenOut: AVAILABLE_TOKENS[tokenOut].address,
          amountIn: amountIn,
          slippage: slippage,
        }

        addDebugLog(`📡 Chamando executeSwap com: ${JSON.stringify(swapParams, null, 2)}`)

        const txHash = await holdstationService.executeSwap(swapParams)

        addDebugLog("✅ SWAP EXECUTADO COM SUCESSO!")
        addDebugLog(`├─ Transaction Hash: ${txHash}`)
        addDebugLog(`├─ Amount IN: ${amountIn} ${tokenIn}`)
        addDebugLog(`├─ Amount OUT: ${amountOut} ${tokenOut}`)
        addDebugLog(`└─ Slippage: ${slippage}%`)

        toast.success("🎉 Swap Realizado com Sucesso!", {
          description: `${amountIn} ${tokenIn} → ${amountOut} ${tokenOut}`,
          action: {
            label: "Ver TX",
            onClick: () => {
              addDebugLog(`🔗 Abrindo explorer: https://worldscan.org/tx/${txHash}`)
              window.open(`https://worldscan.org/tx/${txHash}`, "_blank")
            },
          },
        })

        // Limpar campos e fechar modal
        addDebugLog("🧹 Limpando campos...")
        setAmountIn("")
        setAmountOut("")
        setQuoteData(null)
        onClose()

        // Atualizar saldos após o swap
        addDebugLog("🔄 Agendando atualização de saldos em 3s...")
        setTimeout(() => {
          addDebugLog("🔄 Atualizando saldos pós-swap...")
          handleRefreshBalances()
        }, 3000)
      } else {
        addDebugLog("❌ holdstationService.executeSwap não disponível")
        addDebugLog(`├─ Service exists: ${!!holdstationService}`)
        addDebugLog(`└─ executeSwap function: ${typeof holdstationService?.executeSwap}`)
        throw new Error("Serviço de swap não disponível")
      }
    } catch (error: any) {
      addDebugLog("❌ ERRO NO SWAP:")
      addDebugLog(`├─ Tipo: ${typeof error}`)
      addDebugLog(`├─ Mensagem: ${error.message}`)
      addDebugLog(`├─ Stack: ${error.stack}`)
      addDebugLog(`├─ Code: ${error.code}`)
      addDebugLog(`├─ Reason: ${error.reason}`)
      addDebugLog(`└─ Objeto completo: ${JSON.stringify(error, null, 2)}`)

      console.error("❌ Swap failed:", error)

      let errorMessage = "Falha no swap. Tente novamente."

      if (error.message?.includes("insufficient")) {
        errorMessage = "Saldo insuficiente para o swap."
        addDebugLog("🔍 Erro identificado: Saldo insuficiente")
      } else if (error.message?.includes("slippage")) {
        errorMessage = "Slippage muito alto. Tente aumentar a tolerância."
        addDebugLog("🔍 Erro identificado: Slippage alto")
      } else if (error.message?.includes("rejected")) {
        errorMessage = "Transação rejeitada pelo usuário."
        addDebugLog("🔍 Erro identificado: Rejeitada pelo usuário")
      } else if (error.message?.includes("network")) {
        errorMessage = "Erro de rede. Tente novamente."
        addDebugLog("🔍 Erro identificado: Problema de rede")
      }

      addDebugLog(`💬 Mensagem de erro final: ${errorMessage}`)

      toast.error(errorMessage, {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
      addDebugLog("=== FIM DO SWAP ===")
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
                  onClick={() => setShowDebugLogs(!showDebugLogs)}
                  className="text-gray-400 hover:text-white p-1"
                  title="Toggle Debug Logs"
                >
                  <Bug size={16} />
                </button>
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

            {/* Debug Logs Panel */}
            {showDebugLogs && debugLogs.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-800 bg-gray-800/30 max-h-40 overflow-y-auto"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Debug Logs ({debugLogs.length})</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(debugLogs.join("\n"))
                        toast.success("Logs copiados!")
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {debugLogs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-gray-300">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

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
                            onClick={() => {
                              addDebugLog(`⚙️ Slippage alterado: ${slippage}% → ${value}%`)
                              setSlippage(value)
                            }}
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
                      <div className="text-blue-400">⚡ Holdstation SDK</div>
                      <div className="text-green-400">✅ Real-time Quotes</div>
                      <div className="text-yellow-400">🔄 On-chain Settlement</div>
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
                  <select
                    value={tokenIn}
                    onChange={(e) => {
                      const newToken = e.target.value as TokenSymbol
                      addDebugLog(`🔄 Token IN alterado: ${tokenIn} → ${newToken}`)
                      setTokenIn(newToken)
                    }}
                    className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                  >
                    {Object.entries(AVAILABLE_TOKENS).map(([symbol, token]) => (
                      <option key={symbol} value={symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => {
                      addDebugLog(`💰 Amount IN alterado: ${amountIn} → ${e.target.value}`)
                      setAmountIn(e.target.value)
                    }}
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
                <div className="text-xs text-gray-400 mt-1 flex items-center">
                  <div className="w-4 h-4 rounded-full overflow-hidden mr-2">
                    <Image
                      src={AVAILABLE_TOKENS[tokenIn].icon || "/placeholder.svg"}
                      alt={AVAILABLE_TOKENS[tokenIn].name}
                      width={16}
                      height={16}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isLoadingBalances ? (
                    <span className="flex items-center">
                      <Loader2 size={10} className="animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    `Balance: ${tokenBalances[tokenIn] || "0"} ${tokenIn}`
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
                  <select
                    value={tokenOut}
                    onChange={(e) => {
                      const newToken = e.target.value as TokenSymbol
                      addDebugLog(`🔄 Token OUT alterado: ${tokenOut} → ${newToken}`)
                      setTokenOut(newToken)
                    }}
                    className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                  >
                    {Object.entries(AVAILABLE_TOKENS).map(([symbol, token]) => (
                      <option key={symbol} value={symbol}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
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
                <div className="text-xs text-gray-400 mt-1 flex items-center">
                  <div className="w-4 h-4 rounded-full overflow-hidden mr-2">
                    <Image
                      src={AVAILABLE_TOKENS[tokenOut].icon || "/placeholder.svg"}
                      alt={AVAILABLE_TOKENS[tokenOut].name}
                      width={16}
                      height={16}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isLoadingBalances ? (
                    <span className="flex items-center">
                      <Loader2 size={10} className="animate-spin mr-1" />
                      Loading...
                    </span>
                  ) : (
                    `Balance: ${tokenBalances[tokenOut] || "0"} ${tokenOut}`
                  )}
                </div>
              </div>

              {/* Informações da taxa */}
              {amountIn && amountOut && tokenIn !== tokenOut && !isQuoting && quoteData?.addons && (
                <div className="text-xs text-gray-400 space-y-1 px-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-blue-400">
                      <Info size={12} className="mr-1" />
                      Rate: 1 {tokenIn} ={" "}
                      {Number.parseFloat(amountOut) > 0 && Number.parseFloat(amountIn) > 0
                        ? (Number.parseFloat(amountOut) / Number.parseFloat(amountIn)).toFixed(6)
                        : "0"}{" "}
                      {tokenOut}
                    </span>
                    <span>Slippage: {slippage}%</span>
                  </div>
                  {quoteData.addons.minReceived && Number.parseFloat(quoteData.addons.minReceived) > 0 && (
                    <div className="flex justify-between">
                      <span>Min Received:</span>
                      <span>
                        {Number.parseFloat(quoteData.addons.minReceived).toFixed(6)} {tokenOut}
                      </span>
                    </div>
                  )}
                  {quoteData.addons.rateSwap && Number.parseFloat(quoteData.addons.rateSwap) > 0 && (
                    <div className="flex justify-between">
                      <span>SDK Rate:</span>
                      <span>{Number.parseFloat(quoteData.addons.rateSwap).toFixed(6)}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading || !amountIn || !amountOut || isLoadingBalances || isQuoting || tokenIn === tokenOut
                }
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Executando Swap...
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

export default SwapModal
