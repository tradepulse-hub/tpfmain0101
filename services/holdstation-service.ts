import type { TokenBalance, SwapQuote } from "./types"
import { ethers } from "ethers"

// Configuração para Worldchain
const WORLDCHAIN_CONFIG = {
  chainId: 480,
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  name: "worldchain",
}

// Tokens suportados pela Holdstation
const SUPPORTED_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

console.log("🚀 HOLDSTATION SERVICE - SDK REAL")

class HoldstationService {
  private client: any = null
  private multicall3: any = null
  private tokenProvider: any = null
  private quoter: any = null
  private swapHelper: any = null
  private provider: any = null
  private config: any = null
  private networkReady = false
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    console.log("🔧 HoldstationService constructor - SDK REAL")
  }

  private async initialize() {
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }

  private async _doInitialize() {
    try {
      console.log("🚀 Initializing REAL Holdstation SDK...")

      // 1. Criar provider primeiro
      console.log("🔧 Creating provider...")
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      // 2. Testar provider
      console.log("🔄 Testing provider connection...")
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()
      console.log("✅ Provider working!")
      console.log(`├─ Network: ${network.name} (${network.chainId})`)
      console.log(`└─ Block: ${blockNumber}`)
      this.networkReady = true

      // 3. Importar módulos do SDK
      console.log("📦 Importing Holdstation SDK modules...")
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ SDK modules imported!")
      console.log("🔍 Available exports:")
      console.log("├─ HoldstationModule:", Object.keys(HoldstationModule))
      console.log("└─ EthersModule:", Object.keys(EthersModule))

      // 4. Extrair componentes necessários
      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3, Quoter, SwapHelper } = EthersModule

      console.log("📋 Component availability:")
      console.log(`├─ config: ${!!config}`)
      console.log(`├─ inmemoryTokenStorage: ${!!inmemoryTokenStorage}`)
      console.log(`├─ TokenProvider: ${!!TokenProvider}`)
      console.log(`├─ Client: ${!!Client}`)
      console.log(`├─ Multicall3: ${!!Multicall3}`)
      console.log(`├─ Quoter: ${!!Quoter}`)
      console.log(`└─ SwapHelper: ${!!SwapHelper}`)

      // 5. Verificar se temos todos os componentes essenciais
      if (!config || !inmemoryTokenStorage || !TokenProvider || !Client || !Multicall3 || !SwapHelper) {
        const missing = []
        if (!config) missing.push("config")
        if (!inmemoryTokenStorage) missing.push("inmemoryTokenStorage")
        if (!TokenProvider) missing.push("TokenProvider")
        if (!Client) missing.push("Client")
        if (!Multicall3) missing.push("Multicall3")
        if (!SwapHelper) missing.push("SwapHelper")

        throw new Error(`Missing essential SDK components: ${missing.join(", ")}`)
      }

      // 6. Configurar SDK step by step
      console.log("🔧 Setting up SDK components...")

      // Guardar config
      this.config = config

      // Criar Client
      console.log("🔧 Creating Client...")
      this.client = new Client(this.provider)
      console.log("✅ Client created!")

      // Configurar config global
      console.log("🔧 Setting up global config...")
      this.config.client = this.client
      this.config.multicall3 = new Multicall3(this.provider)
      this.multicall3 = this.config.multicall3
      console.log("✅ Global config set!")

      // Criar TokenProvider
      console.log("🔧 Creating TokenProvider...")
      this.tokenProvider = new TokenProvider()
      console.log("✅ TokenProvider created!")

      // Criar SwapHelper
      console.log("🔧 Creating SwapHelper...")
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })
      console.log("✅ SwapHelper created!")

      // Criar Quoter (opcional)
      console.log("🔧 Creating Quoter...")
      try {
        this.quoter = new Quoter(this.client)
        console.log("✅ Quoter created!")
      } catch (quoterError) {
        console.log("⚠️ Quoter creation failed:", quoterError.message)
        console.log("⚠️ Continuing without Quoter...")
      }

      // 7. Carregar módulos no SwapHelper
      console.log("🔧 Loading SwapHelper modules...")
      try {
        // Tentar carregar módulos Uniswap
        const loadPromises = []

        if (EthersModule.UniswapV3Module) {
          console.log("🔄 Loading UniswapV3Module...")
          const uniswapV3Module = new EthersModule.UniswapV3Module(this.client)
          loadPromises.push(this.swapHelper.load(uniswapV3Module))
        }

        if (EthersModule.UniswapV2Module) {
          console.log("🔄 Loading UniswapV2Module...")
          const uniswapV2Module = new EthersModule.UniswapV2Module(this.client)
          loadPromises.push(this.swapHelper.load(uniswapV2Module))
        }

        if (loadPromises.length > 0) {
          await Promise.all(loadPromises)
          console.log("✅ Uniswap modules loaded!")
        } else {
          console.log("⚠️ No Uniswap modules found, trying basic load...")
          await this.swapHelper.load()
          console.log("✅ Basic SwapHelper load completed!")
        }
      } catch (moduleError) {
        console.log("⚠️ Module loading failed:", moduleError.message)
        console.log("🔄 Trying basic SwapHelper load...")
        try {
          await this.swapHelper.load()
          console.log("✅ Basic SwapHelper load completed!")
        } catch (basicError) {
          console.log("❌ Basic SwapHelper load also failed:", basicError.message)
          throw new Error(`SwapHelper load failed: ${basicError.message}`)
        }
      }

      // 8. Verificar métodos disponíveis
      console.log("🔍 Checking available methods...")
      if (this.swapHelper) {
        const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
        console.log(`📋 SwapHelper methods: ${swapMethods.join(", ")}`)
      }

      if (this.quoter) {
        const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.quoter))
        console.log(`📋 Quoter methods: ${quoterMethods.join(", ")}`)
      }

      // 9. Testar funcionalidade básica
      console.log("🧪 Testing SDK functionality...")

      // Testar Client
      try {
        const clientName = this.client.name()
        const chainId = this.client.getChainId()
        console.log("✅ Client test passed!")
        console.log(`├─ Name: ${clientName}`)
        console.log(`└─ Chain ID: ${chainId}`)
      } catch (clientError) {
        throw new Error(`Client test failed: ${clientError.message}`)
      }

      // Testar config global
      if (!this.config.client || !this.config.multicall3) {
        throw new Error("Global config not properly set")
      }
      console.log("✅ Global config test passed!")

      // 10. Marcar como inicializado
      this.initialized = true
      console.log("🎉 REAL Holdstation SDK initialization completed!")
      console.log("📊 Final status:", this.getSDKStatus())
    } catch (error) {
      console.error("❌ REAL SDK initialization failed:", error)
      console.error("❌ Error details:", error.message)
      console.error("❌ Error stack:", error.stack)

      // Reset tudo
      this.initialized = false
      this.client = null
      this.multicall3 = null
      this.tokenProvider = null
      this.quoter = null
      this.swapHelper = null
      this.provider = null
      this.config = null
      this.networkReady = false

      throw error
    }
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      await this.initialize()

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (!this.tokenProvider) {
        throw new Error("TokenProvider not available")
      }

      if (!this.config?.client) {
        throw new Error("Global config.client not set")
      }

      console.log("📡 Calling TokenProvider methods...")

      const methods = [
        { obj: this.tokenProvider, name: "getTokenBalances" },
        { obj: this.tokenProvider, name: "getBalances" },
        { obj: this.tokenProvider, name: "getTokens" },
      ]

      let balances = null

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
        throw new Error("All TokenProvider methods failed")
      }

      console.log("📊 Raw balances from SDK:", balances)

      // Processar balances
      if (!Array.isArray(balances)) {
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
      console.log("🚨 === REAL HOLDSTATION SDK QUOTE ===")
      console.log("🚨 TIMESTAMP:", new Date().toISOString())

      await this.initialize()

      if (!this.config?.client) {
        throw new Error("Global config.client not set")
      }

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available")
      }

      // Converter para wei
      const amountInWei = ethers.parseEther(params.amountIn).toString()
      console.log(`🚨 Amount conversion: ${params.amountIn} → ${amountInWei} wei`)

      const quoteParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: amountInWei,
        slippage: params.slippage || "3",
      }

      console.log("🚨 Quote params:", JSON.stringify(quoteParams, null, 2))

      // Usar SwapHelper._quote
      console.log("🚨 Calling swapHelper._quote...")

      if (typeof this.swapHelper._quote !== "function") {
        throw new Error("swapHelper._quote method not available")
      }

      const quote = await this.swapHelper._quote(quoteParams)
      console.log("🚨 swapHelper._quote result:", quote)

      if (!quote) {
        throw new Error("Quote returned null/undefined")
      }

      if (!quote.amountOut || Number.parseFloat(quote.amountOut) <= 0) {
        throw new Error("Invalid quote amountOut")
      }

      // Normalizar cotação
      const normalizedQuote: SwapQuote = {
        amountOut: quote.amountOut || quote.outputAmount || quote.toAmount,
        data: quote.data || quote.calldata || "0x",
        to: quote.to || quote.target || quote.router || "",
        value: quote.value || quote.ethValue || "0",
        feeAmountOut: quote.feeAmountOut || quote.fee || "0",
        addons: quote.addons || {
          outAmount: quote.amountOut || quote.outputAmount,
          rateSwap: quote.rate || quote.exchangeRate,
          amountOutUsd: quote.amountOutUsd || "0",
          minReceived: quote.minReceived || quote.minimumAmountOut,
          feeAmountOut: quote.feeAmountOut || quote.fee || "0",
        },
      }

      console.log("✅ Normalized quote:", normalizedQuote)
      return normalizedQuote
    } catch (error) {
      console.error("❌ REAL SDK quote failed:", error)
      throw new Error(`Real SDK quote failed: ${error.message}`)
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
      console.log("🚀 === REAL HOLDSTATION SDK SWAP ===")
      await this.initialize()

      console.log("📊 Swap parameters:", params)

      if (!this.config?.client) {
        throw new Error("Global config.client not set")
      }

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available")
      }

      // Obter cotação primeiro
      const quoteResponse = await this.getSwapQuote(params)

      // Preparar parâmetros do swap
      const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: ethers.parseEther(params.amountIn).toString(),
        tx: {
          data: quoteResponse.data,
          to: quoteResponse.to,
        },
        fee: "0.2",
        feeAmountOut: quoteResponse.feeAmountOut,
        feeReceiver: "0x0000000000000000000000000000000000000000",
      }

      console.log("📋 Swap params:", swapParams)

      // Tentar métodos do SwapHelper
      const swapMethods = [
        { name: "swap", params: [swapParams] },
        { name: "submitSwapTokensForTokens", params: [swapParams] },
        { name: "executeSwap", params: [params] },
      ]

      let txHash = null

      for (const method of swapMethods) {
        if (typeof this.swapHelper[method.name] === "function") {
          try {
            console.log(`🔄 Trying swapHelper.${method.name}...`)
            txHash = await this.swapHelper[method.name](...method.params)
            console.log(`✅ swapHelper.${method.name} succeeded!`)
            break
          } catch (methodError) {
            console.log(`❌ swapHelper.${method.name} failed:`, methodError.message)
          }
        }
      }

      if (!txHash) {
        const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
        throw new Error(`All swap methods failed. Available methods: ${availableMethods.join(", ")}`)
      }

      // Extrair hash da transação
      let finalTxHash = null
      if (typeof txHash === "string") {
        finalTxHash = txHash
      } else if (txHash && txHash.hash) {
        finalTxHash = txHash.hash
      } else if (txHash && txHash.transactionHash) {
        finalTxHash = txHash.transactionHash
      }

      if (!finalTxHash || !finalTxHash.startsWith("0x")) {
        throw new Error("Invalid transaction hash received")
      }

      console.log("✅ REAL SDK swap executed successfully!")
      console.log("📋 Transaction hash:", finalTxHash)
      return finalTxHash
    } catch (error) {
      console.error("❌ REAL SDK swap failed:", error)
      throw new Error(`Real SDK swap failed: ${error.message}`)
    }
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
    console.log(`📜 Getting transaction history for: ${walletAddress}`)
    return []
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

  getSupportedTokens() {
    return SUPPORTED_TOKENS
  }

  isInitialized(): boolean {
    return this.initialized
  }

  isNetworkReady(): boolean {
    return this.networkReady
  }

  getClient() {
    return this.client
  }

  getProvider() {
    return this.provider
  }

  getTokenProvider() {
    return this.tokenProvider
  }

  getQuoter() {
    return this.quoter
  }

  getSwapHelper() {
    return this.swapHelper
  }

  getSDKStatus() {
    return {
      initialized: this.initialized,
      networkReady: this.networkReady,
      hasProvider: !!this.provider,
      hasClient: !!this.client,
      hasTokenProvider: !!this.tokenProvider,
      hasQuoter: !!this.quoter,
      hasSwapHelper: !!this.swapHelper,
      hasMulticall3: !!this.multicall3,
      hasGlobalConfig: !!this.config?.client,
      sdkType: "REAL HOLDSTATION SDK",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  async debugSDK() {
    try {
      await this.initialize()

      console.log("=== REAL HOLDSTATION SDK DEBUG ===")
      console.log("Status:", this.getSDKStatus())

      const components = [
        { name: "Provider", obj: this.provider },
        { name: "Client", obj: this.client },
        { name: "TokenProvider", obj: this.tokenProvider },
        { name: "Quoter", obj: this.quoter },
        { name: "SwapHelper", obj: this.swapHelper },
        { name: "Multicall3", obj: this.multicall3 },
      ]

      for (const component of components) {
        if (component.obj) {
          console.log(`${component.name} Methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(component.obj)))
        }
      }

      console.log("=== END REAL SDK DEBUG ===")
      return this.getSDKStatus()
    } catch (error) {
      console.error("Real SDK debug failed:", error)
      return { error: error.message }
    }
  }
}

console.log("✅ REAL HoldstationService class defined")

export const holdstationService = new HoldstationService()

console.log("✅ REAL holdstationService instance created")
console.log("🎯 REAL HOLDSTATION SERVICE - READY")
