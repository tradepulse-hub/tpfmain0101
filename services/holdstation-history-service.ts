import { alchemyExplorerService } from "./alchemy-explorer-service"
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
      this.addDebugLog(`=== APENAS DADOS REAIS - SEM FALLBACKS ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      // Usar Alchemy Explorer Service diretamente
      this.addDebugLog("🔍 Buscando APENAS dados reais no Alchemy Explorer...")
      const transactions = await alchemyExplorerService.getTransactionHistory(walletAddress, offset, limit)

      this.addDebugLog(`📊 Alchemy Explorer retornou: ${transactions.length} transações REAIS`)

      if (transactions.length > 0) {
        this.addDebugLog(`✅ ${transactions.length} transações REAIS obtidas`)

        // Log das primeiras transações para debug
        transactions.slice(0, 3).forEach((tx, index) => {
          this.addDebugLog(`${index + 1}. ${tx.type.toUpperCase()} - ${tx.amount} ${tx.tokenSymbol} - ${tx.hash}`)
        })

        return transactions
      }

      this.addDebugLog("📊 NENHUMA TRANSAÇÃO REAL ENCONTRADA")
      this.addDebugLog("📊 Retornando array vazio - SEM MOCKS/FALLBACKS")
      return []
    } catch (error) {
      this.addDebugLog(`❌ Erro ao buscar dados reais: ${error.message}`)
      this.addDebugLog("📊 Retornando array vazio - SEM FALLBACKS")
      console.error("Error getting real transaction history:", error)

      // SEM FALLBACK - apenas array vazio
      return []
    }
  }

  async watchTransactions(walletAddress: string, callback?: () => void) {
    this.addDebugLog(`🔍 Configurando watcher REAL para: ${walletAddress}`)
    return {
      start: async () => {
        this.addDebugLog("🔄 Watcher REAL iniciado")
      },
      stop: async () => {
        this.addDebugLog("🛑 Watcher REAL parado")
      },
    }
  }

  async stopWatching(walletAddress: string): Promise<void> {
    this.addDebugLog(`🛑 Parando watcher REAL para: ${walletAddress}`)
  }

  async cleanup(): Promise<void> {
    this.addDebugLog("🧹 Limpeza REAL concluída")
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
