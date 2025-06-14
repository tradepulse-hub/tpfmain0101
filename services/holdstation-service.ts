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

console.log("🚀 HOLDSTATION SERVICE - REAL SDK APPROACH")

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
  private modules: any = {} // Armazenar módulos carregados

  constructor() {
    console.log("🔧 HoldstationService constructor - REAL SDK")
  }

  private async waitForNetwork(maxRetries = 10, delay = 1500): Promise<void> {
    if (this.networkReady) return

    console.log("🔄 Starting network readiness check...")

    for (let i = 0; i < maxRetries; i++) {
      try {
        const [network, blockNumber] = await Promise.all([this.provider.getNetwork(), this.provider.getBlockNumber()])
        console.log("✅ Network fully ready!")
        console.log(`├─ Network: ${network.name} (ChainId: ${network.chainId})`)
        console.log(`├─ Block Number: ${blockNumber}`)
        this.networkReady = true
        return
      } catch (error) {
        console.log(`⚠️ Network not ready (attempt ${i + 1}/${maxRetries}):`, error.message)
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
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
      console.log("🚀 REAL SDK INITIALIZATION - FIXING MODULE LOADING")

      // Importar os módulos
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Packages imported!")
      console.log("🔍 HoldstationModule exports:", Object.keys(HoldstationModule))
      console.log("🔍 EthersModule exports:", Object.keys(EthersModule))

      // Extrair componentes
      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3, Quoter, SwapHelper } = EthersModule

      // Verificar se temos módulos Uniswap
      console.log("🔍 CHECKING FOR UNISWAP MODULES:")
      console.log(`├─ EthersModule.UniswapV3Module: ${!!EthersModule.UniswapV3Module}`)
      console.log(`├─ EthersModule.UniswapV2Module: ${!!EthersModule.UniswapV2Module}`)
      console.log(`├─ HoldstationModule.UniswapV3Module: ${!!HoldstationModule.UniswapV3Module}`)
      console.log(`├─ HoldstationModule.UniswapV2Module: ${!!HoldstationModule.UniswapV2Module}`)

      this.config = config

      // 1. Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      await this.waitForNetwork()

      // 2. Criar Client
      this.client = new Client(this.provider)
      console.log("✅ Client created!")

      // 3. Configurar config global
      this.config.client = this.client
      this.config.multicall3 = new Multicall3(this.provider)
      this.multicall3 = this.config.multicall3

      // 4. Criar TokenProvider
      this.tokenProvider = new TokenProvider()

      // 5. Criar SwapHelper
      if (EthersModule.SwapHelper && inmemoryTokenStorage) {
        this.swapHelper = new EthersModule.SwapHelper(this.client, {
          tokenStorage: inmemoryTokenStorage,
        })
        console.log("✅ SwapHelper created!")
      }

      // 6. CRÍTICO: CARREGAR MÓDULOS UNISWAP CORRETAMENTE
      if (this.swapHelper) {
        console.log("🔧 LOADING UNISWAP MODULES - CRITICAL FIX")

        try {
          // Tentar carregar UniswapV3Module
          if (EthersModule.UniswapV3Module) {
            console.log("🔄 Loading UniswapV3Module from EthersModule...")
            const uniswapV3Module = new EthersModule.UniswapV3Module(this.client)
            await this.swapHelper.load(uniswapV3Module)
            this.modules.UniswapV3 = uniswapV3Module
            console.log("✅ UniswapV3Module loaded successfully!")
          }

          // Tentar carregar UniswapV2Module
          if (EthersModule.UniswapV2Module) {
            console.log("🔄 Loading UniswapV2Module from EthersModule...")
            const uniswapV2Module = new EthersModule.UniswapV2Module(this.client)
            await this.swapHelper.load(uniswapV2Module)
            this.modules.UniswapV2 = uniswapV2Module
            console.log("✅ UniswapV2Module loaded successfully!")
          }

          // Tentar módulos do HoldstationModule se os do EthersModule falharam
          if (Object.keys(this.modules).length === 0) {
            console.log("🔄 Trying modules from HoldstationModule...")

            if (HoldstationModule.UniswapV3Module) {
              console.log("🔄 Loading UniswapV3Module from HoldstationModule...")
              const uniswapV3Module = new HoldstationModule.UniswapV3Module(this.client)
              await this.swapHelper.load(uniswapV3Module)
              this.modules.UniswapV3 = uniswapV3Module
              console.log("✅ UniswapV3Module from HoldstationModule loaded!")
            }

            if (HoldstationModule.UniswapV2Module) {
              console.log("🔄 Loading UniswapV2Module from HoldstationModule...")
              const uniswapV2Module = new HoldstationModule.UniswapV2Module(this.client)
              await this.swapHelper.load(uniswapV2Module)
              this.modules.UniswapV2 = uniswapV2Module
              console.log("✅ UniswapV2Module from HoldstationModule loaded!")
            }
          }

          console.log(`📊 MODULES LOADED: ${Object.keys(this.modules).join(", ")}`)

          if (Object.keys(this.modules).length === 0) {
            console.log("❌ NO MODULES LOADED - This will cause 'No router available' error")

            // Tentar abordagem alternativa - verificar se há outros módulos
            console.log("🔍 SEARCHING FOR ANY AVAILABLE MODULES...")

            // Listar todos os exports que podem ser módulos
            const allEthersExports = Object.keys(EthersModule).filter((key) => key.includes("Module"))
            const allHoldstationExports = Object.keys(HoldstationModule).filter((key) => key.includes("Module"))

            console.log(`🔍 EthersModule modules: ${allEthersExports.join(", ")}`)
            console.log(`🔍 HoldstationModule modules: ${allHoldstationExports.join(", ")}`)

            // Tentar carregar qualquer módulo disponível
            for (const moduleName of allEthersExports) {
              try {
                console.log(`🔄 Trying to load ${moduleName}...`)
                const ModuleClass = EthersModule[moduleName]
                if (ModuleClass && typeof ModuleClass === "function") {
                  const moduleInstance = new ModuleClass(this.client)
                  await this.swapHelper.load(moduleInstance)
                  this.modules[moduleName] = moduleInstance
                  console.log(`✅ ${moduleName} loaded successfully!`)
                }
              } catch (moduleError) {
                console.log(`❌ Failed to load ${moduleName}: ${moduleError.message}`)
              }
            }

            for (const moduleName of allHoldstationExports) {
              try {
                console.log(`🔄 Trying to load ${moduleName} from HoldstationModule...`)
                const ModuleClass = HoldstationModule[moduleName]
                if (ModuleClass && typeof ModuleClass === "function") {
                  const moduleInstance = new ModuleClass(this.client)
                  await this.swapHelper.load(moduleInstance)
                  this.modules[moduleName] = moduleInstance
                  console.log(`✅ ${moduleName} from HoldstationModule loaded successfully!`)
                }
              } catch (moduleError) {
                console.log(`❌ Failed to load ${moduleName} from HoldstationModule: ${moduleError.message}`)
              }
            }

            console.log(`📊 FINAL MODULES LOADED: ${Object.keys(this.modules).join(", ")}`)
          }
        } catch (moduleLoadError) {
          console.log("❌ CRITICAL: Module loading completely failed:", moduleLoadError.message)
          console.log("❌ This will cause 'No router available' error in quotes")
        }

        // Verificar se SwapHelper tem módulos internos
        console.log("🔍 CHECKING SWAPHELPER INTERNAL STATE...")
        if (this.swapHelper.modules) {
          console.log(`📊 SwapHelper.modules: ${Object.keys(this.swapHelper.modules).join(", ")}`)
        } else {
          console.log("❌ SwapHelper.modules is undefined")
        }
      }

      // 7. Criar Quoter se possível
      if (Quoter) {
        try {
          this.quoter = new Quoter(this.client)
          console.log("✅ Quoter created!")
        } catch (quoterError) {
          console.log(`⚠️ Quoter creation failed: ${quoterError.message}`)
        }
      }

      // Verificações finais
      if (!this.client) throw new Error("Failed to create Client")
      if (!this.config.client) throw new Error("Failed to set global config.client")
      if (!this.tokenProvider) throw new Error("Failed to create TokenProvider")
      if (!this.swapHelper) throw new Error("Failed to create SwapHelper")

      this.initialized = true
      console.log("✅ REAL SDK initialization completed!")
      console.log("📊 Final status:", this.getSDKStatus())
      console.log("📊 Loaded modules:", Object.keys(this.modules))
    } catch (error) {
      console.error("❌ Failed to initialize REAL SDK:", error)
      this.initialized = false
      throw error
    }
  }

  private async ensureNetworkReady(): Promise<void> {
    if (!this.networkReady && this.provider) {
      await this.waitForNetwork()
    }
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      await this.initialize()
      await this.ensureNetworkReady()

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (!this.tokenProvider) {
        throw new Error("TokenProvider not available")
      }

      let balances = null
      const methods = [
        { obj: this.tokenProvider, name: "getTokenBalances" },
        { obj: this.tokenProvider, name: "getBalances" },
        { obj: this.tokenProvider, name: "getTokens" },
      ]

      for (const method of methods) {
        if (method.obj && typeof method.obj[method.name] === "function") {
          try {
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

      return formattedBalances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      throw new Error(`Balance fetch failed: ${error.message}`)
    }
  }

  // REAL QUOTE - COM MÓDULOS CARREGADOS
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<SwapQuote> {
    try {
      console.log("🎯 === REAL HOLDSTATION QUOTE - WITH MODULES ===")
      console.log("🎯 Timestamp:", new Date().toISOString())
      console.log("🎯 Params:", JSON.stringify(params, null, 2))

      await this.initialize()
      await this.ensureNetworkReady()

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available")
      }

      // Verificar se temos módulos carregados
      console.log("🔍 CHECKING LOADED MODULES:")
      console.log(`├─ Our modules: ${Object.keys(this.modules).join(", ")}`)

      if (this.swapHelper.modules) {
        console.log(`├─ SwapHelper modules: ${Object.keys(this.swapHelper.modules).join(", ")}`)
      } else {
        console.log(`├─ SwapHelper.modules: undefined`)
      }

      if (Object.keys(this.modules).length === 0) {
        throw new Error("No modules loaded - cannot get quotes")
      }

      // Converter para wei
      const amountInWei = ethers.parseEther(params.amountIn).toString()
      console.log(`💰 Amount conversion: ${params.amountIn} → ${amountInWei} wei`)

      const quoteParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: amountInWei,
        slippage: params.slippage || "3",
      }

      console.log("📋 Quote params:", JSON.stringify(quoteParams, null, 2))

      // Tentar obter cotação real
      console.log("🔄 Calling swapHelper._quote...")
      const quote = await this.swapHelper._quote(quoteParams)
      console.log("✅ REAL quote received:", quote)

      if (!quote || !quote.amountOut || Number.parseFloat(quote.amountOut) <= 0) {
        throw new Error("Invalid quote received from SDK")
      }

      // Normalizar cotação
      const normalizedQuote: SwapQuote = {
        amountOut: quote.amountOut || "0",
        data: quote.data || "0x",
        to: quote.to || "",
        value: quote.value || "0",
        feeAmountOut: quote.feeAmountOut || "0",
        addons: quote.addons || {
          outAmount: quote.amountOut || "0",
          rateSwap: quote.rate || "1",
          amountOutUsd: quote.amountOutUsd || "0",
          minReceived: quote.minReceived || "0",
          feeAmountOut: quote.feeAmountOut || "0",
        },
      }

      console.log("✅ REAL normalized quote:", normalizedQuote)
      return normalizedQuote
    } catch (error) {
      console.error("❌ REAL quote error:", error)
      throw new Error(`Real quote failed: ${error.message}`)
    }
  }

  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<string> {
    try {
      await this.initialize()
      await this.ensureNetworkReady()

      console.log("🚀 REAL SWAP EXECUTION")

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available")
      }

      // Primeiro obter cotação real
      const quoteResponse = await this.getSwapQuote(params)

      const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: {
          data: quoteResponse.data,
          to: quoteResponse.to,
        },
        fee: "0.2",
        feeAmountOut: quoteResponse.feeAmountOut,
        feeReceiver: "0x0000000000000000000000000000000000000000",
      }

      console.log("📋 REAL swap params:", swapParams)

      const txHash = await this.swapHelper.swap(swapParams)
      console.log("✅ REAL swap executed:", txHash)

      // Extrair hash
      let finalTxHash = null
      if (typeof txHash === "string") {
        finalTxHash = txHash
      } else if (txHash && txHash.hash) {
        finalTxHash = txHash.hash
      }

      if (!finalTxHash || !finalTxHash.startsWith("0x")) {
        throw new Error("Invalid transaction hash")
      }

      return finalTxHash
    } catch (error) {
      console.error("❌ REAL swap error:", error)
      throw new Error(`Real swap failed: ${error.message}`)
    }
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
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
      loadedModules: Object.keys(this.modules),
      moduleCount: Object.keys(this.modules).length,
      sdkType: "REAL NPM @holdstation/worldchain-sdk + ethers-v6",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  async debugSDK() {
    try {
      await this.initialize()
      return this.getSDKStatus()
    } catch (error) {
      return { error: error.message }
    }
  }
}

export const holdstationService = new HoldstationService()
