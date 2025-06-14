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
      // FORÇA LOGS EXTREMOS
      console.log("🚨🚨🚨 === FORÇA LOGS EXTREMOS V3 ===")
      console.log(`🚨🚨🚨 Timestamp: ${Date.now()}`)
      console.log(`🚨🚨🚨 Endereço: ${walletAddress}`)
      console.log(`🚨🚨🚨 Offset: ${offset}, Limit: ${limit}`)

      this.addDebugLog(`🚨🚨🚨 === FORÇA LOGS EXTREMOS V3 ===`)
      this.addDebugLog(`Endereço: ${walletAddress}`)
      this.addDebugLog(`Offset: ${offset}, Limit: ${limit}`)

      // FORÇAR INICIALIZAÇÃO E DEBUG
      console.log("🚨🚨🚨 Forçando debug do SDK...")
      const sdkStatus = await holdstationService.debugSDK()
      console.log("🚨🚨🚨 SDK Status:", sdkStatus)

      // FORÇAR OBTENÇÃO DO MANAGER
      const manager = holdstationService.getManager()
      console.log("🚨🚨🚨 Manager obtido:", !!manager)
      console.log("🚨🚨🚨 Manager tipo:", manager?.constructor?.name)

      if (manager) {
        // FORÇAR LISTAGEM DE MÉTODOS
        const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(manager))
        console.log("🚨🚨🚨 TODOS OS 6 MÉTODOS:", allMethods)

        // TESTAR CADA MÉTODO INDIVIDUALMENTE
        for (let i = 0; i < allMethods.length; i++) {
          const method = allMethods[i]
          console.log(`🚨🚨🚨 MÉTODO ${i + 1}/6: ${method}`)

          if (typeof manager[method] === "function" && !method.startsWith("_")) {
            try {
              console.log(`🚨🚨🚨 CHAMANDO ${method}(${walletAddress})...`)
              const result = await manager[method](walletAddress)
              console.log(`🚨🚨🚨 RESULTADO ${method}:`, result)

              if (result && (Array.isArray(result) || typeof result === "object")) {
                console.log(`🚨🚨🚨 ✅ MÉTODO ${method} FUNCIONOU!`)
                this.addDebugLog(`✅ Método ${method} funcionou!`)
                return Array.isArray(result) ? this.formatTransactions(result, walletAddress) : []
              }
            } catch (error) {
              console.log(`🚨🚨🚨 ❌ MÉTODO ${method} FALHOU:`, error.message)
            }
          } else {
            console.log(`🚨🚨🚨 MÉTODO ${method} não é função ou é privado`)
          }
        }
      }

      // USAR HOLDSTATION SERVICE DIRETAMENTE
      console.log("🚨🚨🚨 Tentando HoldStation service diretamente...")
      const rawTransactions = await holdstationService.getTransactionHistory(walletAddress, offset, limit)

      this.addDebugLog(`📊 HoldStation retornou: ${rawTransactions?.length || 0} transações`)

      if (rawTransactions && rawTransactions.length > 0) {
        const formattedTransactions = this.formatTransactions(rawTransactions, walletAddress)
        this.addDebugLog(`✅ ${formattedTransactions.length} transações formatadas`)
        return formattedTransactions
      }

      this.addDebugLog("⚠️ Nenhuma transação encontrada")
      return []
    } catch (error) {
      console.log("🚨🚨🚨 ERRO FINAL:", error.message)
      this.addDebugLog(`❌ Erro: ${error.message}`)
      throw error
    }
  }

  private formatTransactions(transactions: any[], walletAddress: string): Transaction[] {
    return transactions.map((tx, index) => {
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
