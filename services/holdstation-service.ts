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

class HoldstationService {
  private client: any = null
  private multicall3: any = null
  private tokenProvider: any = null
  private quoter: any = null
  private swapHelper: any = null
  private provider: any = null
  private networkReady = false
  private initialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== "undefined") {
      // Não inicializar automaticamente, apenas quando necessário
    }
  }

  private async waitForNetwork(maxRetries = 15, delay = 2000): Promise<void> {
    if (this.networkReady) return

    console.log("🔄 Starting network readiness check...")

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`🔄 Network check attempt ${i + 1}/${maxRetries}...`)

        // Teste múltiplas operações para garantir que a rede está realmente pronta
        const [network, blockNumber, balance] = await Promise.all([
          this.provider.getNetwork(),
          this.provider.getBlockNumber(),
          this.provider.getBalance("0x0000000000000000000000000000000000000000"),
        ])

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
      console.log("🚀 Initializing Holdstation SDK (Enhanced Network Setup)...")

      // Importar os módulos
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Both packages imported successfully!")
      console.log("SDK exports:", Object.keys(HoldstationModule))
      console.log("Ethers exports:", Object.keys(EthersModule))

      // Extrair as classes e configurações
      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3 } = EthersModule

      console.log("🔧 Setting up enhanced provider...")

      // 1. Criar o provider com configurações mais robustas
      this.provider = new ethers.JsonRpcProvider(
        WORLDCHAIN_CONFIG.rpcUrl,
        {
          chainId: WORLDCHAIN_CONFIG.chainId,
          name: WORLDCHAIN_CONFIG.name,
        },
        {
          // Configurações de polling mais agressivas
          pollingInterval: 1000,
          staticNetwork: ethers.Network.from({
            chainId: WORLDCHAIN_CONFIG.chainId,
            name: WORLDCHAIN_CONFIG.name,
          }),
        },
      )

      console.log("✅ Enhanced provider created!")

      // 2. Aguardar a rede estar completamente pronta
      await this.waitForNetwork()

      // 3. Configurar o config ANTES de criar o Client
      console.log("🔧 Pre-configuring SDK...")

      // Limpar configuração anterior se existir
      if (config.client) {
        console.log("🧹 Clearing previous config...")
        config.client = null
        config.multicall3 = null
      }

      // 4. Criar o Client da Holdstation
      console.log("🔧 Creating Holdstation Client...")
      this.client = new Client(this.provider)
      console.log("✅ Client created!")

      // 5. Configurar o config global
      config.client = this.client
      console.log("✅ Client set in global config!")

      // 6. Criar Multicall3
      if (Multicall3) {
        console.log("🔧 Creating Multicall3...")
        this.multicall3 = new Multicall3(this.provider)
        config.multicall3 = this.multicall3
        console.log("✅ Multicall3 configured!")
      }

      // 7. Aguardar um pouco para garantir que tudo está estável
      console.log("⏳ Stabilizing connections...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 8. Criar TokenProvider
      console.log("🔧 Creating TokenProvider...")
      this.tokenProvider = new TokenProvider()
      console.log("✅ TokenProvider created!")

      // 9. Tentar criar Quoter com retry
      console.log("🔧 Creating Quoter...")
      let quoterCreated = false
      const quoterAttempts = [
        () => (HoldstationModule.Quoter ? new HoldstationModule.Quoter(this.client) : null),
        () => (EthersModule.Quoter ? new EthersModule.Quoter(this.client) : null),
      ]

      for (const attempt of quoterAttempts) {
        try {
          const quoter = attempt()
          if (quoter) {
            this.quoter = quoter
            console.log("✅ Quoter created successfully!")
            quoterCreated = true
            break
          }
        } catch (error) {
          console.log("⚠️ Quoter attempt failed:", error.message)
        }
      }

      if (!quoterCreated) {
        console.log("⚠️ No Quoter could be created")
      }

      // 10. Criar SwapHelper com retry
      console.log("🔧 Creating SwapHelper...")
      let swapHelperCreated = false
      const swapHelperAttempts = [
        () =>
          HoldstationModule.SwapHelper
            ? new HoldstationModule.SwapHelper(this.client, {
                tokenStorage: inmemoryTokenStorage,
              })
            : null,
        () =>
          EthersModule.SwapHelper
            ? new EthersModule.SwapHelper(this.client, {
                tokenStorage: inmemoryTokenStorage,
              })
            : null,
      ]

      for (const attempt of swapHelperAttempts) {
        try {
          const swapHelper = attempt()
          if (swapHelper) {
            this.swapHelper = swapHelper
            console.log("✅ SwapHelper created successfully!")
            swapHelperCreated = true
            break
          }
        } catch (error) {
          console.log("⚠️ SwapHelper attempt failed:", error.message)
        }
      }

      if (!swapHelperCreated) {
        console.log("⚠️ No SwapHelper could be created")
      }

      // Verificar se temos pelo menos o essencial
      if (!this.client) {
        throw new Error("Failed to create Client")
      }

      if (!this.tokenProvider) {
        throw new Error("Failed to create TokenProvider")
      }

      // Testar se o SDK está funcionando
      await this.testSDKFunctionality()

      this.initialized = true
      console.log("✅ Holdstation SDK fully initialized and tested!")
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
      this.networkReady = false
      throw error
    }
  }

  private async testSDKFunctionality() {
    console.log("🧪 Testing SDK functionality...")

    // Testar Provider com operações reais
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

    // Listar métodos disponíveis
    const components = [
      { name: "Client", obj: this.client },
      { name: "TokenProvider", obj: this.tokenProvider },
      { name: "Quoter", obj: this.quoter },
      { name: "SwapHelper", obj: this.swapHelper },
      { name: "Multicall3", obj: this.multicall3 },
    ]

    for (const component of components) {
      if (component.obj) {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(component.obj))
        console.log(`📋 ${component.name} methods:`, methods.slice(0, 10)) // Limitar output
      }
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

      console.log("💱 Getting swap quote with enhanced network...")
      console.log("📊 Quote parameters:", params)

      if (!this.quoter && !this.swapHelper) {
        throw new Error("No quote provider available")
      }

      console.log("📡 Calling getSwapQuote with network verification...")

      // Verificar se a rede ainda está funcionando
      try {
        await this.provider.getBlockNumber()
        console.log("✅ Network verified before quote")
      } catch (error) {
        console.log("⚠️ Network issue detected, re-initializing...")
        this.networkReady = false
        await this.ensureNetworkReady()
      }

      let quote = null
      const methods = [
        { obj: this.quoter, name: "getQuote" },
        { obj: this.quoter, name: "quote" },
        { obj: this.swapHelper, name: "getQuote" },
        { obj: this.swapHelper, name: "getSwapQuote" },
        { obj: this.swapHelper, name: "quote" },
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
      await this.ensureNetworkReady()

      console.log("🚀 Executing swap with enhanced network...")
      console.log("📊 Swap parameters:", params)
      console.log("⚠️ This will execute a REAL transaction!")

      if (!this.swapHelper) {
        throw new Error("SwapHelper not available")
      }

      if (!this.client) {
        throw new Error("Client not available")
      }

      // Verificar se a rede ainda está funcionando
      try {
        await this.provider.getBlockNumber()
        console.log("✅ Network verified before swap")
      } catch (error) {
        console.log("⚠️ Network issue detected, re-initializing...")
        this.networkReady = false
        await this.ensureNetworkReady()
      }

      console.log("📡 Calling executeSwap...")

      let txHash = null
      const methods = [
        { obj: this.swapHelper, name: "executeSwap" },
        { obj: this.swapHelper, name: "swap" },
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
