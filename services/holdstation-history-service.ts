import { ethers } from "ethers"
import type { Transaction } from "./types"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens da wallet
const WALLET_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

class HoldstationHistoryService {
  private provider: ethers.JsonRpcProvider | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation History Service...")

      // Setup com ethers v6
      this.provider = new ethers.JsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      this.initialized = true
      console.log("✅ Holdstation History Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation History Service:", error)
    }
  }

  // Obter histórico de transações (mock por enquanto)
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 20): Promise<Transaction[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`📜 Getting transaction history for: ${walletAddress} (offset: ${offset}, limit: ${limit})`)

      // Mock transactions - em produção você usaria a API real
      const mockTransactions = this.getMockTransactions(walletAddress)

      console.log(`Found ${mockTransactions.length} transactions`)
      return mockTransactions.slice(offset, offset + limit)
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return this.getMockTransactions(walletAddress)
    }
  }

  // Obter transações de um token específico
  async getTokenTransactions(walletAddress: string, tokenSymbol: string, limit = 50): Promise<Transaction[]> {
    try {
      console.log(`📜 Getting ${tokenSymbol} transactions for: ${walletAddress}`)

      const allTransactions = await this.getTransactionHistory(walletAddress, 0, limit)
      const tokenTransactions = allTransactions.filter((tx) => tx.tokenSymbol === tokenSymbol)

      console.log(`Found ${tokenTransactions.length} ${tokenSymbol} transactions`)
      return tokenTransactions
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} transactions:`, error)
      return []
    }
  }

  // Transações mock para demonstração
  private getMockTransactions(walletAddress: string): Transaction[] {
    return [
      {
        id: "1",
        hash: "0x123abc456def789012345678901234567890abcdef123456789012345678901234",
        type: "receive",
        amount: "1000",
        tokenSymbol: "TPF",
        tokenAddress: WALLET_TOKENS.TPF,
        from: "0x456def789012345678901234567890abcdef123456",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
        status: "completed",
        blockNumber: 12345678,
      },
      {
        id: "2",
        hash: "0x456def789012345678901234567890abcdef123456789012345678901234567890",
        type: "send",
        amount: "500",
        tokenSymbol: "TPF",
        tokenAddress: WALLET_TOKENS.TPF,
        from: walletAddress,
        to: "0x789012345678901234567890abcdef123456789012",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
        status: "completed",
        blockNumber: 12345677,
      },
      {
        id: "3",
        hash: "0x789012345678901234567890abcdef123456789012345678901234567890abcdef",
        type: "swap",
        amount: "100",
        tokenSymbol: "WLD",
        tokenAddress: WALLET_TOKENS.WLD,
        from: walletAddress,
        to: "0xabc123456789012345678901234567890abcdef123",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 dias atrás
        status: "completed",
        blockNumber: 12345676,
      },
      {
        id: "4",
        hash: "0xabc123456789012345678901234567890abcdef123456789012345678901234567",
        type: "receive",
        amount: "25.5",
        tokenSymbol: "WLD",
        tokenAddress: WALLET_TOKENS.WLD,
        from: "0xdef456789012345678901234567890abcdef123456",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 dias atrás
        status: "completed",
        blockNumber: 12345675,
      },
      {
        id: "5",
        hash: "0xdef456789012345678901234567890abcdef123456789012345678901234567890",
        type: "send",
        amount: "1500.75",
        tokenSymbol: "DNA",
        tokenAddress: WALLET_TOKENS.DNA,
        from: walletAddress,
        to: "0x123456789012345678901234567890abcdef123456",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 dias atrás
        status: "completed",
        blockNumber: 12345674,
      },
    ]
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Verificar se uma transação existe
  async getTransaction(txHash: string): Promise<Transaction | null> {
    try {
      if (!this.provider) {
        await this.initialize()
      }

      console.log(`🔍 Getting transaction: ${txHash}`)

      // Em produção, você buscaria a transação real
      const mockTransactions = this.getMockTransactions("")
      const transaction = mockTransactions.find((tx) => tx.hash === txHash)

      return transaction || null
    } catch (error) {
      console.error("Error getting transaction:", error)
      return null
    }
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
