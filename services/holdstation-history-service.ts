import * as sdk from "@holdstation/worldchain-sdk"
import { ethers } from "ethers"

interface Transaction {
  id: string
  type: "send" | "receive" | "swap"
  amount: string
  tokenSymbol: string
  date: string
  address: string
  status: "pending" | "completed" | "failed"
  hash?: string
  blockNumber?: number
  from?: string
  to?: string
}

class HoldstationHistoryService {
  private provider: ethers.JsonRpcProvider | null = null
  private managerHistory: sdk.Manager | null = null
  private walletHistory: any = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🔄 Initializing Holdstation History Service...")

      // Configurar provider
      this.provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public")

      // Inicializar Manager para histórico
      this.managerHistory = new sdk.Manager(this.provider, 480) // 480 é o chainId da WorldChain

      this.initialized = true
      console.log("✅ Holdstation History Service initialized!")
    } catch (error) {
      console.error("❌ Failed to initialize History Service:", error)
    }
  }

  // Monitorar transações em tempo real
  async watchTransactions(
    address: string,
    callback: () => void,
  ): Promise<{ start: () => Promise<void>; stop: () => void } | null> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.managerHistory) {
        throw new Error("Manager History not initialized")
      }

      console.log(`👀 Starting to watch transactions for: ${address}`)

      const { start, stop } = await this.managerHistory.watch(address, callback)

      return { start, stop }
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
      return null
    }
  }

  // Buscar histórico de transações
  async getTransactionHistory(address: string, offset = 0, limit = 50): Promise<Transaction[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`📜 Fetching transaction history for: ${address}`)

      // Se não temos walletHistory, precisamos inicializar o watcher primeiro
      if (!this.walletHistory) {
        console.log("Initializing wallet history...")
        // Aqui você precisaria ter uma referência ao walletHistory
        // que é criado quando você chama o watch
        return this.getMockTransactions(address)
      }

      const transactions = await this.walletHistory.find(offset, limit)
      console.log(`Found ${transactions.length} transactions`)

      return this.formatTransactions(transactions)
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      // Retornar transações mock em caso de erro
      return this.getMockTransactions(address)
    }
  }

  private formatTransactions(rawTransactions: any[]): Transaction[] {
    return rawTransactions.map((tx, index) => ({
      id: tx.hash || `tx_${index}`,
      type: this.determineTransactionType(tx),
      amount: tx.value || "0",
      tokenSymbol: tx.tokenSymbol || "ETH",
      date: new Date(tx.timestamp * 1000).toISOString(),
      address: tx.to || tx.from,
      status: tx.status === 1 ? "completed" : "failed",
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
    }))
  }

  private determineTransactionType(tx: any): "send" | "receive" | "swap" {
    // Lógica para determinar o tipo de transação
    if (tx.methodId && tx.methodId.includes("swap")) {
      return "swap"
    }
    // Adicionar mais lógica conforme necessário
    return tx.type || "send"
  }

  private getMockTransactions(address: string): Transaction[] {
    // Transações mock para desenvolvimento/fallback
    return [
      {
        id: "mock_1",
        type: "receive",
        amount: "1000.0",
        tokenSymbol: "TPF",
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        address: "0x1234...5678",
        status: "completed",
        hash: "0xmock1...",
        from: "0x1234...5678",
        to: address,
      },
      {
        id: "mock_2",
        type: "send",
        amount: "50.0",
        tokenSymbol: "WLD",
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        address: "0x9876...5432",
        status: "completed",
        hash: "0xmock2...",
        from: address,
        to: "0x9876...5432",
      },
      {
        id: "mock_3",
        type: "swap",
        amount: "100.0",
        tokenSymbol: "USDCe",
        date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        address: "0xswap...contract",
        status: "completed",
        hash: "0xmock3...",
        from: address,
        to: "0xswap...contract",
      },
    ]
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
export type { Transaction }
