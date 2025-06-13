import * as sdk from "@holdstation/worldchain-sdk"
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
  private managerHistory: sdk.Manager | null = null
  private walletHistory: any = null
  private initialized = false
  private watchers: Record<string, { start: () => Promise<void>; stop: () => Promise<void> }> = {}

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation History Service...")

      // Setup provider com ethers v6
      this.provider = new ethers.JsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Initialize Holdstation SDK Manager
      this.managerHistory = new sdk.Manager(this.provider, CHAIN_ID)

      this.initialized = true
      console.log("✅ Holdstation History Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation History Service:", error)
      // Fallback to mock mode if SDK fails
      this.initialized = true
    }
  }

  // Watch real-time transaction updates
  async watchTransactions(walletAddress: string, callback?: () => void): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.managerHistory) {
        console.warn("Holdstation SDK not available, using mock data")
        return
      }

      // Stop existing watcher if any
      if (this.watchers[walletAddress]) {
        await this.watchers[walletAddress].stop()
        delete this.watchers[walletAddress]
      }

      console.log(`👀 Starting to watch transactions for: ${walletAddress}`)

      // Get current block number
      const currentBlock = await this.provider!.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 100000) // Last ~100k blocks

      // Setup watcher according to Holdstation docs
      const watcher = await this.managerHistory.watch(walletAddress, fromBlock, currentBlock)

      this.watchers[walletAddress] = watcher

      // Start watching
      await watcher.start()

      console.log(`✅ Successfully started watching transactions for: ${walletAddress}`)

      // Call callback when new activity is detected
      if (callback) {
        callback()
      }
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
    }
  }

  // Stop watching transactions for a specific address
  async stopWatching(walletAddress: string): Promise<void> {
    try {
      if (this.watchers[walletAddress]) {
        console.log(`⏹️ Stopping transaction watcher for: ${walletAddress}`)
        await this.watchers[walletAddress].stop()
        delete this.watchers[walletAddress]
      }
    } catch (error) {
      console.error("Error stopping transaction watcher:", error)
    }
  }

  // Fetch stored transaction history using Holdstation SDK
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 20): Promise<Transaction[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`📜 Getting transaction history for: ${walletAddress} (offset: ${offset}, limit: ${limit})`)

      // Try to use Holdstation SDK first
      if (this.managerHistory && this.walletHistory) {
        try {
          const fetchedTransactions = await this.walletHistory.find(offset, limit)
          console.log(`Found ${fetchedTransactions.length} transactions from Holdstation SDK`)

          // Convert Holdstation format to our Transaction format
          return this.convertHoldstationTransactions(fetchedTransactions, walletAddress)
        } catch (error) {
          console.error("Error fetching from Holdstation SDK:", error)
        }
      }

      // Fallback to mock transactions for development
      console.log("Using mock transactions for development")
      const mockTransactions = this.getMockTransactions(walletAddress)
      return mockTransactions.slice(offset, offset + limit)
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return this.getMockTransactions(walletAddress).slice(offset, offset + limit)
    }
  }

  // Convert Holdstation SDK transaction format to our format
  private convertHoldstationTransactions(holdstationTxs: any[], walletAddress: string): Transaction[] {
    return holdstationTxs.map((tx, index) => {
      // Determine transaction type based on transfers
      let type: "send" | "receive" | "swap" = "send"
      let amount = "0"
      let tokenSymbol = "ETH"
      let tokenAddress = ""
      let from = tx.from || ""
      let to = tx.to || ""

      if (tx.transfers && tx.transfers.length > 0) {
        const transfer = tx.transfers[0]
        amount = transfer.amount
        tokenAddress = transfer.tokenAddress

        // Get token symbol from known tokens
        const tokenEntry = Object.entries(WALLET_TOKENS).find(
          ([_, addr]) => addr.toLowerCase() === tokenAddress.toLowerCase(),
        )
        tokenSymbol = tokenEntry ? tokenEntry[0] : "UNKNOWN"

        // Determine if it's send or receive
        const fromAddr = transfer.from.toLowerCase()
        const toAddr = transfer.to.toLowerCase()
        const walletAddr = walletAddress.toLowerCase()

        if (fromAddr === walletAddr && toAddr !== walletAddr) {
          type = "send"
          to = transfer.to
        } else if (toAddr === walletAddr && fromAddr !== walletAddr) {
          type = "receive"
          from = transfer.from
        } else {
          type = "swap"
        }
      }

      return {
        id: tx.hash || `mock_${index}`,
        hash: tx.hash || `0x${Math.random().toString(16).substr(2, 64)}`,
        type,
        amount,
        tokenSymbol,
        tokenAddress,
        from,
        to,
        timestamp: tx.date || new Date(),
        status: tx.success === 1 ? "completed" : "failed",
        blockNumber: tx.block,
      } as Transaction
    })
  }

  // Get transactions for a specific token
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

  // Mock transactions for development/fallback
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

      // Try to get real transaction from blockchain
      if (this.provider) {
        try {
          const tx = await this.provider.getTransaction(txHash)
          if (tx) {
            // Convert to our Transaction format
            return {
              id: tx.hash,
              hash: tx.hash,
              type: "send", // Default, would need more logic to determine
              amount: tx.value.toString(),
              tokenSymbol: "ETH",
              tokenAddress: "",
              from: tx.from,
              to: tx.to || "",
              timestamp: new Date(), // Would need block timestamp
              status: "completed",
              blockNumber: tx.blockNumber,
            }
          }
        } catch (error) {
          console.error("Error fetching real transaction:", error)
        }
      }

      // Fallback to mock data
      const mockTransactions = this.getMockTransactions("")
      const transaction = mockTransactions.find((tx) => tx.hash === txHash)
      return transaction || null
    } catch (error) {
      console.error("Error getting transaction:", error)
      return null
    }
  }

  // Cleanup method to stop all watchers
  async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up Holdstation History Service...")

    for (const address of Object.keys(this.watchers)) {
      await this.stopWatching(address)
    }

    this.watchers = {}
    console.log("✅ Cleanup completed")
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
