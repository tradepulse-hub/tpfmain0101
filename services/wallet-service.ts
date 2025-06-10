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

// Tokens conhecidos - apenas os da wallet (removidos WETH, USDCe, CASH)
const KNOWN_TOKENS_INFO = {
  TPF: {
    symbol: "TPF",
    name: "TPulseFi",
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    logo: "/logo-tpf.png",
    decimals: 18,
  },
  WLD: {
    symbol: "WLD",
    name: "Worldcoin",
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    logo: "/worldcoin.jpeg",
    decimals: 18,
  },
  DNA: {
    symbol: "DNA",
    name: "DNA Token",
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    logo: "/dna-token.png",
    decimals: 18,
  },
  WDD: {
    symbol: "WDD",
    name: "Drachma Token",
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    logo: "/drachma-token.png",
    decimals: 18,
  },
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

    try {
      // Aguardar inicialização dos serviços da Holdstation
      if (holdstationService && typeof holdstationService.isInitialized === "function") {
        await holdstationService.isInitialized()
      }

      if (holdstationHistoryService && typeof holdstationHistoryService.isInitialized === "function") {
        await holdstationHistoryService.isInitialized()
      }

      this.initialized = true
      console.log("✅ Wallet Service initialized!")
    } catch (error) {
      console.error("Error initializing Wallet Service:", error)
      // Continuar mesmo com erro para não quebrar o app
      this.initialized = true
    }
  }

  // ==================== BALANCES ====================

  async getTokenBalances(walletAddress: string) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (holdstationService && typeof holdstationService.getTokenBalances === "function") {
        const balances = await holdstationService.getTokenBalances(walletAddress)
        console.log(`Found ${balances.length} tokens with balance`)
        return balances
      }

      console.log("Holdstation service not available, returning empty array")
      return []
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

      if (holdstationHistoryService && typeof holdstationHistoryService.getTransactionHistory === "function") {
        const transactions = await holdstationHistoryService.getTransactionHistory(walletAddress, 0, limit)
        console.log(`Found ${transactions.length} transactions`)
        return transactions
      }

      console.log("History service not available, returning empty array")
      return []
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return []
    }
  }

  async getTokenTransactions(walletAddress: string, tokenSymbol: string): Promise<Transaction[]> {
    try {
      console.log(`📜 Getting ${tokenSymbol} transactions for: ${walletAddress}`)

      if (holdstationHistoryService && typeof holdstationHistoryService.getTokenTransactions === "function") {
        const transactions = await holdstationHistoryService.getTokenTransactions(walletAddress, tokenSymbol)
        console.log(`Found ${transactions.length} ${tokenSymbol} transactions`)
        return transactions
      }

      console.log("History service not available, returning empty array")
      return []
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} transactions:`, error)
      return []
    }
  }

  async watchTransactions(walletAddress: string, callback: () => void) {
    try {
      console.log(`👀 Setting up transaction watcher for: ${walletAddress}`)

      if (holdstationHistoryService && typeof holdstationHistoryService.watchTransactions === "function") {
        const watcher = await holdstationHistoryService.watchTransactions(walletAddress, callback)

        if (watcher) {
          await watcher.start()
          console.log("✅ Transaction watcher started")
          return watcher.stop
        }
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

      if (holdstationService && typeof holdstationService.sendToken === "function") {
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
      }

      throw new Error("Holdstation service not available")
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

      if (holdstationService && typeof holdstationService.getSwapQuote === "function") {
        const quote = await holdstationService.getSwapQuote(params)
        console.log("Swap quote:", quote)
        return quote
      }

      throw new Error("Holdstation service not available")
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

      if (holdstationService && typeof holdstationService.executeSwap === "function") {
        const txHash = await holdstationService.executeSwap(params)
        console.log("✅ Swap executed successfully:", txHash)

        return {
          success: true,
          txHash,
        }
      }

      throw new Error("Holdstation service not available")
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
    try {
      if (holdstationService && typeof holdstationService.getKnownTokens === "function") {
        return holdstationService.getKnownTokens()
      }

      // Fallback para tokens conhecidos
      const tokens: Record<string, string> = {}
      Object.values(KNOWN_TOKENS_INFO).forEach((token) => {
        tokens[token.symbol] = token.address
      })
      return tokens
    } catch (error) {
      console.error("Error getting known tokens:", error)
      const tokens: Record<string, string> = {}
      Object.values(KNOWN_TOKENS_INFO).forEach((token) => {
        tokens[token.symbol] = token.address
      })
      return tokens
    }
  }

  getTokensInfo() {
    try {
      // Retornar informações dos tokens conhecidos diretamente
      // Isso evita dependências circulares e problemas de inicialização
      return KNOWN_TOKENS_INFO
    } catch (error) {
      console.error("Error getting tokens info:", error)
      return KNOWN_TOKENS_INFO
    }
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

// Exportar instância única
export const walletService = new WalletService()
