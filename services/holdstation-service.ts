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
  private manager: any = null
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

      // Importação dinâmica do SDK correto da Holdstation
      try {
        console.log("📦 Trying dynamic import from @holdstation/worldchain-sdk...")
        const HoldstationModule = await import("@holdstation/worldchain-sdk")

        console.log("✅ @holdstation/worldchain-sdk imported successfully!")
        console.log("Available exports:", Object.keys(HoldstationModule))

        // Tentar diferentes formas de acessar a classe principal
        let HoldstationClass = null

        if (HoldstationModule.default) {
          HoldstationClass = HoldstationModule.default
          console.log("📋 Using default export")
        } else if (HoldstationModule.Holdstation) {
          HoldstationClass = HoldstationModule.Holdstation
          console.log("📋 Using named export 'Holdstation'")
        } else if (HoldstationModule.HoldstationSDK) {
          HoldstationClass = HoldstationModule.HoldstationSDK
          console.log("📋 Using named export 'HoldstationSDK'")
        } else if (HoldstationModule.WorldchainSDK) {
          HoldstationClass = HoldstationModule.WorldchainSDK
          console.log("📋 Using named export 'WorldchainSDK'")
        } else if (HoldstationModule.SDK) {
          HoldstationClass = HoldstationModule.SDK
          console.log("📋 Using named export 'SDK'")
        } else {
          // Tentar o primeiro export disponível
          const firstExport = Object.values(HoldstationModule)[0]
          if (typeof firstExport === "function") {
            HoldstationClass = firstExport
            console.log("📋 Using first available export")
          }
        }

        if (!HoldstationClass) {
          throw new Error("No valid Holdstation class found in module")
        }

        // Inicializar o SDK com configuração da Worldchain
        console.log("🔧 Initializing Holdstation SDK with Worldchain config...")
        this.holdstation = new HoldstationClass({
          chainId: WORLDCHAIN_CONFIG.chainId,
          rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
          network: "worldchain",
        })

        console.log("✅ Holdstation SDK initialized!")

        // Tentar obter o manager se disponível
        if (this.holdstation.getManager) {
          this.manager = await this.holdstation.getManager()
          console.log("✅ Holdstation Manager obtained!")
        } else if (this.holdstation.manager) {
          this.manager = this.holdstation.manager
          console.log("✅ Holdstation Manager found as property!")
        } else if (this.holdstation.createManager) {
          this.manager = await this.holdstation.createManager()
          console.log("✅ Holdstation Manager created!")
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
      this.holdstation = null
      this.manager = null
      throw error
    }
  }

  private async testSDKFunctionality() {
    if (!this.holdstation) {
      throw new Error("No SDK to test")
    }

    console.log("🧪 Testing SDK functionality...")

    // Listar métodos disponíveis
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.holdstation))
    console.log("📋 Available SDK methods:", methods)

    // Testar métodos comuns
    const testMethods = [
      "getTokenBalances",
      "getSwapQuote",
      "executeSwap",
      "getManager",
      "isConnected",
      "getNetworkInfo",
      "quote",
      "swap",
      "getBalances",
      "getQuote",
    ]

    for (const method of testMethods) {
      if (typeof this.holdstation[method] === "function") {
        console.log(`✅ Method '${method}' is available`)
      } else {
        console.log(`⚠️ Method '${method}' is NOT available`)
      }
    }

    console.log("✅ SDK functionality test completed")
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      await this.initialize()

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      console.log("📡 Calling getTokenBalances...")

      // Tentar diferentes métodos baseados na documentação comum
      let balances = null

      if (typeof this.holdstation.getTokenBalances === "function") {
        balances = await this.holdstation.getTokenBalances(walletAddress)
      } else if (typeof this.holdstation.getBalances === "function") {
        balances = await this.holdstation.getBalances(walletAddress)
      } else if (this.manager && typeof this.manager.getTokenBalances === "function") {
        balances = await this.manager.getTokenBalances(walletAddress)
      } else if (this.manager && typeof this.manager.getBalances === "function") {
        balances = await this.manager.getBalances(walletAddress)
      } else {
        throw new Error("No balance method found in SDK")
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

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      console.log("📡 Calling getSwapQuote...")

      let quote = null

      // Tentar diferentes métodos de cotação
      if (typeof this.holdstation.getSwapQuote === "function") {
        quote = await this.holdstation.getSwapQuote(params)
      } else if (typeof this.holdstation.getQuote === "function") {
        quote = await this.holdstation.getQuote(params)
      } else if (typeof this.holdstation.quote === "function") {
        quote = await this.holdstation.quote(params)
      } else if (this.manager && typeof this.manager.getSwapQuote === "function") {
        quote = await this.manager.getSwapQuote(params)
      } else if (this.manager && typeof this.manager.getQuote === "function") {
        quote = await this.manager.getQuote(params)
      } else if (this.manager && typeof this.manager.quote === "function") {
        quote = await this.manager.quote(params)
      } else {
        throw new Error("No quote method found in SDK")
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

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      console.log("📡 Calling executeSwap...")

      let txHash = null

      // Tentar diferentes métodos de execução
      if (typeof this.holdstation.executeSwap === "function") {
        txHash = await this.holdstation.executeSwap(params)
      } else if (typeof this.holdstation.swap === "function") {
        txHash = await this.holdstation.swap(params)
      } else if (this.manager && typeof this.manager.executeSwap === "function") {
        txHash = await this.manager.executeSwap(params)
      } else if (this.manager && typeof this.manager.swap === "function") {
        txHash = await this.manager.swap(params)
      } else {
        throw new Error("No swap execution method found in SDK")
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

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      let transactions = null

      // Tentar diferentes métodos de histórico
      if (typeof this.holdstation.getTransactionHistory === "function") {
        transactions = await this.holdstation.getTransactionHistory(walletAddress, offset, limit)
      } else if (typeof this.holdstation.getHistory === "function") {
        transactions = await this.holdstation.getHistory(walletAddress, offset, limit)
      } else if (this.manager && typeof this.manager.getTransactionHistory === "function") {
        transactions = await this.manager.getTransactionHistory(walletAddress, offset, limit)
      } else if (this.manager && typeof this.manager.getHistory === "function") {
        transactions = await this.manager.getHistory(walletAddress, offset, limit)
      } else {
        console.log("⚠️ No transaction history method found in SDK")
        return []
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

  getSDKStatus() {
    return {
      initialized: this.initialized,
      hasSDK: !!this.holdstation,
      hasManager: !!this.manager,
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
      console.log("Has SDK:", !!this.holdstation)
      console.log("Has Manager:", !!this.manager)

      if (this.holdstation) {
        console.log("SDK Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.holdstation)))
        console.log("SDK Properties:", Object.keys(this.holdstation))
      }

      if (this.manager) {
        console.log("Manager Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager)))
        console.log("Manager Properties:", Object.keys(this.manager))
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
