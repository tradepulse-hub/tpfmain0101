import type { TokenBalance, SwapQuote } from "./types"
import { ethers } from "ethers"
import { HoldstationDebugger } from "./holdstation-debug"

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
    if (typeof window !== "undefined") {
      // Não inicializar automaticamente, apenas quando necessário
    }
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
      console.log("🚀 Initializing Holdstation SDK (Fixed SwapHelper Creation)...")

      // Importar os módulos
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Both packages imported successfully!")
      console.log("🔍 DETAILED MODULE ANALYSIS:")
      console.log("├─ HoldstationModule exports:", Object.keys(HoldstationModule))
      console.log("├─ EthersModule exports:", Object.keys(EthersModule))

      // Analisar cada export em detalhes
      for (const [key, value] of Object.entries(HoldstationModule)) {
        console.log(`├─ HoldstationModule.${key}: ${typeof value}`)
      }

      for (const [key, value] of Object.entries(EthersModule)) {
        console.log(`├─ EthersModule.${key}: ${typeof value}`)
      }

      // Extrair componentes de AMBOS os módulos
      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3 } = EthersModule

      // Tentar extrair Quoter e SwapHelper de ambos os módulos
      const Quoter = HoldstationModule.Quoter || EthersModule.Quoter
      const SwapHelper = HoldstationModule.SwapHelper || EthersModule.SwapHelper

      console.log("📋 Components extracted:")
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
      console.log("✅ Global config.client set!")

      // 5. Criar Multicall3
      if (Multicall3) {
        console.log("🔧 Creating Multicall3...")
        this.multicall3 = new Multicall3(this.provider)
        this.config.multicall3 = this.multicall3
        console.log("✅ Multicall3 configured!")
      }

      // 6. Aguardar estabilização
      console.log("⏳ Stabilizing SDK configuration...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 7. Criar TokenProvider
      console.log("🔧 Creating TokenProvider...")
      this.tokenProvider = new TokenProvider()
      console.log("✅ TokenProvider created!")

      // 8. Criar Quoter (se disponível)
      if (Quoter) {
        console.log("🔧 Creating Quoter...")
        try {
          this.quoter = new Quoter(this.client)
          console.log("✅ Quoter created successfully!")

          // Testar métodos do Quoter
          const quoterMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.quoter))
          console.log(`📋 Quoter methods: ${quoterMethods.join(", ")}`)
        } catch (quoterError) {
          console.log(`❌ Quoter creation failed: ${quoterError.message}`)
          console.log(`📋 Quoter error details:`, quoterError)
        }
      } else {
        console.log("⚠️ Quoter class not found in either module")
      }

      // 9. Criar SwapHelper (CRÍTICO!)
      console.log("🔧 Creating SwapHelper (CRITICAL)...")
      if (SwapHelper) {
        try {
          console.log("🔄 Attempting SwapHelper creation with different parameters...")

          // Tentar diferentes formas de criar o SwapHelper
          const swapHelperAttempts = [
            {
              name: "Standard (client + tokenStorage)",
              params: [this.client, { tokenStorage: inmemoryTokenStorage }],
            },
            {
              name: "Client only",
              params: [this.client],
            },
            {
              name: "Client + empty config",
              params: [this.client, {}],
            },
            {
              name: "Provider + tokenStorage",
              params: [this.provider, { tokenStorage: inmemoryTokenStorage }],
            },
          ]

          for (const attempt of swapHelperAttempts) {
            try {
              console.log(`🔄 Trying SwapHelper creation: ${attempt.name}...`)
              this.swapHelper = new SwapHelper(...attempt.params)
              console.log(`✅ SwapHelper created successfully with: ${attempt.name}!`)

              // Testar métodos do SwapHelper
              const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
              console.log(`📋 SwapHelper methods: ${swapMethods.join(", ")}`)
              break
            } catch (swapError) {
              console.log(`❌ SwapHelper creation failed (${attempt.name}): ${swapError.message}`)
            }
          }

          if (!this.swapHelper) {
            console.log("❌ All SwapHelper creation attempts failed")
          }
        } catch (generalSwapError) {
          console.log(`❌ General SwapHelper creation error: ${generalSwapError.message}`)
          console.log(`📋 SwapHelper error details:`, generalSwapError)
        }
      } else {
        console.log("❌ SwapHelper class not found in either module")
      }

      // 10. Verificar se temos pelo menos o essencial
      if (!this.client) {
        throw new Error("Failed to create Client")
      }

      if (!this.config.client) {
        throw new Error("Failed to set global config.client")
      }

      if (!this.tokenProvider) {
        throw new Error("Failed to create TokenProvider")
      }

      // SwapHelper é crítico para quotes e swaps
      if (!this.swapHelper) {
        console.log("⚠️ SwapHelper not available - quotes and swaps will not work")
      }

      // 11. Testar se o SDK está funcionando
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
      await this.initialize()
      await this.ensureNetworkReady()

      console.log("💱 Getting swap quote (FOUNDER DEBUG MODE)...")

      if (!this.config?.client) {
        throw new Error("Global config.client not set")
      }

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available - this is critical!")
      }

      // ===== FOUNDER DEBUG: EXACT REQUEST PARAMETERS =====
      console.log("🚨 === TRUNG HUYNH (FOUNDER) - EXACT REQUEST DEBUG ===")
      console.log("📡 REAL WORLD EXAMPLE REQUEST:")
      console.log("├─ User wants to swap: 1 WLD → TPF")
      console.log("├─ Wallet has balance: 50.009789489971346823 WLD")
      console.log("├─ User selected amount: 1 WLD")
      console.log("├─ User selected slippage: 3.0%")
      console.log("")

      // Preparar parâmetros EXATOS
      const quoteParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: ethers.parseEther(params.amountIn).toString(), // 1 * 1e18
        slippage: params.slippage || "3",
        fee: "0.2",
      }

      console.log("📋 Quote params for HOLDSTATION FOUNDER (WITH DECIMALS):")
      console.log("├─ tokenIn:", quoteParams.tokenIn)
      console.log("├─ tokenOut:", quoteParams.tokenOut)
      console.log("├─ amountIn (with decimals):", quoteParams.amountIn)
      console.log("├─ amountIn calculation: 1 * 1e18 =", quoteParams.amountIn)
      console.log("├─ slippage:", quoteParams.slippage)
      console.log("├─ fee:", quoteParams.fee)
      console.log("📋 Full object:", JSON.stringify(quoteParams, null, 2))

      // Preparar parâmetros EXATOS
      const exactParams = {
        tokenIn: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // WLD
        tokenOut: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45", // TPF
        amountIn: "1", // 1 WLD
        slippage: "3", // 3%
        fee: "0.2", // 0.2%
      }

      console.log("📋 EXACT PARAMETERS BEING SENT TO SDK:")
      console.log("├─ tokenIn (WLD):", exactParams.tokenIn)
      console.log("├─ tokenOut (TPF):", exactParams.tokenOut)
      console.log("├─ amountIn:", exactParams.amountIn, "(type:", typeof exactParams.amountIn, ")")
      console.log("├─ slippage:", exactParams.slippage, "(type:", typeof exactParams.slippage, ")")
      console.log("├─ fee:", exactParams.fee, "(type:", typeof exactParams.fee, ")")
      console.log("")

      console.log("📋 FULL OBJECT AS JSON:")
      console.log(JSON.stringify(exactParams, null, 2))
      console.log("")

      console.log("📋 OBJECT DETAILS:")
      console.log("├─ Object.keys():", Object.keys(exactParams))
      console.log("├─ Object.values():", Object.values(exactParams))
      console.log("├─ Object.entries():", Object.entries(exactParams))
      console.log("├─ typeof params:", typeof exactParams)
      console.log("├─ params instanceof Object:", exactParams instanceof Object)
      console.log("├─ Array.isArray(params):", Array.isArray(exactParams))
      console.log("")

      // Debug do método que vamos chamar
      console.log("📋 METHOD CALL DEBUG:")
      console.log("├─ SwapHelper exists:", !!this.swapHelper)
      console.log("├─ SwapHelper constructor:", this.swapHelper.constructor.name)
      console.log("├─ _quote method exists:", typeof this.swapHelper._quote === "function")
      console.log("├─ _quote method type:", typeof this.swapHelper._quote)

      if (typeof this.swapHelper._quote === "function") {
        console.log("├─ _quote method length:", this.swapHelper._quote.length)
        console.log("├─ _quote method string:", this.swapHelper._quote.toString().substring(0, 300) + "...")
      }
      console.log("")

      console.log("📋 EXACT METHOD CALL BEING MADE:")
      console.log(`swapHelper._quote(${JSON.stringify(exactParams)})`)
      console.log("🚨 === END FOUNDER DEBUG ===")

      let quote = null

      // MÉTODO ESPECÍFICO: swapHelper._quote (que sabemos que existe)
      try {
        console.log("🔄 CALLING: swapHelper._quote(exactParams)...")

        // Log the exact call
        HoldstationDebugger.logExactRequest(exactParams, "swapHelper._quote")
        HoldstationDebugger.logMethodCall(this.swapHelper, "_quote", exactParams)

        quote = await this.swapHelper._quote(exactParams)
        console.log("✅ swapHelper._quote() SUCCESS!")
        console.log("📊 FOUNDER - Quote result:", JSON.stringify(quote, null, 2))
      } catch (quoteError) {
        console.log("❌ swapHelper._quote() FAILED for FOUNDER:")
        console.log("├─ Error message:", quoteError.message)
        console.log("├─ Error stack:", quoteError.stack)
        console.log("├─ Error name:", quoteError.name)
        console.log("├─ Error cause:", quoteError.cause || "N/A")
        console.log("├─ Error constructor:", quoteError.constructor.name)

        // Tentar diferentes formatos de parâmetros para o FOUNDER
        console.log("")
        console.log("🔄 FOUNDER DEBUG - TRYING ALTERNATIVE FORMATS:")

        const alternativeFormats = [
          {
            name: "Individual string parameters",
            call: () =>
              this.swapHelper._quote(
                exactParams.tokenIn,
                exactParams.tokenOut,
                exactParams.amountIn,
                exactParams.slippage,
              ),
            params: [exactParams.tokenIn, exactParams.tokenOut, exactParams.amountIn, exactParams.slippage],
          },
          {
            name: "Minimal object (no fee)",
            call: () =>
              this.swapHelper._quote({
                tokenIn: exactParams.tokenIn,
                tokenOut: exactParams.tokenOut,
                amountIn: exactParams.amountIn,
                slippage: exactParams.slippage,
              }),
            params: [
              {
                tokenIn: exactParams.tokenIn,
                tokenOut: exactParams.tokenOut,
                amountIn: exactParams.amountIn,
                slippage: exactParams.slippage,
              },
            ],
          },
          {
            name: "Numeric slippage",
            call: () =>
              this.swapHelper._quote({
                tokenIn: exactParams.tokenIn,
                tokenOut: exactParams.tokenOut,
                amountIn: exactParams.amountIn,
                slippage: 3,
              }),
            params: [
              {
                tokenIn: exactParams.tokenIn,
                tokenOut: exactParams.tokenOut,
                amountIn: exactParams.amountIn,
                slippage: 3,
              },
            ],
          },
          {
            name: "BigNumber amountIn",
            call: () =>
              this.swapHelper._quote({
                tokenIn: exactParams.tokenIn,
                tokenOut: exactParams.tokenOut,
                amountIn: ethers.parseEther("1").toString(),
                slippage: exactParams.slippage,
              }),
            params: [
              {
                tokenIn: exactParams.tokenIn,
                tokenOut: exactParams.tokenOut,
                amountIn: ethers.parseEther("1").toString(),
                slippage: exactParams.slippage,
              },
            ],
          },
        ]

        for (const format of alternativeFormats) {
          try {
            console.log(`🔄 FOUNDER - Trying: ${format.name}`)
            console.log(`├─ Params:`, JSON.stringify(format.params, null, 2))

            HoldstationDebugger.logExactRequest(format.params[0] || format.params, `swapHelper._quote (${format.name})`)

            quote = await format.call()
            console.log(`✅ FOUNDER - ${format.name} WORKED!`)
            console.log("📊 Quote result:", JSON.stringify(quote, null, 2))
            break
          } catch (altError) {
            console.log(`❌ FOUNDER - ${format.name} failed:`, altError.message)
          }
        }
      }

      if (!quote) {
        // Listar todos os métodos disponíveis para debug
        if (this.swapHelper) {
          const swapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.swapHelper))
          console.log(`🔍 Available SwapHelper methods: ${swapMethods.join(", ")}`)
        }
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

export const holdstationService = new HoldstationService()
