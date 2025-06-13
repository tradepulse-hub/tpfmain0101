import { holdstationService } from "./holdstation-service"
import type { Transaction } from "./types"

class HoldstationHistoryService {
  private watchers: Map<string, { start: () => Promise<void>; stop: () => Promise<void> }> = new Map()
  private debugLogs: string[] = []

  private addDebugLog(message: string) {
    console.log(message)
    this.debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    // Manter apenas os últimos 50 logs
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
      this.addDebugLog(`🔍 Configurando watcher para: ${walletAddress}`)

      const manager = holdstationService.getManager()
      if (!manager) {
        this.addDebugLog("❌ Manager do Holdstation não disponível")
        throw new Error("Manager not available")
      }

      this.addDebugLog("✅ Manager do Holdstation disponível")

      // Stop existing watcher if any
      if (this.watchers.has(walletAddress)) {
        this.addDebugLog("🛑 Parando watcher existente...")
        await this.watchers.get(walletAddress)?.stop()
        this.watchers.delete(walletAddress)
      }

      // Get current block for starting point
      this.addDebugLog("📊 Obtendo número do bloco atual...")
      const currentBlock = await manager.client.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 100000) // Last 100k blocks
      const toBlock = currentBlock

      this.addDebugLog(`📊 Monitorando blocos ${fromBlock} até ${toBlock} (atual: ${currentBlock})`)

      // Setup watcher
      this.addDebugLog("⚙️ Configurando watcher...")
      const watcher = await manager.watch(walletAddress, fromBlock, toBlock)

      // Store watcher
      this.watchers.set(walletAddress, watcher)
      this.addDebugLog("✅ Watcher configurado e armazenado")

      return watcher
    } catch (error) {
      this.addDebugLog(`❌ Erro ao configurar watcher: ${error.message}`)
      console.error("Error setting up transaction watcher:", error)
      throw error
    }
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 20): Promise<Transaction[]> {
    try {
      this.addDebugLog(`=== OBTENDO HISTÓRICO DE TRANSAÇÕES ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      const manager = holdstationService.getManager()
      if (!manager) {
        this.addDebugLog("❌ Manager do Holdstation não disponível")
        throw new Error("Manager not available")
      }

      this.addDebugLog("✅ Manager do Holdstation disponível")

      // Verificar se o transactionStorage existe
      if (!manager.transactionStorage) {
        this.addDebugLog("❌ transactionStorage não disponível no manager")
        throw new Error("Transaction storage not available")
      }

      this.addDebugLog("✅ transactionStorage disponível")

      // Get transactions from storage
      this.addDebugLog(`📡 Chamando transactionStorage.find(${offset}, ${limit})...`)
      const transactions = await manager.transactionStorage.find(offset, limit)

      this.addDebugLog(`📊 Resposta bruta: ${transactions.length} transações`)
      this.addDebugLog(`Primeira transação (raw): ${JSON.stringify(transactions[0], null, 2)}`)

      // Convert to our Transaction format
      this.addDebugLog("🔄 Convertendo para formato Transaction...")
      const formattedTransactions: Transaction[] = transactions.map((tx, index) => {
        this.addDebugLog(`Processando transação ${index + 1}/${transactions.length}: ${tx.hash}`)

        const formatted = {
          id: tx.hash || `tx_${index}`,
          hash: tx.hash || "",
          type: this.determineTransactionType(tx, walletAddress),
          amount: this.extractAmount(tx, walletAddress),
          tokenSymbol: this.extractTokenSymbol(tx),
          tokenAddress: this.extractTokenAddress(tx),
          from: this.extractFrom(tx, walletAddress),
          to: this.extractTo(tx, walletAddress),
          timestamp: tx.date || new Date(tx.block * 1000),
          status: tx.success === 2 ? "completed" : tx.success === 1 ? "failed" : "pending",
          blockNumber: tx.block,
        }

        this.addDebugLog(`Transação formatada: ${formatted.type} ${formatted.amount} ${formatted.tokenSymbol}`)
        return formatted
      })

      this.addDebugLog(`✅ ${formattedTransactions.length} transações formatadas com sucesso`)

      // Log resumo das transações
      const summary = formattedTransactions.reduce(
        (acc, tx) => {
          acc[tx.type] = (acc[tx.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      this.addDebugLog(`📈 Resumo: ${JSON.stringify(summary)}`)

      return formattedTransactions
    } catch (error) {
      this.addDebugLog(`❌ Erro ao obter transações: ${error.message}`)
      this.addDebugLog(`Stack trace: ${error.stack}`)
      console.error("Error getting transactions:", error)

      // Retornar array vazio em caso de erro
      return []
    }
  }

  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    this.addDebugLog(`🔍 Determinando tipo de transação para ${tx.hash}`)

    if (tx.transfers && tx.transfers.length > 1) {
      this.addDebugLog(`📊 ${tx.transfers.length} transfers detectados - classificando como SWAP`)
      return "swap"
    }

    if (tx.transfers && tx.transfers.length === 1) {
      const transfer = tx.transfers[0]
      const isReceiving = transfer.to.toLowerCase().includes(walletAddress.toLowerCase())
      const type = isReceiving ? "receive" : "send"
      this.addDebugLog(`📊 1 transfer detectado - ${transfer.to} -> ${type.toUpperCase()}`)
      return type
    }

    this.addDebugLog(`📊 Nenhum transfer específico - classificando como SEND`)
    return "send"
  }

  private extractAmount(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const transfer = tx.transfers[0]
      const amount = (Number.parseFloat(transfer.amount) / Math.pow(10, 18)).toFixed(6)
      this.addDebugLog(`💰 Amount extraído: ${amount} (raw: ${transfer.amount})`)
      return amount
    }
    this.addDebugLog(`💰 Nenhum amount encontrado - retornando 0`)
    return "0"
  }

  private extractTokenSymbol(tx: any): string {
    // Map known token addresses to symbols
    const tokenMap: Record<string, string> = {
      "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45": "TPF",
      "0x2cFc85d8E48F8EAB294be644d9E25C3030863003": "WLD",
      "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113": "DNA",
      "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B": "WDD",
    }

    if (tx.transfers && tx.transfers.length > 0) {
      const tokenAddress = tx.transfers[0].tokenAddress.toLowerCase()
      const symbol = tokenMap[tokenAddress] || "UNKNOWN"
      this.addDebugLog(`🏷️ Token symbol: ${symbol} (address: ${tokenAddress})`)
      return symbol
    }
    this.addDebugLog(`🏷️ Nenhum token encontrado - retornando ETH`)
    return "ETH"
  }

  private extractTokenAddress(tx: any): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const address = tx.transfers[0].tokenAddress
      this.addDebugLog(`📍 Token address: ${address}`)
      return address
    }
    this.addDebugLog(`📍 Nenhum token address - retornando zero address`)
    return "0x0000000000000000000000000000000000000000"
  }

  private extractFrom(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const from = tx.transfers[0].from
      this.addDebugLog(`📤 From: ${from}`)
      return from
    }
    const from = tx.from || ""
    this.addDebugLog(`📤 From (fallback): ${from}`)
    return from
  }

  private extractTo(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const to = tx.transfers[0].to
      this.addDebugLog(`📥 To: ${to}`)
      return to
    }
    const to = tx.to || ""
    this.addDebugLog(`📥 To (fallback): ${to}`)
    return to
  }

  async stopWatching(walletAddress: string): Promise<void> {
    try {
      const watcher = this.watchers.get(walletAddress)
      if (watcher) {
        this.addDebugLog(`🛑 Parando watcher para: ${walletAddress}`)
        await watcher.stop()
        this.watchers.delete(walletAddress)
        this.addDebugLog(`✅ Watcher parado com sucesso`)
      } else {
        this.addDebugLog(`⚠️ Nenhum watcher encontrado para: ${walletAddress}`)
      }
    } catch (error) {
      this.addDebugLog(`❌ Erro ao parar watcher: ${error.message}`)
      console.error("Error stopping transaction watcher:", error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.addDebugLog(`🧹 Iniciando limpeza de ${this.watchers.size} watchers...`)
      for (const [address, watcher] of this.watchers) {
        this.addDebugLog(`🧹 Limpando watcher para: ${address}`)
        await watcher.stop()
      }
      this.watchers.clear()
      this.addDebugLog("✅ Limpeza concluída - todos os watchers removidos")
    } catch (error) {
      this.addDebugLog(`❌ Erro durante limpeza: ${error.message}`)
      console.error("Error during cleanup:", error)
    }
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
