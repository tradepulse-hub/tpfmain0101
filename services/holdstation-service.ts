import { ethers } from "ethers"
import {
  TokenProvider,
  Sender,
  config,
  inmemoryTokenStorage,
  SwapHelper,
  type SwapParams,
} from "@holdstation/worldchain-sdk"
import { Client, Multicall3, Quoter } from "@holdstation/worldchain-ethers-v5"
import type { TokenBalance, SwapQuote } from "./types"

// Configuração exata conforme documentação
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens conhecidos na Worldchain
const KNOWN_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

class HoldstationService {
  private provider: ethers.providers.StaticJsonRpcProvider | null = null
  private client: Client | null = null
  private tokenProvider: TokenProvider | null = null
  private sender: Sender | null = null
  private swapHelper: SwapHelper | null = null
  private quoter: Quoter | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation Service...")

      // Setup exato conforme documentação
      this.provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      this.client = new Client(this.provider)
      config.client = this.client
      config.multicall3 = new Multicall3(this.provider)

      this.tokenProvider = new TokenProvider()
      this.quoter = new Quoter(this.client)

      this.sender = new Sender(this.provider)

      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to ${network.name} (${network.chainId})`)

      this.initialized = true
      console.log("✅ Holdstation Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Service:", error)
    }
  }

  // Obter detalhes de tokens conforme documentação
  async getTokenDetails(tokenAddresses: string[]): Promise<Record<string, any>> {
    try {
      if (!this.tokenProvider) {
        throw new Error("TokenProvider not initialized")
      }

      console.log("📋 Getting token details for:", tokenAddresses)
      const details = await this.tokenProvider.details(...tokenAddresses)
      console.log("Token details:", details)
      return details
    } catch (error) {
      console.error("Error getting token details:", error)
      return {}
    }
  }

  // Obter saldos de tokens
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider || !walletAddress) {
        throw new Error("TokenProvider not initialized or wallet address missing")
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      const tokenAddresses = Object.values(KNOWN_TOKENS)
      const tokenDetails = await this.tokenProvider.details(...tokenAddresses)

      // Para saldos, vamos usar uma implementação mock por enquanto
      // pois a documentação não especifica método de saldo no TokenProvider
      const tokenBalances: TokenBalance[] = []

      for (const address of tokenAddresses) {
        const details = tokenDetails[address]
        if (details) {
          // Mock balance - em produção você implementaria a lógica real
          const mockBalance = this.getMockBalance(details.symbol)

          tokenBalances.push({
            symbol: details.symbol,
            name: details.name,
            address: details.address,
            balance: mockBalance,
            decimals: details.decimals,
            icon: this.getTokenIcon(details.symbol),
            formattedBalance: mockBalance,
          })
        }
      }

      return tokenBalances.filter((token) => Number.parseFloat(token.balance) >= 0)
    } catch (error) {
      console.error("Error getting token balances:", error)
      return []
    }
  }

  // Obter cotação de swap conforme documentação
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
  }): Promise<SwapQuote> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.swapHelper) {
        throw new Error("SwapHelper not initialized")
      }

      console.log(`💱 Getting swap quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Parâmetros exatos conforme documentação SwapParams["quoteInput"]
      const quoteParams: SwapParams["quoteInput"] = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.3",
        fee: params.fee || "0.2",
      }

      const result = await this.swapHelper.quote(quoteParams)
      console.log("Quote result:", result)

      return {
        amountOut: result.amountOut || "0",
        data: result.data,
        to: result.to,
        value: result.value || "0",
        feeAmountOut: result.addons?.feeAmountOut,
        addons: result.addons,
      }
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  // Executar swap conforme documentação
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
    feeReceiver?: string
  }): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.swapHelper) {
        throw new Error("SwapHelper not initialized")
      }

      console.log("🚀 Executing swap...")

      // Primeiro obter a cotação
      const quote = await this.getSwapQuote(params)

      // Parâmetros exatos conforme documentação SwapParams["input"]
      const swapParams: SwapParams["input"] = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: {
          data: quote.data,
          to: quote.to,
          value: quote.value,
        },
        feeAmountOut: quote.feeAmountOut,
        fee: params.fee || "0.2",
        feeReceiver: params.feeReceiver || ethers.constants.AddressZero,
      }

      const result = await this.swapHelper.swap(swapParams)
      console.log("Swap result:", result)

      return result.hash || result.transactionHash || "0x"
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

  // Enviar tokens conforme documentação
  async sendToken(params: {
    to: string
    amount: number
    token?: string
  }): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.sender) {
        throw new Error("Sender not initialized")
      }

      console.log(`📤 Sending ${params.amount} tokens to ${params.to}`)

      // Parâmetros exatos conforme documentação
      const sendParams = {
        to: params.to,
        amount: params.amount,
        ...(params.token && { token: params.token }),
      }

      const result = await this.sender.send(sendParams)
      console.log("Send result:", result)

      return result.hash || result.transactionHash || "0x"
    } catch (error) {
      console.error("❌ Error sending token:", error)
      throw error
    }
  }

  // Métodos auxiliares
  private getMockBalance(symbol: string): string {
    const mockBalances: Record<string, string> = {
      TPF: "108567827.002",
      WLD: "42.67",
      DNA: "22765.884",
      WDD: "78.32",
    }
    return mockBalances[symbol] || "0"
  }

  private getTokenIcon(symbol: string): string {
    const icons: Record<string, string> = {
      TPF: "/logo-tpf.png",
      WLD: "/worldcoin.jpeg",
      DNA: "/dna-token.png",
      WDD: "/drachma-token.png",
    }
    return icons[symbol] || "/placeholder.svg?height=32&width=32"
  }

  getKnownTokens() {
    return KNOWN_TOKENS
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
}

export const holdstationService = new HoldstationService()
