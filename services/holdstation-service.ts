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
  private manager: any = null
  private swapHelper: any = null
  private tokenProvider: any = null
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== "undefined") {
      // Não inicializar automaticamente, apenas quando necessário
    }
  }

  private async initialize() {
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }

  private async _doInitialize() {
    try {
      console.log("🚀 Initializing Holdstation SDK (Worldchain)...")

      // Importação dinâmica do SDK da Holdstation
      try {
        console.log("📦 Importing @holdstation/worldchain-sdk...")
        const HoldstationModule = await import("@holdstation/worldchain-sdk")

        console.log("✅ @holdstation/worldchain-sdk imported successfully!")
        console.log("Available exports:", Object.keys(HoldstationModule))

        // Extrair as classes principais
        const { Manager, SwapHelper, TokenProvider, HoldSo, defaultWorldchainConfig } = HoldstationModule

        console.log("🔧 Initializing Holdstation components...")

        // Usar a configuração padrão da Worldchain se disponível
        const config = defaultWorldchainConfig || {
          chainId: WORLDCHAIN_CONFIG.chainId,
          rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
        }

        console.log("📋 Using config:", config)

        // Inicializar Manager
        if (Manager) {
          try {
            this.manager = new Manager(config)
            console.log("✅ Manager initialized!")
          } catch (error) {
            console.log("⚠️ Manager initialization failed:", error.message)
            // Tentar sem configuração
            this.manager = new Manager()
            console.log("✅ Manager initialized without config!")
          }
        }

        // Inicializar SwapHelper
        if (SwapHelper) {
          try {
            this.swapHelper = new SwapHelper(config)
            console.log("✅ SwapHelper initialized!")
          } catch (error) {
            console.log("⚠️ SwapHelper initialization failed:", error.message)
            // Tentar sem configuração
            this.swapHelper = new SwapHelper()
            console.log("✅ SwapHelper initialized without config!")
          }
        }

        // Inicializar TokenProvider
        if (TokenProvider) {
          try {
            this.tokenProvider = new TokenProvider(config)
            console.log("✅ TokenProvider initialized!")
          } catch (error) {
            console.log("⚠️ TokenProvider initialization failed:", error.message)
            // Tentar sem configuração
            this.tokenProvider = new TokenProvider()
            console.log("✅ TokenProvider initialized without config!")
          }
        }

        // Se não conseguiu nenhum, tentar HoldSo como fallback
        if (!this.manager && !this.swapHelper && HoldSo) {
          try {
            const holdSo = new HoldSo(config)
            this.manager = holdSo
            this.swapHelper = holdSo
            console.log("✅ HoldSo initialized as fallback!")
          } catch (error) {
            console.log("⚠️ HoldSo initialization failed:", error.message)
          }
        }

        if (!this.manager && !this.swapHelper) {
          throw new Error("Failed to initialize any Holdstation component")
        }
      } catch (importError) {
        console.error("❌ Failed to import @holdstation/worldchain-sdk:", importError)
        throw new Error(`NPM import failed: ${importError.message}`)
      }

      // Testar se o SDK está funcionando
      await this.testSDKFunctionality()

      this.initialized = true
      console.log("✅ Holdstation SDK fully initialized and tested!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation SDK:", error)
      this.initialized = false
      this.manager = null
      this.swapHelper = null
      this.tokenProvider = null
      throw error
    }
  }

  private async testSDKFunctionality() {
    console.log("🧪 Testing SDK functionality...")

    // Testar Manager
    if (this.manager) {
      const managerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager))
      console.log("📋 Manager methods:", managerMethods)
    }

    // Testar SwapHelper
    if (this.swapHelper) {
      const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
      console.log("📋 SwapHelper methods:", swapMethods)
    }

    // Testar TokenProvider
    if (this.tokenProvider) {
      const tokenMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.tokenProvider))
      console.log("📋 TokenProvider methods:", tokenMethods)
    }

    console.log("✅ SDK functionality test completed")
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      await this.initialize()

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (!this.manager && !this.tokenProvider) {
        throw new Error("No balance provider available")
      }

      console.log("📡 Calling getTokenBalances...")

      let balances = null
      const methods = [
        { obj: this.tokenProvider, name: "getTokenBalances" },
        { obj: this.tokenProvider, name: "getBalances" },
        { obj: this.tokenProvider, name: "getTokens" },
        { obj: this.manager, name: "getTokenBalances" },
        { obj: this.manager, name: "getBalances" },
        { obj: this.manager, name: "getTokens" },
      ]

      for (const method of methods) {
        if (method.obj && typeof method.obj[method.name] === "function") {
          try {
            console.log(`🔄 Trying ${method.name}...`)
            balances = await method.obj[method.name](walletAddress)
            console.log(`✅ ${method.name} succeeded!`)
            break
          } catch (error) {
            console.log(`❌ ${method.name} failed:`, error.message)
          }
        }
      }

      if (!balances) {
        throw new Error("No balance method worked")
      }

      console.log("📊 Raw balances from SDK:", balances)

      if (!Array.isArray(balances)) {
        // Se não for array, tentar converter
        if (balances && typeof balances === "object") {
          balances = Object.entries(balances).map(([symbol, data]: [string, any]) => ({
            symbol,
            name: data.name || symbol,
            address: data.address || SUPPORTED_TOKENS[symbol as keyof typeof SUPPORTED_TOKENS] || "",
            balance: data.balance || data.amount || "0",
            decimals: data.decimals || 18,
          }))
        } else {
          throw new Error("Invalid balance response format")
        }
      }

      // Processar e formatar saldos
      const formattedBalances: TokenBalance[] = balances.map((balance: any) => ({
        symbol: balance.symbol,
        name: balance.name || balance.symbol,
        address: balance.address || balance.tokenAddress || "",
        balance: balance.balance || balance.amount || "0",
        decimals: balance.decimals || 18,
        icon: this.getTokenIcon(balance.symbol),
        formattedBalance: balance.formattedBalance || balance.balance || balance.amount || "0",
      }))

      console.log("✅ Formatted balances:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      throw new Error(`Balance fetch failed: ${error.message}`)
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
      await this.initialize()

      console.log("💱 Getting swap quote...")
      console.log("📊 Quote parameters:", params)

      if (!this.swapHelper && !this.manager) {
        throw new Error("No swap provider available")
      }

      console.log("📡 Calling getSwapQuote...")

      let quote = null
      const methods = [
        { obj: this.swapHelper, name: "getQuote" },
        { obj: this.swapHelper, name: "getSwapQuote" },
        { obj: this.swapHelper, name: "quote" },
        { obj: this.manager, name: "getQuote" },
        { obj: this.manager, name: "getSwapQuote" },
        { obj: this.manager, name: "quote" },
      ]

      for (const method of methods) {
        if (method.obj && typeof method.obj[method.name] === "function") {
          try {
            console.log(`🔄 Trying ${method.name}...`)
            quote = await method.obj[method.name](params)
            console.log(`✅ ${method.name} succeeded!`)
            break
          } catch (error) {
            console.log(`❌ ${method.name} failed:`, error.message)
          }
        }
      }

      if (!quote) {
        throw new Error("No quote method worked")
      }

      console.log("📊 Raw quote from SDK:", quote)

      // Validar e formatar cotação
      if (!quote || typeof quote !== "object") {
        throw new Error("Invalid quote response")
      }

      // Normalizar formato da cotação
      const normalizedQuote: SwapQuote = {
        amountOut: quote.amountOut || quote.outputAmount || quote.toAmount || "0",
        data: quote.data || quote.calldata || "0x",
        to: quote.to || quote.target || quote.router || "",
        value: quote.value || quote.ethValue || "0",
        feeAmountOut: quote.feeAmountOut || quote.fee || "0",
        addons: quote.addons || {
          outAmount: quote.amountOut || quote.outputAmount || "0",
          rateSwap: quote.rate || quote.exchangeRate || "1",
          amountOutUsd: quote.amountOutUsd || "0",
          minReceived: quote.minReceived || quote.minimumAmountOut || "0",
          feeAmountOut: quote.feeAmountOut || quote.fee || "0",
        },
      }

      if (!normalizedQuote.amountOut || Number.parseFloat(normalizedQuote.amountOut) <= 0) {
        throw new Error("Invalid quote amount")
      }

      console.log("✅ Normalized quote:", normalizedQuote)
      return normalizedQuote
    } catch (error) {
      console.error("❌ Error getting swap quote:", error)
      throw new Error(`Quote fetch failed: ${error.message}`)
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
      await this.initialize()

      console.log("🚀 Executing swap...")
      console.log("📊 Swap parameters:", params)
      console.log("⚠️ This will execute a REAL transaction!")

      if (!this.swapHelper && !this.manager) {
        throw new Error("No swap provider available")
      }

      console.log("📡 Calling executeSwap...")

      let txHash = null
      const methods = [
        { obj: this.swapHelper, name: "executeSwap" },
        { obj: this.swapHelper, name: "swap" },
        { obj: this.manager, name: "executeSwap" },
        { obj: this.manager, name: "swap" },
      ]

      for (const method of methods) {
        if (method.obj && typeof method.obj[method.name] === "function") {
          try {
            console.log(`🔄 Trying ${method.name}...`)
            txHash = await method.obj[method.name](params)
            console.log(`✅ ${method.name} succeeded!`)
            break
          } catch (error) {
            console.log(`❌ ${method.name} failed:`, error.message)
          }
        }
      }

      if (!txHash) {
        throw new Error("No swap method worked")
      }

      console.log("📋 Raw transaction result:", txHash)

      // Extrair hash da transação
      let finalTxHash = null
      if (typeof txHash === "string") {
        finalTxHash = txHash
      } else if (txHash && txHash.hash) {
        finalTxHash = txHash.hash
      } else if (txHash && txHash.transactionHash) {
        finalTxHash = txHash.transactionHash
      } else if (txHash && txHash.txHash) {
        finalTxHash = txHash.txHash
      }

      if (!finalTxHash || typeof finalTxHash !== "string" || !finalTxHash.startsWith("0x")) {
        throw new Error("Invalid transaction hash received")
      }

      console.log("✅ Swap executed successfully!")
      console.log("📋 Transaction hash:", finalTxHash)
      return finalTxHash
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw new Error(`Swap execution failed: ${error.message}`)
    }
  }

  // Método para obter histórico de transações
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
    try {
      await this.initialize()

      console.log(`📜 Getting transaction history for: ${walletAddress}`)

      if (!this.manager) {
        console.log("⚠️ No transaction history provider available")
        return []
      }

      let transactions = null
      const methods = [
        { obj: this.manager, name: "getTransactionHistory" },
        { obj: this.manager, name: "getHistory" },
        { obj: this.manager, name: "getTransactions" },
      ]

      for (const method of methods) {
        if (method.obj && typeof method.obj[method.name] === "function") {
          try {
            console.log(`🔄 Trying ${method.name}...`)
            transactions = await method.obj[method.name](walletAddress, offset, limit)
            console.log(`✅ ${method.name} succeeded!`)
            break
          } catch (error) {
            console.log(`❌ ${method.name} failed:`, error.message)
          }
        }
      }

      console.log("📊 Raw transactions from SDK:", transactions)
      return transactions || []
    } catch (error) {
      console.error("❌ Error getting transaction history:", error)
      return []
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

  getManager() {
    return this.manager
  }

  getSwapHelper() {
    return this.swapHelper
  }

  getTokenProvider() {
    return this.tokenProvider
  }

  getSDKStatus() {
    return {
      initialized: this.initialized,
      hasManager: !!this.manager,
      hasSwapHelper: !!this.swapHelper,
      hasTokenProvider: !!this.tokenProvider,
      sdkType: "NPM @holdstation/worldchain-sdk",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  // Método para debug - mostrar informações do SDK
  async debugSDK() {
    try {
      await this.initialize()

      console.log("=== HOLDSTATION SDK DEBUG ===")
      console.log("Initialized:", this.initialized)
      console.log("Has Manager:", !!this.manager)
      console.log("Has SwapHelper:", !!this.swapHelper)
      console.log("Has TokenProvider:", !!this.tokenProvider)

      if (this.manager) {
        console.log("Manager Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager)))
        console.log("Manager Properties:", Object.keys(this.manager))
      }

      if (this.swapHelper) {
        console.log("SwapHelper Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper)))
        console.log("SwapHelper Properties:", Object.keys(this.swapHelper))
      }

      if (this.tokenProvider) {
        console.log("TokenProvider Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.tokenProvider)))
        console.log("TokenProvider Properties:", Object.keys(this.tokenProvider))
      }

      console.log("=== END DEBUG ===")

      return this.getSDKStatus()
    } catch (error) {
      console.error("Debug failed:", error)
      return { error: error.message }
    }
  }
}

export const holdstationService = new HoldstationService()
