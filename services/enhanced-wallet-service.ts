import { ethers } from "ethers"
import { holdstationService } from "./holdstation-service"

// Serviço de carteira aprimorado com integração REAL da Holdstation
class EnhancedWalletService {
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    console.log("Initializing enhanced wallet service...")

    try {
      // Aguardar inicialização do Holdstation
      while (!holdstationService.isInitialized()) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      this.initialized = true
      console.log("Enhanced wallet service initialized with REAL Holdstation SDK")
    } catch (error) {
      console.error("Error initializing enhanced wallet service:", error)
      throw error
    }
  }

  // Obter saldo de TPF usando Holdstation REAL
  async getTPFBalance(walletAddress: string): Promise<number> {
    try {
      if (!this.initialized) await this.initialize()

      const tpfAddress = holdstationService.getKnownTokens().TPF
      const balance = await holdstationService.getSingleTokenBalance(tpfAddress, walletAddress)

      // Converter de wei para unidades normais
      const formattedBalance = Number(ethers.utils.formatEther(balance))
      console.log("REAL TPF balance from Holdstation:", formattedBalance)

      return formattedBalance
    } catch (error) {
      console.error("Error getting REAL TPF balance from Holdstation:", error)
      throw error
    }
  }

  // Obter todos os saldos de tokens usando Holdstation REAL
  async getAllTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      if (!this.initialized) await this.initialize()

      // Obter tokens conhecidos
      const knownTokens = holdstationService.getKnownTokens()
      const tokenAddresses = Object.values(knownTokens)

      // Obter detalhes dos tokens
      const tokenDetails = await holdstationService.getTokenDetails(tokenAddresses)

      // Obter saldos
      const balances = await holdstationService.getTokenBalances(walletAddress, tokenAddresses)

      // Formatar saldos
      const formattedBalances: Record<string, number> = {}

      for (const [symbol, address] of Object.entries(knownTokens)) {
        const rawBalance = balances[address] || "0"
        const tokenInfo = tokenDetails[address]

        if (tokenInfo && tokenInfo.decimals) {
          const formattedBalance = Number(ethers.utils.formatUnits(rawBalance, tokenInfo.decimals))
          formattedBalances[symbol] = formattedBalance
        } else {
          // Fallback para 18 decimais
          const formattedBalance = Number(ethers.utils.formatEther(rawBalance))
          formattedBalances[symbol] = formattedBalance
        }
      }

      console.log("REAL token balances from Holdstation:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("Error getting REAL token balances from Holdstation:", error)
      throw error
    }
  }

  // Obter histórico de transações usando Holdstation REAL
  async getTransactionHistory(walletAddress: string, limit = 50): Promise<any[]> {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching REAL transaction history from Holdstation...")
      const transactions = await holdstationService.getTransactionHistory(walletAddress, 0, limit)

      // Formatar transações para o formato esperado pela UI
      const formattedTransactions = transactions.map((tx: any, index: number) => ({
        id: tx.hash || `tx-${index}`,
        type: tx.type || "unknown",
        amount: tx.amount || "0",
        date: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
        from: tx.from || "",
        to: tx.to || "",
        status: tx.status || "completed",
        transactionHash: tx.hash || "",
        blockNumber: tx.blockNumber || 0,
        token: tx.token || "ETH",
      }))

      console.log("REAL formatted transaction history:", formattedTransactions)
      return formattedTransactions
    } catch (error) {
      console.error("Error fetching REAL transaction history from Holdstation:", error)
      throw error
    }
  }

  // Monitorar transações em tempo real
  async startTransactionMonitoring(walletAddress: string, callback: () => void) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Starting REAL transaction monitoring...")
      const { stop } = await holdstationService.watchTransactionHistory(walletAddress, callback)

      return { stop }
    } catch (error) {
      console.error("Error starting REAL transaction monitoring:", error)
      throw error
    }
  }

  // Obter cotação para swap
  async getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    try {
      if (!this.initialized) await this.initialize()

      const quote = await holdstationService.getSwapQuote({
        tokenIn,
        tokenOut,
        amountIn,
        slippage: "0.5",
        fee: "0.0",
      })

      return quote
    } catch (error) {
      console.error("Error getting REAL swap quote:", error)
      throw error
    }
  }

  // Executar swap
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    quote: any
  }) {
    try {
      if (!this.initialized) await this.initialize()

      const result = await holdstationService.executeSwap({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: {
          data: params.quote.data,
          to: params.quote.to,
          value: params.quote.value,
        },
        feeAmountOut: params.quote.addons?.feeAmountOut,
      })

      return result
    } catch (error) {
      console.error("Error executing REAL swap:", error)
      throw error
    }
  }

  // Enviar tokens
  async sendToken(params: { to: string; amount: number; token?: string }) {
    try {
      if (!this.initialized) await this.initialize()

      const result = await holdstationService.sendToken(params)
      return result
    } catch (error) {
      console.error("Error sending REAL token:", error)
      throw error
    }
  }

  // Obter detalhes de tokens
  async getTokenDetails(tokenAddresses: string[]) {
    try {
      if (!this.initialized) await this.initialize()

      return await holdstationService.getTokenDetails(tokenAddresses)
    } catch (error) {
      console.error("Error getting REAL token details:", error)
      throw error
    }
  }

  // Obter tokens da carteira
  async getWalletTokens(walletAddress: string) {
    try {
      if (!this.initialized) await this.initialize()

      return await holdstationService.getWalletTokens(walletAddress)
    } catch (error) {
      console.error("Error getting REAL wallet tokens:", error)
      throw error
    }
  }

  // Verificar se está inicializado
  isInitialized() {
    return this.initialized
  }

  // Obter informações da rede
  getNetworkInfo() {
    return holdstationService.getNetworkInfo()
  }
}

export const enhancedWalletService = new EnhancedWalletService()
