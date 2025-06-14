import type { Transaction } from "./types"

class HoldstationHistoryService {
  private debugLogs: string[] = []

  constructor() {
    console.log("✅ Holdstation History Service initialized (simplified)")
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    try {
      console.log(`🔍 Loading mock transactions for: ${walletAddress}`)

      // Retornar transações mock simples e estáveis
      const mockTransactions = this.generateSimpleMockTransactions(walletAddress, limit)

      console.log(`✅ Loaded ${mockTransactions.length} mock transactions`)
      return mockTransactions
    } catch (error) {
      console.error("❌ Error in getTransactionHistory:", error)
      return []
    }
  }

  private generateSimpleMockTransactions(walletAddress: string, limit: number): Transaction[] {
    const transactions: Transaction[] = []
    const now = Date.now()

    // Gerar transações simples para demonstração
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const isReceive = i % 2 === 0
      const tokens = ["TPF", "WLD", "DNA", "WDD"]
      const token = tokens[i % tokens.length]

      transactions.push({
        id: `mock_${token}_${i}`,
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        type: isReceive ? "receive" : "send",
        amount: (Math.random() * 1000 + 1).toFixed(2),
        tokenSymbol: token,
        tokenAddress: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
        from: isReceive ? "0x123...456" : walletAddress,
        to: isReceive ? walletAddress : "0x789...abc",
        timestamp: new Date(now - i * 60 * 60 * 1000), // i horas atrás
        status: "completed",
        blockNumber: 12345000 + i,
      })
    }

    return transactions
  }

  async watchTransactions(walletAddress: string, callback?: any) {
    console.log(`🔍 Mock watcher setup for: ${walletAddress}`)
    return {
      start: async () => console.log("🔄 Mock watcher started"),
      stop: async () => console.log("🛑 Mock watcher stopped"),
    }
  }

  async stopWatching(walletAddress: string): Promise<void> {
    console.log(`🛑 Stopping watcher for: ${walletAddress}`)
  }

  async cleanup(): Promise<void> {
    console.log("🧹 Cleanup completed")
  }

  getDebugLogs(): string[] {
    return this.debugLogs
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
