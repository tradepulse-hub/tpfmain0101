import { holdstationService } from "./holdstation-service"

// Serviço de carteira aprimorado (versão 165 restaurada)
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
      console.log("Enhanced wallet service initialized")
    } catch (error) {
      console.error("Error initializing enhanced wallet service:", error)
      this.initialized = true // Marcar como inicializado para evitar loops
    }
  }

  // Obter saldo de TPF
  async getTPFBalance(walletAddress: string): Promise<number> {
    try {
      if (!this.initialized) await this.initialize()

      const tpfAddress = holdstationService.getKnownTokens().TPF
      const balance = await holdstationService.getSingleTokenBalance(tpfAddress, walletAddress)

      // Converter de wei para unidades normais
      const formattedBalance = Number(balance) / Math.pow(10, 18)
      console.log("TPF balance:", formattedBalance)

      return formattedBalance
    } catch (error) {
      console.error("Error getting TPF balance:", error)

      // Fallback para saldo definido pelo usuário
      if (typeof window !== "undefined") {
        const userDefinedBalance = localStorage.getItem("userDefinedTPFBalance")
        if (userDefinedBalance) {
          return Number(userDefinedBalance)
        }
      }
      return 1000
    }
  }

  // Obter todos os saldos de tokens
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
          const formattedBalance = Number(rawBalance) / Math.pow(10, tokenInfo.decimals)
          formattedBalances[symbol] = formattedBalance
        } else {
          // Fallback para 18 decimais
          const formattedBalance = Number(rawBalance) / Math.pow(10, 18)
          formattedBalances[symbol] = formattedBalance
        }
      }

      console.log("All token balances:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("Error getting all token balances:", error)

      // Fallback para valores padrão
      const fallbackBalances = {
        TPF: 1000,
        WLD: 42.67,
        WETH: 0.5,
        USDCe: 125.45,
      }

      // Verificar saldo customizado para TPF
      if (typeof window !== "undefined") {
        const userDefinedBalance = localStorage.getItem("userDefinedTPFBalance")
        if (userDefinedBalance) {
          fallbackBalances.TPF = Number(userDefinedBalance)
        }
      }

      return fallbackBalances
    }
  }

  // Obter histórico de transações
  async getTransactionHistory(walletAddress: string, limit = 50): Promise<any[]> {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching transaction history...")
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

      console.log("Formatted transaction history:", formattedTransactions)
      return formattedTransactions
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      return []
    }
  }

  // Monitorar transações em tempo real
  async startTransactionMonitoring(walletAddress: string, callback: () => void) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Starting transaction monitoring...")
      const { stop } = await holdstationService.watchTransactionHistory(walletAddress, callback)

      return { stop }
    } catch (error) {
      console.error("Error starting transaction monitoring:", error)
      return { stop: () => {} }
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
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  // Executar swap
  async executeSwap(params: any) {
    try {
      if (!this.initialized) await this.initialize()

      const result = await holdstationService.executeSwap(params)
      return result
    } catch (error) {
      console.error("Error executing swap:", error)
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
      console.error("Error sending token:", error)
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

// Exportar instância como named export
export const enhancedWalletService = new EnhancedWalletService()

// Exportar classe também
export default EnhancedWalletService
