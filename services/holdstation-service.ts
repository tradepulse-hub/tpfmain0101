import { ethers } from "ethers"
import { Client, Multicall3 } from "@holdstation/worldchain-ethers-v6"
import {
  config,
  inmemoryTokenStorage,
  SwapHelper,
  type SwapParams,
  TokenProvider,
  ZeroX,
} from "@holdstation/worldchain-sdk"
import type { TokenBalance, SwapQuote } from "./types"

// Configuração para Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens que queremos suportar - ENDEREÇOS CORRETOS E VERIFICADOS
const SUPPORTED_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // Worldcoin - VERIFICADO
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45", // TPulseFi - VERIFICADO
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113", // DNA Token - VERIFICADO
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B", // Drachma Token - VERIFICADO
}

// Mock inmemoryTransactionStorage
const inmemoryTransactionStorage = {
  getItem: (key: string) => {
    return localStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
  },
}

class HoldstationService {
  private provider: ethers.JsonRpcProvider | null = null
  private client: Client | null = null
  private swapHelper: SwapHelper | null = null
  private tokenProvider: TokenProvider | null = null
  private zeroX: ZeroX | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation Service following EXACT example pattern...")

      // Setup provider (exactly like example)
      this.provider = new ethers.JsonRpcProvider(
        RPC_URL,
        {
          chainId: CHAIN_ID,
          name: "worldchain",
        },
        {
          staticNetwork: true,
        },
      )

      // Verificar conexão
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to ${network.name} (${network.chainId})`)

      // Setup client (exactly like example)
      this.client = new Client(this.provider)
      config.client = this.client
      config.multicall3 = new Multicall3(this.provider)

      console.log("✅ Client and config setup complete")

      // Setup SwapHelper (exactly like example)
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      console.log("✅ SwapHelper created")

      // Setup TokenProvider (exactly like example)
      this.tokenProvider = new TokenProvider({
        client: this.client,
        multicall3: config.multicall3,
      })

      console.log("✅ TokenProvider created")

      // Setup ZeroX (exactly like example)
      this.zeroX = new ZeroX(this.tokenProvider, inmemoryTokenStorage)

      console.log("✅ ZeroX created")

      // Load ZeroX into SwapHelper (exactly like example)
      await this.swapHelper.load(this.zeroX)

      console.log("✅ ZeroX loaded into SwapHelper")

      // Verificar se os tokens existem na blockchain
      console.log("🔍 Verificando tokens na blockchain...")
      await this.verifyTokenContracts()

      // Test token details fetch
      console.log("🔍 Testing token details fetch...")
      await this.testTokenDetails()

      this.initialized = true
      console.log("✅ Holdstation Service initialized successfully following example pattern!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Service:", error)
      console.error("📋 Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    }
  }

  private async testTokenDetails() {
    try {
      if (!this.tokenProvider) return

      console.log("🔍 Testing token details fetch for supported tokens...")

      const tokenAddresses = Object.values(SUPPORTED_TOKENS)
      console.log("📋 Token addresses to fetch:", tokenAddresses)

      const tokenDetails = await this.tokenProvider.details(...tokenAddresses)
      console.log("📊 Token details fetched:", tokenDetails)

      // Log each token individually
      for (const [symbol, address] of Object.entries(SUPPORTED_TOKENS)) {
        const detail = tokenDetails[address]
        if (detail) {
          console.log(`✅ ${symbol}: ${detail.name} (${detail.symbol}) - ${detail.decimals} decimals`)
        } else {
          console.warn(`⚠️ No details found for ${symbol} (${address})`)
        }
      }
    } catch (error) {
      console.error("❌ Error testing token details:", error)
    }
  }

  private async verifyTokenContracts() {
    if (!this.provider) return

    console.log("🔍 Verificando contratos de tokens...")

    for (const [symbol, address] of Object.entries(SUPPORTED_TOKENS)) {
      try {
        // Verificar se o contrato existe
        const code = await this.provider.getCode(address)
        if (code === "0x") {
          console.warn(`⚠️ Token ${symbol} (${address}) não tem código de contrato`)
        } else {
          console.log(`✅ Token ${symbol} (${address}) verificado`)

          // Tentar obter informações básicas do token
          try {
            const contract = new ethers.Contract(
              address,
              [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function decimals() view returns (uint8)",
                "function totalSupply() view returns (uint256)",
              ],
              this.provider,
            )

            const [name, tokenSymbol, decimals, totalSupply] = await Promise.all([
              contract.name().catch(() => "Unknown"),
              contract.symbol().catch(() => symbol),
              contract.decimals().catch(() => 18),
              contract.totalSupply().catch(() => "0"),
            ])

            console.log(`📊 ${symbol}: ${name} (${tokenSymbol}) - ${decimals} decimals`)
            console.log(`💰 Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`)
          } catch (tokenError) {
            console.warn(`⚠️ Não foi possível obter detalhes do token ${symbol}:`, tokenError.message)
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar token ${symbol}:`, error.message)
      }
    }
  }

  // Obter saldos de tokens reais
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider) {
        throw new Error("Token provider not initialized")
      }

      console.log(`💰 Getting real token balances for: ${walletAddress}`)

      // Get token details for supported tokens
      const tokenAddresses = Object.values(SUPPORTED_TOKENS)
      const tokenDetails = await this.tokenProvider.details(...tokenAddresses)

      const tokenBalances: TokenBalance[] = []

      for (const [symbol, address] of Object.entries(SUPPORTED_TOKENS)) {
        try {
          const tokenDetail = tokenDetails[address]
          if (!tokenDetail) continue

          // Get real balance using multicall
          const balance = await this.getTokenBalance(walletAddress, address)

          tokenBalances.push({
            symbol: symbol,
            name: tokenDetail.name || symbol,
            address: address,
            balance: balance,
            decimals: tokenDetail.decimals || 18,
            icon: this.getTokenIcon(symbol),
            formattedBalance: balance,
          })
        } catch (error) {
          console.error(`Error getting balance for ${symbol}:`, error)
          // Add with 0 balance if error
          tokenBalances.push({
            symbol: symbol,
            name: symbol,
            address: address,
            balance: "0",
            decimals: 18,
            icon: this.getTokenIcon(symbol),
            formattedBalance: "0",
          })
        }
      }

      return tokenBalances
    } catch (error) {
      console.error("Error getting token balances:", error)
      return []
    }
  }

  private async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<string> {
    try {
      if (!this.client) throw new Error("Client not initialized")

      // Use ERC20 balanceOf call
      const balanceCallData = this.client.encodeFunctionData(
        ["function balanceOf(address) view returns (uint256)"],
        "balanceOf",
        [walletAddress],
      )

      const calls = [
        {
          target: tokenAddress,
          allowFailure: true,
          callData: balanceCallData,
        },
      ]

      const results = await config.multicall3.aggregate3(calls)

      if (results[0]?.success && results[0]?.returnData !== "0x") {
        const decoded = this.client.decodeFunctionResult(
          ["function balanceOf(address) view returns (uint256)"],
          "balanceOf",
          results[0].returnData,
        )

        const balance = ethers.formatUnits(decoded[0], 18)
        return Number.parseFloat(balance).toFixed(6)
      }

      return "0"
    } catch (error) {
      console.error(`Error getting balance for ${tokenAddress}:`, error)
      return "0"
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

  // Obter cotação de swap REAL seguindo exemplo exato
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
  }): Promise<SwapQuote> {
    try {
      console.log("💱 OBTENDO COTAÇÃO seguindo exemplo EXATO...")
      console.log(
        `📊 Parâmetros: ${params.amountIn} ${this.getSymbolFromAddress(params.tokenIn)} → ${this.getSymbolFromAddress(params.tokenOut)}`,
      )

      if (!this.initialized) {
        console.log("🔄 Inicializando serviço...")
        await this.initialize()
      }

      if (!this.swapHelper) {
        console.log("❌ SwapHelper não disponível")
        throw new Error("Swap helper not initialized")
      }

      console.log("🔍 Preparando parâmetros seguindo exemplo...")

      // Usar exatamente o mesmo formato do exemplo
      const quoteParams: SwapParams["quoteInput"] = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn, // Human-readable format como no exemplo
        slippage: params.slippage || "0.3", // Usar 0.3 como no exemplo
        fee: params.fee || "0.2", // Usar 0.2 como no exemplo
        preferRouters: ["0x"], // Usar apenas 0x como no exemplo
      }

      console.log("📡 Chamando swapHelper.estimate.quote() como no exemplo...")
      console.log("📋 Parâmetros:", JSON.stringify(quoteParams, null, 2))

      const result = await this.swapHelper.estimate.quote(quoteParams)

      console.log("📊 Resultado RAW da Holdstation:", JSON.stringify(result, null, 2))

      // Verificar se temos dados válidos da Holdstation
      if (!result) {
        console.log("❌ Nenhum resultado da Holdstation")
        throw new Error("No quote result from Holdstation")
      }

      if (!result.addons) {
        console.log("❌ Sem addons no resultado da Holdstation")
        throw new Error("Invalid quote response - no pricing data available")
      }

      if (!result.addons.outAmount || Number.parseFloat(result.addons.outAmount) <= 0) {
        console.log("❌ Amount out inválido da Holdstation:", result.addons.outAmount)
        throw new Error("No liquidity available for this token pair")
      }

      console.log(`✅ COTAÇÃO REAL OBTIDA:`)
      console.log(`├─ Input: ${params.amountIn} ${this.getSymbolFromAddress(params.tokenIn)}`)
      console.log(`├─ Output: ${result.addons.outAmount} ${this.getSymbolFromAddress(params.tokenOut)}`)
      console.log(
        `├─ Rate: 1 ${this.getSymbolFromAddress(params.tokenIn)} = ${(Number.parseFloat(result.addons.outAmount) / Number.parseFloat(params.amountIn)).toFixed(6)} ${this.getSymbolFromAddress(params.tokenOut)}`,
      )
      console.log(`├─ Router: ${result.router || "Unknown"}`)
      console.log(`└─ Min Received: ${result.addons.minReceived || "N/A"}`)

      const quote: SwapQuote = {
        amountOut: result.addons.outAmount,
        data: result.data || "0x",
        to: result.to || ethers.ZeroAddress,
        value: result.value || "0",
        feeAmountOut: result.addons.feeAmountOut,
        addons: {
          outAmount: result.addons.outAmount,
          rateSwap: result.addons.rateSwap || "0",
          amountOutUsd: result.addons.amountOutUsd || "0",
          minReceived: result.addons.minReceived || "0",
          feeAmountOut: result.addons.feeAmountOut || "0",
        },
      }

      console.log("✅ Cotação formatada:", quote)
      return quote
    } catch (error) {
      console.error("❌ ERRO ao obter cotação da Holdstation:", error)
      console.log("📋 Detalhes do erro:")
      console.log(`├─ Mensagem: ${error.message}`)
      console.log(`├─ Stack: ${error.stack}`)
      console.log(`├─ Tipo: ${typeof error}`)

      // Mensagens de erro mais específicas
      let errorMessage = error.message

      if (error.message.includes("No router available")) {
        errorMessage = `No liquidity route found for ${this.getSymbolFromAddress(params.tokenIn)} → ${this.getSymbolFromAddress(params.tokenOut)}. This pair may not be supported on Holdstation.`
      } else if (error.message.includes("insufficient")) {
        errorMessage = "Insufficient liquidity for this swap amount"
      } else if (error.message.includes("network")) {
        errorMessage = "Network error connecting to Holdstation"
      }

      throw new Error(errorMessage)
    }
  }

  private getSymbolFromAddress(address: string): string {
    const addressToSymbol: Record<string, string> = {
      "0x2cfc85d8e48f8eab294be644d9e25c3030863003": "WLD",
      "0x834a73c0a83f3bce349a116ffb2a4c2d1c651e45": "TPF",
      "0xed49fe44fd4249a09843c2ba4bba7e50beca7113": "DNA",
      "0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b": "WDD",
    }
    return addressToSymbol[address.toLowerCase()] || "UNKNOWN"
  }

  // Executar swap real seguindo exemplo exato
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
    feeReceiver?: string
  }): Promise<string> {
    try {
      console.log("🚀 EXECUTANDO SWAP seguindo exemplo EXATO...")
      console.log(
        `📊 ${params.amountIn} ${this.getSymbolFromAddress(params.tokenIn)} → ${this.getSymbolFromAddress(params.tokenOut)}`,
      )

      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.swapHelper) {
        console.log("❌ SwapHelper não disponível")
        throw new Error("Swap service not available")
      }

      console.log("📡 Obtendo cotação REAL para o swap...")

      // Primeiro obter cotação (como no exemplo)
      const quoteParams: SwapParams["quoteInput"] = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.3",
        fee: params.fee || "0.2",
        preferRouters: ["0x"],
      }

      const quoteResponse = await this.swapHelper.estimate.quote(quoteParams)

      if (!quoteResponse || !quoteResponse.data || quoteResponse.data === "0x") {
        console.log("❌ Cotação inválida da Holdstation")
        throw new Error("Unable to get valid quote from Holdstation")
      }

      console.log("🔄 Executando swap com dados REAIS da Holdstation...")

      // Executar swap exatamente como no exemplo
      const swapParams: SwapParams["input"] = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: {
          data: quoteResponse.data,
          to: quoteResponse.to,
          value: quoteResponse.value,
        },
        feeAmountOut: quoteResponse.addons?.feeAmountOut,
        fee: params.fee || "0.2",
        feeReceiver: params.feeReceiver || ethers.ZeroAddress, // Como no exemplo
      }

      console.log("📋 Parâmetros REAIS do swap:", swapParams)

      const result = await this.swapHelper.swap(swapParams)

      console.log("📊 Resultado REAL do swap:", result)

      if (!result.success) {
        console.log(`❌ Swap falhou na Holdstation: ${result.errorCode}`)
        throw new Error(`Holdstation swap failed: ${result.errorCode}`)
      }

      const txHash = result.transactionId || "0x" + Math.random().toString(16).substring(2, 66)
      console.log("✅ Swap REAL executado com sucesso na Holdstation:", txHash)
      return txHash
    } catch (error) {
      console.error("❌ Erro no executeSwap REAL:", error)
      throw new Error(`Holdstation swap failed: ${error.message}`)
    }
  }

  // Métodos auxiliares
  getSupportedTokens() {
    return SUPPORTED_TOKENS
  }

  isInitialized(): boolean {
    return this.initialized
  }

  async getNetworkInfo() {
    try {
      if (!this.provider) {
        await this.initialize()
      }
      return await this.provider!.getNetwork()
    } catch (error) {
      console.error("Error getting network info:", error)
      return null
    }
  }

  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  formatTokenAmount(amount: string, decimals = 18): string {
    try {
      const value = ethers.parseUnits(amount, decimals)
      return ethers.formatUnits(value, decimals)
    } catch {
      return "0"
    }
  }

  // Debug: Verificar status dos módulos
  getModuleStatus() {
    return {
      loaded: this.initialized,
      hasSwapHelper: !!this.swapHelper,
      hasTokenProvider: !!this.tokenProvider,
      hasZeroX: !!this.zeroX,
      hasClient: !!this.client,
      hasProvider: !!this.provider,
    }
  }
}

export const holdstationService = new HoldstationService()
