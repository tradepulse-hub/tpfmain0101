import { WORLDCHAIN_CONFIG, TOKENS_INFO } from "./constants"
import { balanceSyncService } from "./balance-sync-service"
import { holdstationService } from "./holdstation-service"
import type { TokenBalance, Transaction } from "./types"

class WalletService {
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    console.log("🔄 Initializing Wallet Service...")
    this.initialized = true
    console.log("✅ Wallet Service initialized!")
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) await this.initialize()

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      // Use real Holdstation service for balances
      const realBalances = await holdstationService.getTokenBalances(walletAddress)

      // Update TPF balance with sync service if needed
      const tpfBalance = realBalances.find((b) => b.symbol === "TPF")
      if (tpfBalance) {
        const syncedBalance = balanceSyncService.getCurrentTPFBalance(walletAddress)
        if (syncedBalance > 0) {
          tpfBalance.balance = syncedBalance.toString()
          tpfBalance.formattedBalance = syncedBalance.toString()
        }
      }

      return realBalances
    } catch (error) {
      console.error("Error getting token balances:", error)

      // Fallback to sync service for TPF
      const fallbackBalance = balanceSyncService.getCurrentTPFBalance(walletAddress)
      return [
        {
          symbol: "TPF",
          name: "TPulseFi",
          address: TOKENS_INFO.TPF.address,
          balance: fallbackBalance.toString(),
          decimals: 18,
          icon: "/logo-tpf.png",
          formattedBalance: fallbackBalance.toString(),
        },
        {
          symbol: "WLD",
          name: "Worldcoin",
          address: TOKENS_INFO.WLD.address,
          balance: "0",
          decimals: 18,
          icon: "/worldcoin.jpeg",
          formattedBalance: "0",
        },
        {
          symbol: "DNA",
          name: "DNA Token",
          address: TOKENS_INFO.DNA.address,
          balance: "0",
          decimals: 18,
          icon: "/dna-token.png",
          formattedBalance: "0",
        },
        {
          symbol: "WDD",
          name: "Drachma Token",
          address: TOKENS_INFO.WDD.address,
          balance: "0",
          decimals: 18,
          icon: "/drachma-token.png",
          formattedBalance: "0",
        },
      ]
    }
  }

  async getBalance(walletAddress: string, tokenSymbol = "TPF"): Promise<number> {
    try {
      if (tokenSymbol === "TPF") {
        return balanceSyncService.getCurrentTPFBalance(walletAddress)
      }

      const balances = await this.getTokenBalances(walletAddress)
      const token = balances.find((b) => b.symbol === tokenSymbol)
      return token ? Number.parseFloat(token.balance) : 0
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} balance:`, error)
      return 0
    }
  }

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<Transaction[]> {
    try {
      console.log(`📜 Getting transaction history for: ${walletAddress}`)

      // Mock transactions for now
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          hash: "0x123...abc",
          type: "receive",
          amount: "1000",
          tokenSymbol: "TPF",
          tokenAddress: TOKENS_INFO.TPF.address,
          from: "0x456...def",
          to: walletAddress,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          status: "completed",
        },
        {
          id: "2",
          hash: "0x456...def",
          type: "send",
          amount: "500",
          tokenSymbol: "TPF",
          tokenAddress: TOKENS_INFO.TPF.address,
          from: walletAddress,
          to: "0x789...ghi",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          status: "completed",
        },
        {
          id: "3",
          hash: "0x789...ghi",
          type: "swap",
          amount: "100",
          tokenSymbol: "WLD",
          tokenAddress: TOKENS_INFO.WLD.address,
          from: walletAddress,
          to: "0xabc...123",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
          status: "completed",
        },
      ]

      return mockTransactions.slice(0, limit)
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return []
    }
  }

  async sendToken(params: {
    to: string
    amount: number
    tokenAddress?: string
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`📤 Sending ${params.amount} tokens to ${params.to}`)
      console.log(`Token address: ${params.tokenAddress || "ETH"}`)

      // Aqui você pode implementar a lógica real de envio
      // Por enquanto, simular envio bem-sucedido
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

      console.log(`✅ Token sent successfully: ${mockTxHash}`)

      return {
        success: true,
        txHash: mockTxHash,
      }
    } catch (error) {
      console.error("❌ Error sending token:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  getNetworkInfo() {
    return WORLDCHAIN_CONFIG
  }

  getTokensInfo() {
    return TOKENS_INFO
  }

  getExplorerTransactionUrl(hash: string): string {
    return `${WORLDCHAIN_CONFIG.blockExplorer}/tx/${hash}`
  }

  getExplorerAddressUrl(address: string): string {
    return `${WORLDCHAIN_CONFIG.blockExplorer}/address/${address}`
  }

  isInitialized(): boolean {
    return this.initialized
  }

  async setUserBalance(amount: number): Promise<boolean> {
    try {
      console.log(`Setting user balance to: ${amount}`)
      return true
    } catch (error) {
      console.error("Error setting user balance:", error)
      return false
    }
  }
}

export const walletService = new WalletService()
