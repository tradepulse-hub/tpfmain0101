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
      this.addDebugLog(`=== USANDO ALCHEMY EXPLORER DIRETAMENTE ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      // Usar Alchemy Explorer Service diretamente
      this.addDebugLog("🔍 Buscando no Alchemy Explorer...")
      const transactions = await alchemyExplorerService.getTransactionHistory(walletAddress, offset, limit)

      this.addDebugLog(`📊 Alchemy Explorer retornou: ${transactions.length} transações`)

      if (transactions.length > 0) {
        this.addDebugLog(`✅ ${transactions.length} transações obtidas com sucesso`)

        // Log das primeiras transações para debug
        transactions.slice(0, 3).forEach((tx, index) => {
          this.addDebugLog(`${index + 1}. ${tx.type.toUpperCase()} - ${tx.amount} ${tx.tokenSymbol} - ${tx.hash}`)
        })

        return transactions
      }

      this.addDebugLog("⚠️ Nenhuma transação encontrada no Alchemy Explorer")
      return []
    } catch (error) {
      this.addDebugLog(`❌ Erro ao buscar no Alchemy Explorer: ${error.message}`)
      console.error("Error getting transaction history:", error)

      // Retornar array vazio em vez de propagar erro
      return []
    }
  }

  async watchTransactions(walletAddress: string, callback?: () => void) {
    this.addDebugLog(`🔍 Configurando watcher para: ${walletAddress}`)
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
