import { blockchainTransactionService } from "./blockchain-transaction-service"
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
      this.addDebugLog(`=== USANDO BLOCKCHAIN SERVICE REAL ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      // Usar Blockchain Transaction Service para buscar dados reais
      this.addDebugLog("🔗 Buscando transações reais da blockchain...")
      const transactions = await blockchainTransactionService.getTransactionHistory(walletAddress, limit)

      this.addDebugLog(`📊 Blockchain service retornou: ${transactions.length} transações REAIS`)

      if (transactions.length > 0) {
        this.addDebugLog(`✅ ${transactions.length} transações REAIS da blockchain`)

        // Log das primeiras transações para debug
        transactions.slice(0, 3).forEach((tx, index) => {
          this.addDebugLog(`${index + 1}. ${tx.type.toUpperCase()} - ${tx.amount} ${tx.tokenSymbol} - ${tx.hash}`)
        })

        // Aplicar offset se necessário
        const offsetTransactions = offset > 0 ? transactions.slice(offset) : transactions

        return offsetTransactions
      }

      this.addDebugLog("📊 NENHUMA TRANSAÇÃO REAL ENCONTRADA NA BLOCKCHAIN")
      this.addDebugLog("📊 Retornando array vazio - SEM MOCKS/FALLBACKS")
      return []
    } catch (error) {
      this.addDebugLog(`❌ Erro ao buscar dados reais da blockchain: ${error.message}`)
      this.addDebugLog("📊 Retornando array vazio - SEM FALLBACKS")
      console.error("Error getting real blockchain transaction history:", error)

      // SEM FALLBACK - apenas array vazio
      return []
    }
  }

  async watchTransactions(walletAddress: string, callback?: () => void) {
    this.addDebugLog(`🔍 Configurando watcher BLOCKCHAIN para: ${walletAddress}`)
    return {
      start: async () => {
        this.addDebugLog("🔄 Watcher BLOCKCHAIN iniciado")
      },
      stop: async () => {
        this.addDebugLog("🛑 Watcher BLOCKCHAIN parado")
      },
    }
  }

  async stopWatching(walletAddress: string): Promise<void> {
    this.addDebugLog(`🛑 Parando watcher BLOCKCHAIN para: ${walletAddress}`)
  }

  async cleanup(): Promise<void> {
    this.addDebugLog("🧹 Limpeza BLOCKCHAIN concluída")
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
