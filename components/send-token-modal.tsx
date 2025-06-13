"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Loader2, AlertTriangle, ChevronDown, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"
import { walletService } from "@/services/wallet-service"
import { AbiService } from "@/services/abi-service"
import type { TokenBalance } from "@/services/types"
import Image from "next/image"
import { ethers } from "ethers"

interface SendTokenModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function SendTokenModal({ isOpen, onClose, walletAddress }: SendTokenModalProps) {
  const { t } = useTranslation()
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTokens, setIsLoadingTokens] = useState(false)
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const [showWarning, setShowWarning] = useState(true)
  const [transactionStatus, setTransactionStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">(
    "idle",
  )
  const [txHash, setTxHash] = useState<string>("")
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebugLogs, setShowDebugLogs] = useState(false)

  // Função helper para adicionar logs
  const addDebugLog = (message: string) => {
    console.log(message)
    setDebugLogs((prev) => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Função para inspecionar MiniKit
  const inspectMiniKit = () => {
    addDebugLog("=== INSPEÇÃO DO MINIKIT ===")

    if (typeof window !== "undefined" && window.MiniKit) {
      addDebugLog("✅ MiniKit está disponível")

      // Verificar se tem commandsAsync
      if (window.MiniKit.commandsAsync) {
        addDebugLog("✅ MiniKit.commandsAsync está disponível")

        // Verificar sendTransaction
        if (typeof window.MiniKit.commandsAsync.sendTransaction === "function") {
          addDebugLog("✅ MiniKit.commandsAsync.sendTransaction está disponível")
        } else {
          addDebugLog("❌ MiniKit.commandsAsync.sendTransaction não encontrado")
        }
      } else {
        addDebugLog("❌ MiniKit.commandsAsync não está disponível")
      }

      // Listar todas as propriedades disponíveis
      const miniKitKeys = Object.keys(window.MiniKit)
      addDebugLog(`Propriedades do MiniKit: ${miniKitKeys.join(", ")}`)

      // Verificar se é conectado
      if (typeof window.MiniKit.isConnected === "function") {
        addDebugLog(`Conectado: ${window.MiniKit.isConnected()}`)
      }
    } else {
      addDebugLog("❌ MiniKit não está disponível")
    }
  }

  // Carregar tokens disponíveis quando o modal abrir
  useEffect(() => {
    if (isOpen && walletAddress) {
      loadAvailableTokens()
      inspectMiniKit() // Inspecionar MiniKit quando abrir o modal
      // Reset states when modal opens
      setTransactionStatus("idle")
      setTxHash("")
      setRecipient("")
      setAmount("")
    }
  }, [isOpen, walletAddress])

  const loadAvailableTokens = async () => {
    setIsLoadingTokens(true)
    try {
      const tokens = await walletService.getTokenBalances(walletAddress)
      // Filtrar tokens com saldo > 0
      const tokensWithBalance = tokens.filter((token) => Number.parseFloat(token.balance) > 0)
      setAvailableTokens(tokensWithBalance)

      // Selecionar o primeiro token com saldo como padrão
      if (tokensWithBalance.length > 0 && !selectedToken) {
        setSelectedToken(tokensWithBalance[0])
      }
    } catch (error) {
      console.error("Error loading tokens:", error)
      toast.error("Erro ao carregar tokens disponíveis")
    } finally {
      setIsLoadingTokens(false)
    }
  }

  const handleTokenSelect = (token: TokenBalance) => {
    setSelectedToken(token)
    setShowTokenSelector(false)
    setAmount("") // Limpar amount quando trocar de token
  }

  const handleMaxAmount = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpar logs anteriores
    setDebugLogs([])

    addDebugLog("=== INICIANDO ENVIO DE TOKEN (API NOVA) ===")
    addDebugLog(`Destinatário: ${recipient}`)
    addDebugLog(`Quantidade: ${amount}`)
    addDebugLog(`Token: ${selectedToken?.symbol}`)
    addDebugLog(`Endereço do token: ${selectedToken?.address}`)

    if (!recipient || !amount || !selectedToken) {
      console.error("❌ Missing required fields:", {
        recipient: !!recipient,
        amount: !!amount,
        selectedToken: !!selectedToken,
      })
      toast.error(t.sendToken?.fillAllFields || "Fill all fields")
      return
    }

    if (!recipient.startsWith("0x") || recipient.length !== 42) {
      console.error("❌ Invalid recipient address:", recipient)
      toast.error(t.sendToken?.invalidAddress || "Invalid address")
      return
    }

    const amountNum = Number.parseFloat(amount)
    const availableBalance = Number.parseFloat(selectedToken.balance)

    if (isNaN(amountNum) || amountNum <= 0) {
      console.error("❌ Invalid amount:", { amount, amountNum })
      toast.error(t.sendToken?.invalidValue || "Invalid value")
      return
    }

    if (amountNum > availableBalance) {
      console.error("❌ Insufficient balance:", { requested: amountNum, available: availableBalance })
      toast.error(`Saldo insuficiente. Você tem ${availableBalance} ${selectedToken.symbol}`)
      return
    }

    // Re-inspecionar MiniKit antes de usar
    inspectMiniKit()

    if (!window.MiniKit || !window.MiniKit.commandsAsync) {
      console.error("❌ MiniKit.commandsAsync not available")
      toast.error("MiniKit não está disponível ou é uma versão antiga")
      return
    }

    setIsLoading(true)
    setTransactionStatus("pending")

    try {
      addDebugLog("🚀 Usando a nova API do MiniKit...")
      addDebugLog(`Token: ${selectedToken.symbol} (${selectedToken.address})`)
      addDebugLog(`Quantidade: ${amount} (${selectedToken.decimals} decimais)`)

      // Converter amount para wei
      addDebugLog("Convertendo quantidade para wei...")
      const amountInWei = ethers.parseUnits(amount, selectedToken.decimals || 18)
      addDebugLog(`Quantidade em wei: ${amountInWei.toString()}`)

      // Preparar transação usando a nova API
      addDebugLog("Preparando transação com a nova API...")

      const transactionPayload = {
        transaction: [
          {
            address: selectedToken.address, // Endereço do contrato do token
            abi: AbiService.getERC20ABI(), // ABI completo do ERC20
            functionName: "transfer", // Nome da função
            args: [recipient, amountInWei.toString()], // Argumentos: [to, amount]
          },
        ],
      }

      addDebugLog(`Payload da transação: ${JSON.stringify(transactionPayload, null, 2)}`)
      addDebugLog("Chamando MiniKit.commandsAsync.sendTransaction...")

      // Enviar transação usando a nova API
      const result = await window.MiniKit.commandsAsync.sendTransaction(transactionPayload)

      addDebugLog(`Resultado da transação: ${JSON.stringify(result)}`)

      if (result.finalPayload?.status === "error") {
        addDebugLog(`❌ Erro na transação: ${result.finalPayload.error}`)
        throw new Error(`Transaction failed: ${result.finalPayload.error}`)
      }

      const transactionId = result.finalPayload?.transaction_id
      if (!transactionId) {
        addDebugLog("❌ Nenhum transaction_id recebido")
        throw new Error("No transaction ID received")
      }

      addDebugLog(`✅ Transação enviada! ID: ${transactionId}`)
      setTransactionStatus("success") // Marcar como sucesso imediatamente

      // Definir o hash da transação (usar o transaction_id como fallback)
      setTxHash(transactionId)

      toast.success(t.sendToken?.tokensSentSuccess || "Tokens sent successfully!", {
        description: `${amount} ${selectedToken.symbol} ${t.sendToken?.sentTo || "sent to"} ${recipient.substring(0, 10)}...`,
        action: {
          label: t.sendToken?.viewTx || "View TX",
          onClick: () => window.open(`https://worldscan.org/tx/${transactionId}`, "_blank"),
        },
      })

      console.log("🎉 Transaction completed successfully!")
      addDebugLog("🎉 Transação concluída com sucesso!")

      // Tentar verificar a transação em background (opcional)
      try {
        addDebugLog("🔍 Tentando verificar transação em background...")
        const verificationPayload = { transaction_id: transactionId }

        const verificationResult = await fetch("/api/transaction-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(verificationPayload),
        })

        if (verificationResult.ok) {
          const txData = await verificationResult.json()
          addDebugLog(`✅ Verificação bem-sucedida: ${JSON.stringify(txData)}`)

          // Atualizar hash se disponível
          if (txData.hash && txData.hash !== transactionId) {
            setTxHash(txData.hash)
            addDebugLog(`Hash atualizado: ${txData.hash}`)
          }
        } else {
          addDebugLog(`⚠️ Verificação falhou (não crítico): ${verificationResult.status}`)
        }
      } catch (verificationError) {
        addDebugLog(`⚠️ Erro na verificação (não crítico): ${verificationError.message}`)
        // Não falhar a transação por causa da verificação
      }

      // Auto-close modal after success
      setTimeout(() => {
        console.log("Auto-closing modal...")
        onClose()
      }, 3000)
    } catch (error: any) {
      addDebugLog("=== ERRO NA TRANSAÇÃO ===")
      addDebugLog(`Tipo do erro: ${typeof error}`)
      addDebugLog(`Mensagem: ${error.message}`)
      addDebugLog(`Stack: ${error.stack}`)

      if (error.code) {
        addDebugLog(`Código: ${error.code}`)
      }

      if (error.reason) {
        addDebugLog(`Razão: ${error.reason}`)
      }

      setTransactionStatus("error")
      setShowDebugLogs(true) // Mostrar logs quando há erro

      let errorMessage = t.sendToken?.errorSendingTokens || "Error sending tokens"

      if (error.message?.includes("insufficient")) {
        errorMessage = "Saldo insuficiente"
      } else if (error.message?.includes("rejected")) {
        errorMessage = "Transação rejeitada pelo usuário"
      } else if (error.message?.includes("network")) {
        errorMessage = "Erro de rede. Tente novamente."
      } else if (error.message?.includes("gas")) {
        errorMessage = "Erro de gas. Verifique se tem ETH suficiente."
      }

      console.error("Final error message:", errorMessage)
      toast.error(errorMessage)
    } finally {
      addDebugLog("=== FIM DO PROCESSO ===")
      setIsLoading(false)
    }
  }

  const getStatusMessage = () => {
    switch (transactionStatus) {
      case "pending":
        return "Enviando transação..."
      case "confirming":
        return "Confirmando na blockchain..."
      case "success":
        return "Transação enviada com sucesso!"
      case "error":
        return "Erro ao enviar transação"
      default:
        return ""
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
            className="bg-gray-900 rounded-lg border border-gray-800 p-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Send size={20} className="mr-2 text-blue-400" />
                {t.sendToken?.title || "Send Tokens"}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Transaction Status */}
            {transactionStatus !== "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className={`mb-4 p-3 rounded-lg border ${
                  transactionStatus === "success"
                    ? "bg-green-900/20 border-green-800/30"
                    : transactionStatus === "error"
                      ? "bg-red-900/20 border-red-800/30"
                      : "bg-blue-900/20 border-blue-800/30"
                }`}
              >
                <div className="flex items-center">
                  {transactionStatus === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  ) : transactionStatus === "error" ? (
                    <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-400 mr-3 animate-spin" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        transactionStatus === "success"
                          ? "text-green-300"
                          : transactionStatus === "error"
                            ? "text-red-300"
                            : "text-blue-300"
                      }`}
                    >
                      {getStatusMessage()}
                    </p>
                    {txHash && (
                      <button
                        onClick={() => window.open(`https://worldscan.org/tx/${txHash}`, "_blank")}
                        className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                      >
                        Ver transação →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Debug Logs */}
            {debugLogs.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowDebugLogs(!showDebugLogs)}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-300 mb-2"
                >
                  {showDebugLogs ? "🔽" : "▶️"} Debug Logs ({debugLogs.length})
                </button>

                {showDebugLogs && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-1">
                      {debugLogs.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(debugLogs.join("\n"))
                        toast.success("Logs copiados!")
                      }}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      📋 Copiar logs
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Warning Message */}
            {showWarning && transactionStatus === "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg"
              >
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-yellow-200 text-sm mb-2">
                      {t.sendToken?.warning || "Please verify the recipient address before sending tokens."}
                    </p>
                    <p className="text-yellow-200/80 text-xs">
                      {t.sendToken?.warningWorldchain ||
                        "Do not send to wallets that don't support Worldchain, otherwise you may lose your assets. Do not send to exchanges."}
                    </p>
                    <button
                      onClick={() => setShowWarning(false)}
                      className="text-yellow-400 text-xs mt-2 hover:text-yellow-300"
                    >
                      {t.sendToken?.hideWarning || "Hide warning"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Token Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t.sendToken?.selectToken || "Select Token"}</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTokenSelector(!showTokenSelector)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    disabled={isLoadingTokens || isLoading}
                  >
                    {isLoadingTokens ? (
                      <span className="flex items-center">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Loading tokens...
                      </span>
                    ) : selectedToken ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                          <Image
                            src={selectedToken.icon || "/placeholder.svg"}
                            alt={selectedToken.symbol}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>
                          {selectedToken.symbol} - {selectedToken.name}
                        </span>
                        <span className="ml-auto text-gray-400 text-sm">
                          {Number.parseFloat(selectedToken.balance).toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select a token</span>
                    )}
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {/* Token Dropdown */}
                  {showTokenSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
                    >
                      {availableTokens.length > 0 ? (
                        availableTokens.map((token) => (
                          <button
                            key={token.address}
                            type="button"
                            onClick={() => handleTokenSelect(token)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <Image
                                  src={token.icon || "/placeholder.svg"}
                                  alt={token.symbol}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-white text-sm">{token.symbol}</div>
                                <div className="text-gray-400 text-xs">{token.name}</div>
                              </div>
                            </div>
                            <div className="text-gray-300 text-sm">{Number.parseFloat(token.balance).toFixed(4)}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">No tokens with balance available</div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  {t.sendToken?.recipientAddress || "Recipient Address"}
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">{t.sendToken?.quantity || "Amount"}</label>
                  {selectedToken && (
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="text-xs text-blue-400 hover:text-blue-300"
                      disabled={isLoading}
                    >
                      Max: {Number.parseFloat(selectedToken.balance).toFixed(4)} {selectedToken.symbol}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.000001"
                    min="0"
                    max={selectedToken?.balance}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    disabled={isLoading}
                  />
                  {selectedToken && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                      {selectedToken.symbol}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !selectedToken || isLoadingTokens || transactionStatus === "success"}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {transactionStatus === "pending" ? "Enviando..." : "Confirmando..."}
                  </div>
                ) : transactionStatus === "success" ? (
                  "✅ Enviado com Sucesso"
                ) : (
                  `${t.sendToken?.sendTokens || "Send"} ${selectedToken?.symbol || "Tokens"}`
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

declare global {
  interface Window {
    MiniKit?: {
      commandsAsync?: {
        sendTransaction: (params: {
          transaction: Array<{
            address: string
            abi: any[]
            functionName: string
            args: any[]
            value?: string
          }>
          permit2?: Array<{
            permitted: {
              token: string
              amount: string
            }
            spender: string
            nonce: string
            deadline: string
          }>
          formatPayload?: boolean
        }) => Promise<{
          commandPayload: any
          finalPayload: {
            status: "success" | "error"
            transaction_id?: string
            error?: string
          }
        }>
      }
      isConnected?: () => boolean
    }
  }
}
