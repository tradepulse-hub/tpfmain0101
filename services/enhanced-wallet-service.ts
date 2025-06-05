// Serviço de carteira simulado (versão original)
class EnhancedWalletService {
  private initialized = true

  constructor() {
    console.log("Enhanced wallet service initialized (simulated)")
  }

  // Obter saldo simulado de TPF
  async getTPFBalance(walletAddress: string): Promise<number> {
    try {
      // Fallback para saldo definido pelo usuário
      if (typeof window !== "undefined") {
        const userDefinedBalance = localStorage.getItem("userDefinedTPFBalance")
        if (userDefinedBalance) {
          return Number(userDefinedBalance)
        }
      }

      // Saldo simulado padrão
      return 1000
    } catch (error) {
      console.error("Error getting TPF balance:", error)
      return 1000
    }
  }

  // Obter todos os saldos simulados de tokens
  async getAllTokenBalances(walletAddress: string): Promise<Record<string, number>> {
    try {
      // Saldos simulados padrão
      const defaultBalances = {
        TPF: 1000,
        WLD: 42.67,
        WETH: 0.5,
        USDCe: 125.45,
      }

      // Verificar se há saldo customizado para TPF
      if (typeof window !== "undefined") {
        const userDefinedBalance = localStorage.getItem("userDefinedTPFBalance")
        if (userDefinedBalance) {
          defaultBalances.TPF = Number(userDefinedBalance)
        }
      }

      console.log("Simulated token balances:", defaultBalances)
      return defaultBalances
    } catch (error) {
      console.error("Error getting all token balances:", error)
      return {
        TPF: 1000,
        WLD: 42.67,
        WETH: 0.5,
        USDCe: 125.45,
      }
    }
  }

  // Obter histórico simulado de transações
  async getTransactionHistory(walletAddress: string, limit = 50): Promise<any[]> {
    try {
      // Histórico simulado
      const simulatedTransactions = [
        {
          id: "tx-1",
          type: "receive",
          amount: "100",
          date: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          from: "0x1234...5678",
          to: walletAddress,
          status: "completed",
          transactionHash: "0xabc123...",
          blockNumber: 12345,
          token: "TPF",
        },
        {
          id: "tx-2",
          type: "send",
          amount: "50",
          date: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          from: walletAddress,
          to: "0x9876...5432",
          status: "completed",
          transactionHash: "0xdef456...",
          blockNumber: 12344,
          token: "WLD",
        },
        {
          id: "tx-3",
          type: "swap",
          amount: "25",
          date: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
          from: walletAddress,
          to: "0xSwapContract",
          status: "completed",
          transactionHash: "0xghi789...",
          blockNumber: 12343,
          token: "WETH",
        },
      ]

      console.log("Simulated transaction history:", simulatedTransactions)
      return simulatedTransactions.slice(0, limit)
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      return []
    }
  }

  // Monitorar transações simulado
  async startTransactionMonitoring(walletAddress: string, callback: () => void) {
    try {
      console.log("Starting simulated transaction monitoring...")

      // Simular callback ocasional
      const interval = setInterval(() => {
        if (Math.random() > 0.95) {
          // 5% chance a cada intervalo
          callback()
        }
      }, 10000) // A cada 10 segundos

      return {
        stop: () => {
          clearInterval(interval)
          console.log("Stopped simulated transaction monitoring")
        },
      }
    } catch (error) {
      console.error("Error starting transaction monitoring:", error)
      return { stop: () => {} }
    }
  }

  // Obter cotação simulada para swap
  async getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    try {
      // Cotação simulada
      const quote = {
        amountOut: (Number(amountIn) * 0.95).toString(), // 5% de slippage simulado
        priceImpact: "0.1",
        fee: "0.3",
        data: "0x",
        to: "0xSwapRouter",
        value: "0",
        addons: {
          feeAmountOut: "0",
        },
      }

      console.log("Simulated swap quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  // Executar swap simulado
  async executeSwap(params: any) {
    try {
      console.log("Executing simulated swap:", params)

      // Simular resultado de swap
      const result = {
        hash: "0xswap123...",
        success: true,
        message: "Swap executed successfully (simulated)",
      }

      return result
    } catch (error) {
      console.error("Error executing swap:", error)
      throw error
    }
  }

  // Enviar tokens simulado
  async sendToken(params: { to: string; amount: number; token?: string }) {
    try {
      console.log("Sending simulated token:", params)

      // Simular resultado de envio
      const result = {
        hash: "0xsend123...",
        success: true,
        message: "Token sent successfully (simulated)",
      }

      return result
    } catch (error) {
      console.error("Error sending token:", error)
      throw error
    }
  }

  // Obter detalhes simulados de tokens
  async getTokenDetails(tokenAddresses: string[]) {
    try {
      const details: Record<string, any> = {}

      tokenAddresses.forEach((address) => {
        details[address] = {
          address,
          name: "Simulated Token",
          symbol: "SIM",
          decimals: 18,
          chainId: 480,
        }
      })

      return details
    } catch (error) {
      console.error("Error getting token details:", error)
      return {}
    }
  }

  // Obter tokens simulados da carteira
  async getWalletTokens(walletAddress: string) {
    try {
      // Lista simulada de tokens
      const tokens = [
        "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45", // TPF
        "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // WLD
        "0x4200000000000000000000000000000000000006", // WETH
        "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1", // USDCe
      ]

      return tokens
    } catch (error) {
      console.error("Error getting wallet tokens:", error)
      return []
    }
  }

  // Verificar se está inicializado
  isInitialized() {
    return this.initialized
  }

  // Obter informações da rede
  getNetworkInfo() {
    return {
      chainId: 480,
      name: "worldchain",
      rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
    }
  }
}

export const enhancedWalletService = new EnhancedWalletService()
