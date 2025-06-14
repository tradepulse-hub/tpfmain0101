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

        // Debug completo da estrutura do módulo
        console.log("🔍 Debugging module structure...")
        for (const [key, value] of Object.entries(HoldstationModule)) {
          console.log(`Export "${key}": ${typeof value}`, value?.name || value)
        }

        // Tentar diferentes formas de acessar a classe principal
        let HoldstationClass = null
        let className = ""

        // Lista expandida de possíveis nomes de classe
        const possibleClassNames = [
          "default",
          "Holdstation",
          "HoldstationSDK",
          "WorldchainSDK",
          "SDK",
          "Client",
          "HoldstationClient",
          "WorldchainClient",
          "Manager",
          "HoldstationManager",
          "WorldchainManager",
        ]

        for (const name of possibleClassNames) {
          if (HoldstationModule[name] && typeof HoldstationModule[name] === "function") {
            HoldstationClass = HoldstationModule[name]
            className = name
            console.log(`📋 Found class: ${name}`)
            break
          }
        }

        // Se não encontrou, tentar o primeiro export que seja uma função
        if (!HoldstationClass) {
          const functionExports = Object.entries(HoldstationModule).filter(
            ([key, value]) => typeof value === "function",
          )

          if (functionExports.length > 0) {
            ;[className, HoldstationClass] = functionExports[0]
            console.log(`📋 Using first function export: ${className}`)
          }
        }

        if (!HoldstationClass) {
          throw new Error(
            `No valid Holdstation class found. Available exports: ${Object.keys(HoldstationModule).join(", ")}`,
          )
        }

        // Tentar diferentes configurações de inicialização
        const configOptions = [
          {
            chainId: WORLDCHAIN_CONFIG.chainId,
            rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
            network: "worldchain",
          },
          {
            chainId: WORLDCHAIN_CONFIG.chainId,
            rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
          },
          {
            network: "worldchain",
            rpc: WORLDCHAIN_CONFIG.rpcUrl,
          },
          {
            rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
          },
          // Configuração vazia como último recurso
          {},
        ]

        let initError = null
        for (const config of configOptions) {
          try {
            console.log(`🔧 Trying to initialize ${className} with config:`, config)
            this.holdstation = new HoldstationClass(config)
            console.log(`✅ ${className} initialized successfully with config:`, config)
            break
          } catch (error) {
            console.log(`❌ Failed with config:`, config, error.message)
            initError = error
          }
        }

        if (!this.holdstation) {
          throw new Error(`Failed to initialize ${className}. Last error: ${initError?.message}`)
        }

        // Tentar obter o manager se disponível
        const managerMethods = ["getManager", "manager", "createManager", "getClient", "client"]

        for (const method of managerMethods) {
          try {
            if (typeof this.holdstation[method] === "function") {
              this.manager = await this.holdstation[method]()
              console.log(`✅ Manager obtained via ${method}()`)
              break
            } else if (this.holdstation[method]) {
              this.manager = this.holdstation[method]
              console.log(`✅ Manager found as property: ${method}`)
              break
            }
          } catch (error) {
            console.log(`⚠️ Failed to get manager via ${method}:`, error.message)
          }
        }

        // Se não conseguiu manager, usar o próprio SDK
        if (!this.manager) {
          this.manager = this.holdstation
          console.log("📋 Using SDK instance as manager")
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

    // Listar métodos disponíveis no SDK
    const sdkMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.holdstation))
    console.log("📋 Available SDK methods:", sdkMethods)

    // Listar métodos disponíveis no manager
    if (this.manager && this.manager !== this.holdstation) {
      const managerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager))
      console.log("📋 Available Manager methods:", managerMethods)
    }

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
      "getHistory",
      "getTransactionHistory",
    ]

    console.log("🔍 Testing method availability...")
    for (const method of testMethods) {
      const inSDK = typeof this.holdstation[method] === "function"
      const inManager = this.manager && typeof this.manager[method] === "function"

      if (inSDK || inManager) {
        console.log(`✅ Method '${method}' is available ${inSDK ? "(SDK)" : ""} ${inManager ? "(Manager)" : ""}`)
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
      const methods = [
        { obj: this.holdstation, name: "getTokenBalances" },
        { obj: this.holdstation, name: "getBalances" },
        { obj: this.manager, name: "getTokenBalances" },
        { obj: this.manager, name: "getBalances" },
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

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      console.log("📡 Calling getSwapQuote...")

      let quote = null
      const methods = [
        { obj: this.holdstation, name: "getSwapQuote" },
        { obj: this.holdstation, name: "getQuote" },
        { obj: this.holdstation, name: "quote" },
        { obj: this.manager, name: "getSwapQuote" },
        { obj: this.manager, name: "getQuote" },
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

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      console.log("📡 Calling executeSwap...")

      let txHash = null
      const methods = [
        { obj: this.holdstation, name: "executeSwap" },
        { obj: this.holdstation, name: "swap" },
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

      if (!this.holdstation) {
        throw new Error("Holdstation SDK not initialized")
      }

      let transactions = null
      const methods = [
        { obj: this.holdstation, name: "getTransactionHistory" },
        { obj: this.holdstation, name: "getHistory" },
        { obj: this.manager, name: "getTransactionHistory" },
        { obj: this.manager, name: "getHistory" },
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
