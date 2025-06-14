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

console.log("🚀 HOLDSTATION SERVICE - VERSÃO ORIGINAL")

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

  constructor() {
    console.log("🔧 HoldstationService constructor")
    if (typeof window !== "undefined") {
      console.log("✅ Browser environment - initializing...")
      this.initialize()
    }
  }

  private async initialize() {
    try {
      console.log("🚀 Initializing Holdstation SDK...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log("✅ Provider connected:", network.name, network.chainId)
      this.networkReady = true

      // Importar módulos do SDK
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ SDK modules imported!")

      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3, Quoter, SwapHelper } = EthersModule

      // Configurar SDK
      this.config = config
      this.client = new Client(this.provider)
      this.config.client = this.client
      this.config.multicall3 = new Multicall3(this.provider)
      this.multicall3 = this.config.multicall3
      this.tokenProvider = new TokenProvider()

      // Criar SwapHelper
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      // Carregar módulos
      await this.swapHelper.load()

      // Criar Quoter
      this.quoter = new Quoter(this.client)

      this.initialized = true
      console.log("✅ Holdstation SDK initialized successfully!")
    } catch (error) {
      console.error("❌ Error initializing Holdstation SDK:", error)
      this.initialized = false
    }
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      console.log(`💰 Getting token balances for: ${walletAddress}`)

      if (!this.initialized || !this.tokenProvider) {
        throw new Error("SDK not initialized")
      }

      const balances = await this.tokenProvider.getTokenBalances(walletAddress)
      console.log("📊 Raw balances:", balances)

      return this.formatBalances(balances)
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      throw new Error(`Balance fetch failed: ${error.message}`)
    }
  }

  private formatBalances(balances: any): TokenBalance[] {
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

    return balances.map((balance: any) => ({
      symbol: balance.symbol,
      name: balance.name || balance.symbol,
      address: balance.address || balance.tokenAddress || "",
      balance: balance.balance || balance.amount || "0",
      decimals: balance.decimals || 18,
      icon: this.getTokenIcon(balance.symbol),
      formattedBalance: balance.formattedBalance || balance.balance || balance.amount || "0",
    }))
  }

  // Obter cotação de swap
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<SwapQuote> {
    try {
      console.log("🔄 Getting swap quote...")
      console.log("📊 Quote params:", params)

      if (!this.initialized || !this.swapHelper) {
        throw new Error("SDK not initialized")
      }

      const amountInWei = ethers.parseEther(params.amountIn).toString()
      const quoteParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: amountInWei,
        slippage: params.slippage || "3",
      }

      const quote = await this.swapHelper._quote(quoteParams)
      console.log("📊 Quote result:", quote)

      return {
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
    } catch (error) {
      console.error("❌ Error getting swap quote:", error)
      throw new Error(`Quote failed: ${error.message}`)
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
      console.log("🚀 Executing swap...")
      console.log("📊 Swap parameters:", params)

      if (!this.initialized || !this.swapHelper) {
        throw new Error("SDK not initialized")
      }

      const quoteResponse = await this.getSwapQuote(params)
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

      const txHash = await this.swapHelper.swap(swapParams)
      console.log("✅ Swap executed successfully!")
      console.log("📋 Transaction hash:", txHash)

      return typeof txHash === "string" ? txHash : txHash.hash || txHash.transactionHash
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw new Error(`Swap execution failed: ${error.message}`)
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
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  async debugSDK() {
    console.log("=== HOLDSTATION SDK DEBUG ===")
    console.log("Status:", this.getSDKStatus())
    console.log("=== END DEBUG ===")
    return this.getSDKStatus()
  }
}

console.log("✅ HoldstationService class defined")

export const holdstationService = new HoldstationService()

console.log("✅ holdstationService instance created")
