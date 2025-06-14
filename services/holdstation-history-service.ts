import { holdstationService } from "./holdstation-service"
import type { Transaction } from "./types"

class HoldstationHistoryService {
  private debugLogs: string[] = []

  private addDebugLog(message: string) {
    console.log(message)
    this.debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    if (this.debugLogs.length > 100) {
      this.debugLogs = this.debugLogs.slice(-100)
    }
  }

  getDebugLogs(): string[] {
    return [...this.debugLogs]
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    try {
      this.addDebugLog(`=== HISTÓRICO APENAS - CONFORME DOCUMENTAÇÃO ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      // Usar APENAS HoldStation para histórico - SEM FALLBACK
      this.addDebugLog("🔍 Usando HoldStation SDK para histórico...")
      const rawTransactions = await holdstationService.getTransactionHistory(walletAddress, offset, limit)

      this.addDebugLog(`📊 HoldStation retornou: ${rawTransactions?.length || 0} transações`)

      if (rawTransactions && rawTransactions.length > 0) {
        const formattedTransactions = this.formatHoldstationTransactions(rawTransactions, walletAddress)
        this.addDebugLog(`✅ ${formattedTransactions.length} transações formatadas`)
        return formattedTransactions
      }

      this.addDebugLog("⚠️ Nenhuma transação encontrada via HoldStation")
      return [] // Retornar array vazio, SEM FALLBACK
    } catch (error) {
      this.addDebugLog(`❌ Erro ao buscar histórico: ${error.message}`)
      console.error("Error getting transaction history:", error)
      throw error // SEM FALLBACK - propagar o erro
    }
  }

  private formatHoldstationTransactions(transactions: any[], walletAddress: string): Transaction[] {
    return transactions.map((tx, index) => {
      this.addDebugLog(`Formatando transação ${index + 1}: ${tx.hash || "sem hash"}`)

      return {
        id: tx.hash || `tx_${index}`,
        hash: tx.hash || "",
        type: this.determineTransactionType(tx, walletAddress),
        amount: this.extractAmount(tx),
        tokenSymbol: this.extractTokenSymbol(tx),
        tokenAddress: this.extractTokenAddress(tx),
        from: tx.from || "",
        to: tx.to || "",
        timestamp: new Date(tx.timestamp || Date.now()),
        status: "completed",
        blockNumber: tx.blockNumber || 0,
      }
    })
  }

  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    if (tx.to?.toLowerCase() === walletAddress.toLowerCase()) {
      return "receive"
    }
    return "send"
  }

  private extractAmount(tx: any): string {
    return tx.amount || tx.value || "0"
  }

  private extractTokenSymbol(tx: any): string {
    return tx.tokenSymbol || tx.symbol || "TPF"
  }

  private extractTokenAddress(tx: any): string {
    return tx.tokenAddress || tx.contractAddress || ""
  }

  async watchTransactions(walletAddress: string, callback?: () => void) {
    this.addDebugLog(`🔍 Configurando watcher para: ${walletAddress}`)

    // Retornar um watcher simples
    return {
      start: async () => {
        this.addDebugLog("🔄 Watcher iniciado")
      },
      stop: async () => {
        this.addDebugLog("🛑 Watcher parado")
      },
    }
  }

  async stopWatching(walletAddress: string): Promise<void> {
    this.addDebugLog(`🛑 Parando watcher para: ${walletAddress}`)
  }

  async cleanup(): Promise<void> {
    this.addDebugLog("🧹 Limpeza concluída")
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
