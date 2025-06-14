import * as sdk from "@holdstation/worldchain-sdk"
import { ethers } from "ethers"
import type { Transaction } from "./types"

class HoldstationHistoryService {
  private debugLogs: string[] = []
  private provider: ethers.JsonRpcProvider | null = null
  private managerHistory: any = null
  private walletHistory: any = null
  private watchers: Map<string, { start: () => Promise<void>; stop: () => Promise<void> }> = new Map()

  constructor() {
    this.initializeSDK()
  }

  private async initializeSDK() {
    try {
      this.addDebugLog("🔧 Inicializando Holdstation SDK conforme documentação...")

      // Setup exato da documentação
      this.provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public")
      this.addDebugLog("✅ Provider criado")

      // Criar Manager com chainId 480 (WorldChain)
      this.managerHistory = new sdk.Manager(this.provider, 480)
      this.addDebugLog("✅ managerHistory criado (chainId: 480)")

      // Criar walletHistory separadamente (conforme documentação)
      this.walletHistory = new sdk.History(this.provider, 480)
      this.addDebugLog("✅ walletHistory criado separadamente")

      // Verificar se ambos foram criados
      if (this.managerHistory && this.walletHistory) {
        this.addDebugLog("✅ SDK Holdstation inicializado conforme documentação!")

        // Log métodos disponíveis
        this.addDebugLog("📋 Verificando métodos do managerHistory...")
        if (typeof this.managerHistory.watch === "function") {
          this.addDebugLog("✅ managerHistory.watch() disponível")
        }

        this.addDebugLog("📋 Verificando métodos do walletHistory...")
        if (typeof this.walletHistory.find === "function") {
          this.addDebugLog("✅ walletHistory.find() disponível")
        }
      } else {
        this.addDebugLog("❌ Falha ao criar instâncias do SDK")
      }
    } catch (error) {
      this.addDebugLog(`❌ Erro ao inicializar SDK: ${error.message}`)
      this.addDebugLog(`Stack: ${error.stack}`)
      console.error("❌ Failed to initialize Holdstation SDK:", error)
    }
  }

  private addDebugLog(message: string) {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(logMessage)
    this.debugLogs.push(logMessage)
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(-50)
    }
  }

  getDebugLogs(): string[] {
    return [...this.debugLogs]
  }

  async watchTransactions(
    walletAddress: string,
    callback?: (transactions: Transaction[]) => void,
  ): Promise<{ start: () => Promise<void>; stop: () => Promise<void> }> {
    try {
      this.addDebugLog(`🔍 Configurando watcher conforme documentação para: ${walletAddress}`)

      if (!this.managerHistory) {
        this.addDebugLog("❌ managerHistory não disponível - reinicializando...")
        await this.initializeSDK()
        if (!this.managerHistory) {
          throw new Error("managerHistory não pode ser inicializado")
        }
      }

      // Stop existing watcher if any
      if (this.watchers.has(walletAddress)) {
        this.addDebugLog("🛑 Parando watcher existente...")
        await this.watchers.get(walletAddress)?.stop()
        this.watchers.delete(walletAddress)
      }

      this.addDebugLog("⚙️ Chamando managerHistory.watch(address, callback)...")

      // Implementação exata da documentação
      const { start, stop } = await this.managerHistory.watch(walletAddress, () => {
        this.addDebugLog("📡 Nova atividade detectada! Triggering refetch...")
        if (callback) {
          this.getTransactionHistory(walletAddress, 0, 10).then(callback)
        }
      })

      this.addDebugLog("✅ managerHistory.watch() retornou { start, stop }")

      const watcherConfig = { start, stop }

      // Store watcher
      this.watchers.set(walletAddress, watcherConfig)

      return watcherConfig
    } catch (error) {
      this.addDebugLog(`❌ Erro ao configurar watcher: ${error.message}`)
      console.error("Error setting up transaction watcher:", error)
      throw error
    }
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    this.addDebugLog("=== FETCH STORED TRANSACTION HISTORY ===")
    this.addDebugLog(`Endereço: ${walletAddress}`)
    this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

    if (!this.walletHistory) {
      this.addDebugLog("❌ walletHistory não disponível - reinicializando...")
      await this.initializeSDK()
      if (!this.walletHistory) {
        this.addDebugLog("❌ Falha crítica: walletHistory não pode ser inicializado")
        return []
      }
    }

    try {
      this.addDebugLog("📡 Chamando walletHistory.find(offset, limit)...")

      // Implementação exata da documentação
      const fetchedTransactions = await this.walletHistory.find(offset, limit)

      this.addDebugLog(`✅ walletHistory.find() retornou ${fetchedTransactions.length} transações`)
      this.addDebugLog(`📊 Dados brutos: ${JSON.stringify(fetchedTransactions.slice(0, 2), null, 2)}`)

      // Processar e formatar transações
      const formattedTransactions = this.formatHoldstationTransactions(fetchedTransactions, walletAddress)

      this.addDebugLog(`✅ ${formattedTransactions.length} transações formatadas`)

      // Log resumo
      const summary = formattedTransactions.reduce(
        (acc, tx) => {
          acc[tx.tokenSymbol] = (acc[tx.tokenSymbol] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      this.addDebugLog(`📊 Resumo por token: ${JSON.stringify(summary)}`)

      return formattedTransactions
    } catch (error) {
      this.addDebugLog(`❌ ERRO em walletHistory.find(): ${error.message}`)
      this.addDebugLog(`Stack: ${error.stack}`)
      console.error("❌ Error fetching transaction history:", error)
      return []
    }
  }

  private formatHoldstationTransactions(transactions: any[], walletAddress: string): Transaction[] {
    this.addDebugLog(`🔄 Formatando ${transactions.length} transações...`)

    return transactions
      .map((tx, index) => {
        try {
          this.addDebugLog(`Processando transação ${index + 1}: ${JSON.stringify(tx).substring(0, 100)}...`)

          // Estrutura baseada na documentação Holdstation
          let type: "send" | "receive" | "swap" = "send"
          let amount = "0"
          let tokenSymbol = "UNKNOWN"
          let tokenAddress = ""
          let from = ""
          let to = ""

          // Processar transfers
          if (tx.transfers && Array.isArray(tx.transfers) && tx.transfers.length > 0) {
            const transfer = tx.transfers[0]

            // Determinar tipo baseado no endereço
            if (transfer.to && transfer.to.toLowerCase() === walletAddress.toLowerCase()) {
              type = "receive"
            } else if (transfer.from && transfer.from.toLowerCase() === walletAddress.toLowerCase()) {
              type = "send"
            }

            // Múltiplas transferências = swap
            if (tx.transfers.length > 1) {
              type = "swap"
            }

            // Extrair dados
            amount = transfer.amount
              ? (Number.parseFloat(transfer.amount) / Math.pow(10, transfer.decimals || 18)).toFixed(6)
              : "0"
            tokenSymbol = transfer.tokenSymbol || transfer.symbol || "UNKNOWN"
            tokenAddress = transfer.tokenAddress || transfer.address || ""
            from = transfer.from || ""
            to = transfer.to || ""
          } else {
            // Transação nativa (ETH/WLD)
            if (tx.to && tx.to.toLowerCase() === walletAddress.toLowerCase()) {
              type = "receive"
            }
            amount = tx.value ? ethers.formatEther(tx.value) : "0"
            tokenSymbol = "WLD"
            from = tx.from || ""
            to = tx.to || ""
          }

          const formatted: Transaction = {
            id: tx.hash || `tx_${index}`,
            hash: tx.hash || "",
            type,
            amount,
            tokenSymbol,
            tokenAddress,
            from,
            to,
            timestamp: tx.timestamp ? new Date(tx.timestamp * 1000) : tx.date ? new Date(tx.date) : new Date(),
            status: tx.status === 1 || tx.success === 2 ? "completed" : "pending",
            blockNumber: tx.blockNumber || tx.block || 0,
          }

          this.addDebugLog(`✅ Formatado: ${type} ${amount} ${tokenSymbol}`)
          return formatted
        } catch (error) {
          this.addDebugLog(`❌ Erro ao formatar transação ${index}: ${error.message}`)
          return null
        }
      })
      .filter(Boolean) as Transaction[]
  }

  async stopWatching(walletAddress: string): Promise<void> {
    try {
      const watcher = this.watchers.get(walletAddress)
      if (watcher) {
        this.addDebugLog(`🛑 Chamando stop() para: ${walletAddress}`)
        await watcher.stop()
        this.watchers.delete(walletAddress)
        this.addDebugLog(`✅ Watcher parado com sucesso`)
      }
    } catch (error) {
      this.addDebugLog(`❌ Erro ao parar watcher: ${error.message}`)
      console.error("Error stopping transaction watcher:", error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.addDebugLog(`🧹 Limpando ${this.watchers.size} watchers...`)
      for (const [address, watcher] of this.watchers) {
        await watcher.stop()
      }
      this.watchers.clear()
      this.addDebugLog("✅ Limpeza concluída")
    } catch (error) {
      this.addDebugLog(`❌ Erro durante limpeza: ${error.message}`)
      console.error("Error during cleanup:", error)
    }
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
