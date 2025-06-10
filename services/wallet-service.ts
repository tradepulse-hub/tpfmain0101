import { holdstationService } from "./holdstation-service"
import { holdstationHistoryService, type Transaction } from "./holdstation-history-service"

// Informações da rede Worldchain
const WORLDCHAIN_CONFIG = {
  chainId: 480,
  name: "World Chain Mainnet",
  shortName: "wc",
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  blockExplorer: "https://worldscan.org",
}

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

    // Aguardar inicialização dos serviços da Holdstation
    await holdstationService.isInitialized()
    await holdstationHistoryService.isInitialized()

    this.initialized = true
    console.log("✅ Wallet Service initialized!")
  }

  // ==================== BALANCES ====================

  async getTokenBalances(walletAddress: string) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      const balances = await holdstationService.getTokenBalances(walletAddress)
      console.log(`Found ${balances.length} tokens with balance`)

      return balances
    } catch (error) {
      console.error("Error getting token balances:", error)
      return []
    }
  }

  async getBalance(walletAddress: string, tokenSymbol = "TPF"): Promise<number> {
    try {
      const balances = await this.getTokenBalances(walletAddress)
      const token = balances.find((b) => b.symbol === tokenSymbol)
      return token ? Number.parseFloat(token.balance) : 0
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} balance:`, error)
      return 0
    }
  }

  // ==================== TRANSACTIONS ====================

  async getTransactionHistory(walletAddress: string, limit = 20): Promise<Transaction[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`📜 Getting transaction history for: ${walletAddress}`)

      const transactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, limit)

      console.log(`Found ${transactions.length} transactions`)
      return transactions
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return []
    }
  }

  async watchTransactions(walletAddress: string, callback: () => void) {
    try {
      console.log(`👀 Setting up transaction watcher for: ${walletAddress}`)

      const watcher = await holdstationHistoryService.watchTransactions(walletAddress, callback)

      if (watcher) {
        // Iniciar o monitoramento
        await watcher.start()
        console.log("✅ Transaction watcher started")

        // Retornar função de cleanup
        return watcher.stop
      }

      return null
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
      return null
    }
  }

  // ==================== SEND ====================

  async sendToken(params: {
    to: string
    amount: number
    tokenAddress?: string
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`📤 Sending ${params.amount} tokens to ${params.to}`)

      const txHash = await holdstationService.sendToken({
        to: params.to,
        amount: params.amount,
        token: params.tokenAddress,
      })

      console.log("✅ Token sent successfully:", txHash)

      return {
        success: true,
        txHash,
      }
    } catch (error) {
      console.error("❌ Error sending token:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // ==================== SWAP ====================

  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💱 Getting swap quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      const quote = await holdstationService.getSwapQuote(params)
      console.log("Swap quote:", quote)

      return quote
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`🚀 Executing swap: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      const txHash = await holdstationService.executeSwap(params)
      console.log("✅ Swap executed successfully:", txHash)

      return {
        success: true,
        txHash,
      }
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  // ==================== UTILITY ====================

  getNetworkInfo() {
    return WORLDCHAIN_CONFIG
  }

  getKnownTokens() {
    return holdstationService.getKnownTokens()
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
}

// Exportar instância única
export const walletService = new WalletService()
