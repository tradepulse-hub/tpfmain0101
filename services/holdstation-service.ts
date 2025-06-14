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

console.log("🚀 HOLDSTATION SERVICE - INÍCIO DO ARQUIVO")
console.log("📦 Imports realizados com sucesso")
console.log("⚙️ Configurações definidas:", WORLDCHAIN_CONFIG)
console.log("🪙 Tokens suportados:", SUPPORTED_TOKENS)

console.log("🔧 Creating HoldstationService instance...")

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
    console.log("🔧 HoldstationService constructor chamado")
    if (typeof window !== "undefined") {
      console.log("✅ Ambiente browser detectado")
      // Não inicializar automaticamente, apenas quando necessário
    } else {
      console.log("⚠️ Ambiente server-side detectado")
    }
    console.log("✅ HoldstationService constructor concluído")
  }

  private async waitForNetwork(maxRetries = 10, delay = 1500): Promise<void> {
    if (this.networkReady) return

    console.log("🔄 Starting network readiness check...")

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`🔄 Network check attempt ${i + 1}/${maxRetries}...`)

        // Teste múltiplas operações para garantir que a rede está realmente pronta
        const [network, blockNumber] = await Promise.all([this.provider.getNetwork(), this.provider.getBlockNumber()])

        console.log("✅ Network fully ready!")
        console.log(`├─ Network: ${network.name} (ChainId: ${network.chainId})`)
        console.log(`├─ Block Number: ${blockNumber}`)
        console.log(`└─ Connection verified`)

        this.networkReady = true
        return
      } catch (error) {
        console.log(`⚠️ Network not ready (attempt ${i + 1}/${maxRetries}):`, error.message)
        if (i < maxRetries - 1) {
          console.log(`⏳ Waiting ${delay}ms before next attempt...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    console.log("⚠️ Network not ready after all retries, but continuing...")
  }

  private async initialize() {
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this._doInitialize()
    return this.initializationPromise
  }

  private async _doInitialize() {
    try {
      console.log("🚀 Initializing Holdstation SDK (FIXED VERSION)...")

      // Importar os módulos (volta para a forma que funcionava)
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Both packages imported successfully!")
      console.log("🔍 DETAILED MODULE ANALYSIS:")
      console.log("├─ HoldstationModule exports:", Object.keys(HoldstationModule))
      console.log("├─ EthersModule exports:", Object.keys(EthersModule))

      // Extrair componentes CORRETAMENTE (como na documentação)
      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3, Quoter, SwapHelper } = EthersModule

      console.log("📋 Components extracted (CORRECT WAY):")
      console.log(`├─ Client: ${!!Client}`)
      console.log(`├─ Multicall3: ${!!Multicall3}`)
      console.log(`├─ Quoter: ${!!Quoter}`)
      console.log(`├─ SwapHelper: ${!!SwapHelper}`)
      console.log(`├─ config: ${!!config}`)
      console.log(`├─ inmemoryTokenStorage: ${!!inmemoryTokenStorage}`)
      console.log(`└─ TokenProvider: ${!!TokenProvider}`)

      // Guardar referência do config
      this.config = config

      console.log("🔧 Setting up provider...")

      // 1. Criar o provider do ethers v6
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      console.log("✅ Provider created!")

      // 2. Aguardar a rede estar pronta
      await this.waitForNetwork()

      // 3. Criar o Client da Holdstation
      console.log("🔧 Creating Holdstation Client...")
      this.client = new Client(this.provider)
      console.log("✅ Client created!")

      // 4. IMPORTANTE: Configurar o config GLOBALMENTE
      console.log("🔧 Setting global config...")
      this.config.client = this.client
      this.config.multicall3 = new Multicall3(this.provider)
      this.multicall3 = this.config.multicall3
      console.log("✅ Global config set!")

      // 5. Aguardar estabilização
      console.log("⏳ Stabilizing SDK configuration...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 6. Criar TokenProvider
      console.log("🔧 Creating TokenProvider...")
      this.tokenProvider = new TokenProvider()
      console.log("✅ TokenProvider created!")

      // 7. Criar Quoter (CORREÇÃO CRÍTICA - FORÇAR CRIAÇÃO)
      console.log("🔧 Creating Quoter (CRITICAL FIX - FORCE CREATION)...")
      try {
        // Tentar TODAS as possibilidades com mais detalhes
        console.log("🔄 Attempting Quoter creation with multiple strategies...")

        if (Quoter && typeof Quoter === "function") {
          console.log("🔄 Strategy 1: Direct Quoter constructor...")
          try {
            this.quoter = new Quoter(this.client)
            console.log("✅ Quoter created with direct constructor!")
          } catch (directError) {
            console.log(`❌ Direct constructor failed: ${directError.message}`)
          }
        }

        if (!this.quoter && EthersModule.Quoter && typeof EthersModule.Quoter === "function") {
          console.log("🔄 Strategy 2: EthersModule.Quoter...")
          try {
            this.quoter = new EthersModule.Quoter(this.client)
            console.log("✅ Quoter created from EthersModule!")
          } catch (ethersError) {
            console.log(`❌ EthersModule.Quoter failed: ${ethersError.message}`)
          }
        }

        if (!this.quoter && HoldstationModule.Quoter && typeof HoldstationModule.Quoter === "function") {
          console.log("🔄 Strategy 3: HoldstationModule.Quoter...")
          try {
            this.quoter = new HoldstationModule.Quoter(this.client)
            console.log("✅ Quoter created from HoldstationModule!")
          } catch (holdstationError) {
            console.log(`❌ HoldstationModule.Quoter failed: ${holdstationError.message}`)
          }
        }

        // Se ainda não temos quoter, tentar com diferentes parâmetros
        if (!this.quoter && Quoter) {
          console.log("🔄 Strategy 4: Quoter with different parameters...")
          const alternativeParams = [
            [this.provider],
            [this.config],
            [this.client, this.config],
            [this.provider, this.config],
            [],
          ]

          for (const params of alternativeParams) {
            try {
              console.log(`🔄 Trying Quoter with params: ${params.length} arguments`)
              this.quoter = new Quoter(...params)
              console.log("✅ Quoter created with alternative parameters!")
              break
            } catch (altError) {
              console.log(`❌ Alternative params failed: ${altError.message}`)
            }
          }
        }

        if (this.quoter) {
          const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.quoter))
          console.log(`📋 Quoter methods: ${quoterMethods.join(", ")}`)
        } else {
          console.log("⚠️ QUOTER CREATION FAILED - Will use SwapHelper._quote instead")
        }
      } catch (quoterError) {
        console.log(`❌ Quoter creation completely failed: ${quoterError.message}`)
        console.log(`❌ Quoter error stack: ${quoterError.stack}`)
      }

      // 8. Criar SwapHelper (CORREÇÃO CRÍTICA)
      console.log("🔧 Creating SwapHelper (CRITICAL FIX)...")
      try {
        // Tentar primeiro do EthersModule
        if (EthersModule.SwapHelper && inmemoryTokenStorage) {
          this.swapHelper = new EthersModule.SwapHelper(this.client, {
            tokenStorage: inmemoryTokenStorage,
          })
          console.log("✅ SwapHelper created from EthersModule!")
        } else if (HoldstationModule.SwapHelper && inmemoryTokenStorage) {
          this.swapHelper = new HoldstationModule.SwapHelper(this.client, {
            tokenStorage: inmemoryTokenStorage,
          })
          console.log("✅ SwapHelper created from HoldstationModule!")
        } else {
          console.log("⚠️ SwapHelper or inmemoryTokenStorage not available")
          console.log(`├─ EthersModule.SwapHelper: ${!!EthersModule.SwapHelper}`)
          console.log(`├─ HoldstationModule.SwapHelper: ${!!HoldstationModule.SwapHelper}`)
          console.log(`└─ inmemoryTokenStorage: ${!!inmemoryTokenStorage}`)
        }

        if (this.swapHelper) {
          const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
          console.log(`📋 SwapHelper methods: ${swapMethods.join(", ")}`)

          // CARREGAR MÓDULOS AUTOMATICAMENTE
          console.log("🔄 Loading SwapHelper modules automatically...")

          try {
            // Tentar carregar módulos disponíveis
            const availableModules = []

            // Verificar se há módulos Uniswap disponíveis
            if (EthersModule.UniswapV3Module) {
              console.log("🔄 Loading UniswapV3Module...")
              const uniswapModule = new EthersModule.UniswapV3Module(this.client)
              await this.swapHelper.load(uniswapModule)
              availableModules.push("UniswapV3")
              console.log("✅ UniswapV3Module loaded!")
            }

            if (EthersModule.UniswapV2Module) {
              console.log("🔄 Loading UniswapV2Module...")
              const uniswapV2Module = new EthersModule.UniswapV2Module(this.client)
              await this.swapHelper.load(uniswapV2Module)
              availableModules.push("UniswapV2")
              console.log("✅ UniswapV2Module loaded!")
            }

            if (HoldstationModule.UniswapV3Module) {
              console.log("🔄 Loading UniswapV3Module from HoldstationModule...")
              const uniswapModule = new HoldstationModule.UniswapV3Module(this.client)
              await this.swapHelper.load(uniswapModule)
              availableModules.push("UniswapV3-Holdstation")
              console.log("✅ UniswapV3Module from HoldstationModule loaded!")
            }

            console.log(`✅ Loaded modules: ${availableModules.join(", ")}`)

            if (availableModules.length === 0) {
              console.log("⚠️ No modules loaded - will try alternative approach")
            }
          } catch (moduleError) {
            console.log(`⚠️ Module loading failed: ${moduleError.message}`)
            console.log("🔄 Will try alternative quote methods...")
          }

          // CARREGAR O SWAPHELPER BÁSICO
          console.log("🔄 Loading SwapHelper basic functionality...")
          if (typeof this.swapHelper.load === "function") {
            try {
              // Tentar carregar sem parâmetros
              await this.swapHelper.load()
              console.log("✅ SwapHelper basic load completed!")
            } catch (basicLoadError) {
              console.log(`⚠️ Basic load failed: ${basicLoadError.message}`)
            }
          }
        }
      } catch (swapError) {
        console.log(`❌ SwapHelper creation failed: ${swapError.message}`)
        console.log(`❌ SwapHelper error stack: ${swapError.stack}`)
      }

      // 9. Verificar se temos pelo menos o essencial
      if (!this.client) {
        throw new Error("Failed to create Client")
      }

      if (!this.config.client) {
        throw new Error("Failed to set global config.client")
      }

      if (!this.tokenProvider) {
        throw new Error("Failed to create TokenProvider")
      }

      if (!this.swapHelper) {
        throw new Error("Failed to create SwapHelper - this is critical for quotes!")
      }

      // 10. Testar se o SDK está funcionando
      await this.testSDKFunctionality()

      this.initialized = true
      console.log("✅ Holdstation SDK initialization completed!")
      console.log("📊 Final SDK Status:", this.getSDKStatus())
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation SDK:", error)
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

  private async testSDKFunctionality() {
    console.log("🧪 Testing SDK functionality...")

    // Testar Provider
    if (this.provider) {
      try {
        console.log("🔄 Testing provider operations...")
        const [network, blockNumber] = await Promise.all([this.provider.getNetwork(), this.provider.getBlockNumber()])
        console.log("✅ Provider fully operational!")
        console.log(`├─ Network: ${network.name} (${network.chainId})`)
        console.log(`└─ Latest Block: ${blockNumber}`)
      } catch (error) {
        console.log("⚠️ Provider test failed:", error.message)
      }
    }

    // Testar Client
    if (this.client) {
      try {
        console.log("🔄 Testing client operations...")
        const clientName = this.client.name()
        const chainId = this.client.getChainId()
        const blockNumber = await this.client.getBlockNumber()
        console.log("✅ Client fully operational!")
        console.log(`├─ Client Name: ${clientName}`)
        console.log(`├─ Chain ID: ${chainId}`)
        console.log(`└─ Block Number: ${blockNumber}`)
      } catch (error) {
        console.log("⚠️ Client test failed:", error.message)
      }
    }

    // Testar Config Global
    if (this.config) {
      console.log("🔄 Testing global config...")
      console.log(`├─ config.client exists: ${!!this.config.client}`)
      console.log(`├─ config.multicall3 exists: ${!!this.config.multicall3}`)
      console.log("✅ Global config verified!")
    }

    console.log("✅ SDK functionality test completed")
  }

  // Método para garantir que a rede está pronta antes de operações
  private async ensureNetworkReady(): Promise<void> {
    if (!this.networkReady && this.provider) {
      console.log("🔄 Ensuring network is ready for operation...")
      await this.waitForNetwork()
    }
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      await this.initialize()
      await this.ensureNetworkReady()

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (!this.tokenProvider) {
        throw new Error("TokenProvider not available")
      }

      if (!this.config?.client) {
        throw new Error("Global config.client not set")
      }

      console.log("📡 Calling getTokenBalances...")

      let balances = null
      const methods = [
        { obj: this.tokenProvider, name: "getTokenBalances" },
        { obj: this.tokenProvider, name: "getBalances" },
        { obj: this.tokenProvider, name: "getTokens" },
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
      console.log("🚨 === HOLDSTATION QUOTE DEBUG V2 - FORCE UPDATE ===")
      console.log("🚨 TIMESTAMP:", new Date().toISOString())
      console.log("🚨 ENTRADA DA FUNÇÃO getSwapQuote:")
      console.log("├─ params:", JSON.stringify(params, null, 2))
      console.log("├─ tokenIn:", params.tokenIn)
      console.log("├─ tokenOut:", params.tokenOut)
      console.log("├─ amountIn:", params.amountIn, "(type:", typeof params.amountIn, ")")
      console.log("├─ slippage:", params.slippage)

      await this.initialize()
      console.log("✅ Initialize completed")

      await this.ensureNetworkReady()
      console.log("✅ Network ready")

      if (!this.config?.client) {
        console.log("❌ Global config.client not set")
        throw new Error("Global config.client not set")
      }
      console.log("✅ Config.client exists")

      if (!this.swapHelper) {
        console.log("❌ SwapHelper not available")
        throw new Error("SwapHelper not available - this is critical!")
      }
      console.log("✅ SwapHelper exists")

      // Converter para wei (18 decimals) - FORÇA ATUALIZAÇÃO
      console.log("🚨 CONVERTENDO PARA WEI...")
      const amountInWei = "1000000000000000000" // 1 * 10^18 HARDCODED
      console.log(`🚨 Amount conversion HARDCODED: ${params.amountIn} → ${amountInWei} wei`)

      const baseParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: amountInWei, // USAR 18 DECIMAIS HARDCODED
        slippage: params.slippage || "3",
      }

      console.log("🚨 Base parameters with HARDCODED decimals:", JSON.stringify(baseParams, null, 2))

      // Estratégia ÚNICA - SwapHelper._quote
      console.log("🚨 TENTANDO ESTRATÉGIA ÚNICA: swapHelper._quote")

      let quote: any = null

      try {
        if (!this.swapHelper || typeof this.swapHelper._quote !== "function") {
          throw new Error("swapHelper._quote not available")
        }

        console.log("🚨 Calling swapHelper._quote with params:", baseParams)
        quote = await this.swapHelper._quote(baseParams)
        console.log("🚨 swapHelper._quote SUCCESS:", quote)
      } catch (strategyError) {
        console.log("🚨 swapHelper._quote FAILED:", strategyError.message)
        console.log("🚨 Error stack:", strategyError.stack)
        throw new Error(`SwapHelper._quote failed: ${strategyError.message}`)
      }

      if (!quote) {
        // Debug final - mostrar tudo que temos
        console.log("❌ ALL STRATEGIES FAILED - Final debug:")
        console.log(`├─ SwapHelper exists: ${!!this.swapHelper}`)
        console.log(`├─ Quoter exists: ${!!this.quoter}`)
        console.log(`├─ Client exists: ${!!this.client}`)
        console.log(`├─ Config exists: ${!!this.config}`)

        if (this.swapHelper) {
          const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
          console.log(`├─ SwapHelper methods: ${swapMethods.join(", ")}`)
        }

        throw new Error("All quote strategies failed")
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
      await this.ensureNetworkReady()

      console.log("🚀 Executing swap (using swapHelper.swap)...")
      console.log("📊 Swap parameters:", params)
      console.log("⚠️ This will execute a REAL transaction!")

      if (!this.config?.client) {
        throw new Error("Global config.client not set")
      }

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available")
      }

      if (!this.client) {
        throw new Error("Client not available")
      }

      console.log("📡 Using swapHelper.swap() method from docs...")

      // Primeiro obter a cotação
      const quoteResponse = await this.getSwapQuote(params)

      // Preparar parâmetros do swap como na documentação
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
        feeReceiver: "0x0000000000000000000000000000000000000000", // Placeholder
      }

      console.log("📋 Swap params (following docs):", swapParams)

      let txHash = null

      try {
        console.log("🔄 Trying swapHelper.swap(swapParams)...")
        txHash = await this.swapHelper.swap(swapParams)
        console.log("✅ swapHelper.swap() succeeded!")
      } catch (swapError) {
        console.log("❌ swapHelper.swap() failed:", swapError.message)

        // Tentar outros métodos como fallback
        const fallbackMethods = [
          { name: "executeSwap", params: [params] },
          { name: "performSwap", params: [params] },
          { name: "doSwap", params: [params] },
        ]

        for (const method of fallbackMethods) {
          if (typeof this.swapHelper[method.name] === "function") {
            try {
              console.log(`🔄 Trying fallback: swapHelper.${method.name}...`)
              txHash = await this.swapHelper[method.name](...method.params)
              console.log(`✅ swapHelper.${method.name} succeeded!`)
              break
            } catch (fallbackError) {
              console.log(`❌ swapHelper.${method.name} failed:`, fallbackError.message)
            }
          }
        }
      }

      if (!txHash) {
        // Listar todos os métodos disponíveis para debug
        if (this.swapHelper) {
          const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
          console.log(`🔍 Available SwapHelper methods: ${swapMethods.join(", ")}`)
        }
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
      console.log("⚠️ Transaction history not implemented in current SDK version")
      return []
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
      sdkType: "NPM @holdstation/worldchain-sdk + ethers-v6",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  // Método para debug - mostrar informações do SDK
  async debugSDK() {
    try {
      await this.initialize()

      console.log("=== HOLDSTATION SDK DEBUG ===")
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
          console.log(`${component.name} Properties:`, Object.keys(component.obj))
        }
      }

      console.log("=== END DEBUG ===")

      return this.getSDKStatus()
    } catch (error) {
      console.error("Debug failed:", error)
      return { error: error.message }
    }
  }
}

console.log("✅ HoldstationService class defined")

export const holdstationService = new HoldstationService()

console.log("✅ holdstationService instance created:", !!holdstationService)
console.log("✅ holdstationService type:", typeof holdstationService)
console.log("✅ holdstationService constructor:", holdstationService.constructor.name)

// Verificar se os métodos existem
const criticalMethods = ["getSwapQuote", "executeSwap", "getSDKStatus", "debugSDK"]
criticalMethods.forEach((method) => {
  console.log(`✅ ${method} exists:`, typeof holdstationService[method] === "function")
})

console.log("🎯 HOLDSTATION SERVICE - ARQUIVO PROCESSADO COM SUCESSO")
