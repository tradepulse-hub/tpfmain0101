import { ethers } from "ethers"
import { holdstationService } from "./holdstation-service"

// Serviço de carteira aprimorado com SDK REAL
class EnhancedWalletService {
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    console.log("Initializing REAL enhanced wallet service...")

    try {
      // Aguardar inicialização do Holdstation REAL
      while (!holdstationService.isInitialized()) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      this.initialized = true
      console.log("REAL enhanced wallet service initialized")
    } catch (error) {
      console.error("Error initializing REAL enhanced wallet service:", error)
      throw error
    }
  }

  // Obter saldo REAL de TPF
  async getTPFBalance(walletAddress: string): Promise<number> {
    try {
      if (!this.initialized) await this.initialize()

      const tpfAddress = holdstationService.getKnownTokens().TPF
      const balance = await holdstationService.getSingleTokenBalance(tpfAddress, walletAddress)

      // Converter de wei para unidades normais usando ethers REAL
      const formattedBalance = Number(ethers.utils.formatEther(balance))
      console.log("REAL TPF balance:", formattedBalance)

      return formattedBalance
    } catch (error) {
      console.error("Error getting REAL TPF balance:", error)
      throw error
    }
  }

  // Obter todos os saldos REAIS de tokens
  async getAllTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      if (!this.initialized) await this.initialize()

      // Obter tokens REAIS da carteira
      const walletTokens = await holdstationService.getWalletTokens(walletAddress)

      // Adicionar tokens conhecidos se não estiverem na lista
      const knownTokens = holdstationService.getKnownTokens()
      const allTokens = [...new Set([...walletTokens, ...Object.values(knownTokens)])]

      // Obter detalhes REAIS dos tokens
      const tokenDetails = await holdstationService.getTokenDetails(allTokens)

      // Obter saldos REAIS
      const balances = await holdstationService.getTokenBalances(walletAddress, allTokens)

      // Formatar saldos usando ethers REAL
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

      console.log("REAL all token balances:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("Error getting REAL all token balances:", error)
      throw error
    }
  }

  // Obter histórico REAL de transações
  async getTransactionHistory(walletAddress: string, limit = 50): Promise<any[]> {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching REAL transaction history...")
      const transactions = await holdstationService.getTransactionHistory(walletAddress, 0, limit)

      // Formatar transações para o formato esperado pela UI
      const formattedTransactions = transactions.map((tx: any, index: number) => ({
        id: tx.hash || tx.id || `tx-${index}`,
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
      console.error("Error fetching REAL transaction history:", error)
      throw error
    }
  }

  // Monitorar transações REAIS em tempo real
  async startTransactionMonitoring(walletAddress: string, callback: () => void) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Starting REAL transaction monitoring...")
      const { start, stop } = await holdstationService.watchTransactionHistory(walletAddress, callback)

      // Iniciar monitoramento automaticamente
      await start()

      return { stop }
    } catch (error) {
      console.error("Error starting REAL transaction monitoring:", error)
      throw error
    }
  }

  // Obter cotação REAL para swap
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

  // Executar swap REAL
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

  // Enviar tokens REAIS
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

  // Obter detalhes REAIS de tokens
  async getTokenDetails(tokenAddresses: string[]) {
    try {
      if (!this.initialized) await this.initialize()

      return await holdstationService.getTokenDetails(tokenAddresses)
    } catch (error) {
      console.error("Error getting REAL token details:", error)
      throw error
    }
  }

  // Obter tokens REAIS da carteira
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
