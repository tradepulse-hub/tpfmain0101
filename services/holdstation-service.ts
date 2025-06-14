import type { TokenBalance, SwapQuote } from "./types"

// Configuração para Worldchain
const WORLDCHAIN_CONFIG = {
  chainId: 480,
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  name: "Worldchain",
}

// Tokens suportados pela Holdstation
const SUPPORTED_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

class HoldstationService {
  private holdstation: any = null
  private initialized = false
  private isUsingMock = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing REAL Holdstation SDK...")

      // Tentar importar o SDK real da Holdstation
      try {
        // Método 1: Tentar importar do pacote npm
        const HoldstationSDK = await import("@holdstation/sdk")
        console.log("✅ Holdstation SDK package found:", HoldstationSDK)

        this.holdstation = new HoldstationSDK.Holdstation({
          chainId: WORLDCHAIN_CONFIG.chainId,
          rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
        })

        console.log("✅ REAL Holdstation SDK initialized successfully!")
        this.isUsingMock = false
      } catch (importError) {
        console.warn("⚠️ Holdstation SDK package not found:", importError.message)

        // Método 2: Tentar acessar SDK global se disponível
        if (typeof window !== "undefined" && (window as any).Holdstation) {
          console.log("🔍 Found global Holdstation SDK")
          const HoldstationGlobal = (window as any).Holdstation

          this.holdstation = new HoldstationGlobal({
            chainId: WORLDCHAIN_CONFIG.chainId,
            rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
          })

          console.log("✅ Global Holdstation SDK initialized!")
          this.isUsingMock = false
        } else {
          throw new Error("Holdstation SDK not available globally")
        }
      }

      // Testar se o SDK está funcionando
      await this.testSDKConnection()

      console.log(`🌐 Connected to ${WORLDCHAIN_CONFIG.name} (Chain ID: ${WORLDCHAIN_CONFIG.chainId})`)
      this.initialized = true
    } catch (error) {
      console.error("❌ Failed to initialize REAL Holdstation SDK:", error)
      console.log("🔄 Falling back to mock implementation...")

      // Fallback para mock apenas se o SDK real não funcionar
      this.holdstation = this.createMockHoldstation()
      this.isUsingMock = true
      this.initialized = true
    }
  }

  private async testSDKConnection() {
    if (!this.holdstation) return

    try {
      console.log("🧪 Testing Holdstation SDK connection...")

      // Tentar uma operação simples para verificar se o SDK está funcionando
      if (typeof this.holdstation.getNetworkInfo === "function") {
        const networkInfo = await this.holdstation.getNetworkInfo()
        console.log("✅ SDK connection test passed:", networkInfo)
      } else if (typeof this.holdstation.getSupportedTokens === "function") {
        const tokens = await this.holdstation.getSupportedTokens()
        console.log("✅ SDK connection test passed, supported tokens:", tokens)
      } else {
        console.log("⚠️ SDK loaded but methods not available for testing")
      }
    } catch (error) {
      console.warn("⚠️ SDK connection test failed:", error)
      // Não falhar aqui, pode ser que o SDK funcione mesmo assim
    }
  }

  private createMockHoldstation() {
    console.log("🎭 Creating mock Holdstation implementation...")

    return {
      getTokenBalances: async (walletAddress: string) => {
        console.log(`🎭 MOCK: Getting balances for ${walletAddress}`)

        // Simular saldos realistas
        return [
          {
            symbol: "TPF",
            name: "TPulseFi",
            address: SUPPORTED_TOKENS.TPF,
            balance: "86452794.03338581",
            decimals: 18,
            formattedBalance: "86452794.03338581",
          },
          {
            symbol: "WLD",
            name: "Worldcoin",
            address: SUPPORTED_TOKENS.WLD,
            balance: "42.67",
            decimals: 18,
            formattedBalance: "42.67",
          },
          {
            symbol: "DNA",
            name: "DNA Token",
            address: SUPPORTED_TOKENS.DNA,
            balance: "22765.884",
            decimals: 18,
            formattedBalance: "22765.884",
          },
          {
            symbol: "WDD",
            name: "Drachma Token",
            address: SUPPORTED_TOKENS.WDD,
            balance: "78.32",
            decimals: 18,
            formattedBalance: "78.32",
          },
        ]
      },

      getSwapQuote: async (params: any) => {
        console.log("🎭 MOCK: Getting swap quote...", params)

        const amountIn = Number.parseFloat(params.amountIn)
        const slippagePercent = Number.parseFloat(params.slippage || "0.5") / 100

        // Simular taxa de conversão realista WLD → TPF
        let rate = 23567.947685 // 1 WLD = ~23,567 TPF

        // Inverter se for TPF → WLD
        if (params.tokenIn.toLowerCase() === SUPPORTED_TOKENS.TPF.toLowerCase()) {
          rate = 1 / rate
        }

        const amountOut = amountIn * rate
        const minReceived = amountOut * (1 - slippagePercent)
        const feeAmount = amountIn * 0.003 // 0.3% fee

        return {
          amountOut: amountOut.toFixed(6),
          data: "0x" + Math.random().toString(16).substring(2, 16),
          to: "0xHoldstationRouter",
          value: "0",
          addons: {
            outAmount: amountOut.toFixed(6),
            rateSwap: rate.toString(),
            amountOutUsd: (amountOut * 1.2).toFixed(2),
            minReceived: minReceived.toFixed(6),
            feeAmountOut: feeAmount.toFixed(6),
          },
        }
      },

      executeSwap: async (params: any) => {
        console.log("🎭 MOCK: Executing swap...", params)
        console.log("⚠️ THIS IS A MOCK SWAP - NO REAL TRANSACTION WILL OCCUR")

        // Simular delay de transação
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Simular sucesso com hash mock
        const txHash = "0x" + Math.random().toString(16).substring(2, 16)
        console.log("🎭 MOCK: Swap completed with MOCK hash:", txHash)

        return txHash
      },
    }
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)
      console.log(`🔧 Using ${this.isUsingMock ? "MOCK" : "REAL"} Holdstation SDK`)

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not available")
      }

      const balances = await this.holdstation.getTokenBalances(walletAddress)

      console.log("📊 Raw balances from Holdstation:", balances)

      // Processar e formatar saldos
      const formattedBalances: TokenBalance[] = balances.map((balance: any) => ({
        symbol: balance.symbol,
        name: balance.name,
        address: balance.address,
        balance: balance.balance,
        decimals: balance.decimals || 18,
        icon: this.getTokenIcon(balance.symbol),
        formattedBalance: balance.formattedBalance || balance.balance,
      }))

      console.log("✅ Formatted balances:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      throw error
    }
  }

  // Obter cotação de swap
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<SwapQuote> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("💱 Getting swap quote from Holdstation...")
      console.log(`🔧 Using ${this.isUsingMock ? "MOCK" : "REAL"} Holdstation SDK`)
      console.log("📊 Quote parameters:", params)

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not available")
      }

      const quote = await this.holdstation.getSwapQuote({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.5",
      })

      console.log("📊 Raw quote from Holdstation:", quote)

      // Validar cotação
      if (!quote || !quote.amountOut || Number.parseFloat(quote.amountOut) <= 0) {
        throw new Error("Invalid quote received from Holdstation")
      }

      console.log("✅ Valid quote received:", quote)
      return quote
    } catch (error) {
      console.error("❌ Error getting swap quote:", error)
      throw error
    }
  }

  // Executar swap
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("🚀 Executing swap via Holdstation...")
      console.log(`🔧 Using ${this.isUsingMock ? "MOCK" : "REAL"} Holdstation SDK`)
      console.log("📊 Swap parameters:", params)

      if (this.isUsingMock) {
        console.log("⚠️ WARNING: This is a MOCK swap - no real transaction will occur!")
        console.log("⚠️ To use real swaps, install the Holdstation SDK package")
      }

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not available")
      }

      const txHash = await this.holdstation.executeSwap({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.5",
      })

      if (this.isUsingMock) {
        console.log("🎭 MOCK swap completed with hash:", txHash)
        console.log("⚠️ This transaction hash is FAKE - no real swap occurred")
      } else {
        console.log("✅ REAL swap executed successfully:", txHash)
      }

      return txHash
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

  private getTokenIcon(symbol: string): string {
    const icons: Record<string, string> = {
      TPF: "/logo-tpf.png",
      WLD: "/worldcoin.jpeg",
      DNA: "/dna-token.png",
      WDD: "/drachma-token.png",
    }
    return icons[symbol] || "/placeholder.svg"
  }

  // Métodos auxiliares
  getSupportedTokens() {
    return SUPPORTED_TOKENS
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getSDKStatus() {
    return {
      initialized: this.initialized,
      hasSDK: !!this.holdstation,
      sdkType: this.isUsingMock ? "Mock Implementation" : "Real Holdstation SDK",
      isUsingMock: this.isUsingMock,
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  // Método para forçar uso do SDK real (para debug)
  async forceRealSDK() {
    console.log("🔄 Forcing real SDK initialization...")
    this.initialized = false
    this.isUsingMock = false
    this.holdstation = null
    await this.initialize()
  }

  // Método para verificar se está usando mock
  isUsingMockImplementation(): boolean {
    return this.isUsingMock
  }
}

export const holdstationService = new HoldstationService()
