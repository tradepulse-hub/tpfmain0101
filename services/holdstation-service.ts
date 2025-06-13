import { ethers } from "ethers"
import type { TokenBalance, SwapQuote } from "./types"

// Configuração para Worldchain
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
  private provider: ethers.JsonRpcProvider | null = null
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

      // Setup com ethers v6
      this.provider = new ethers.JsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to ${network.name} (${network.chainId})`)

      this.initialized = true
      console.log("✅ Holdstation Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Service:", error)
    }
  }

  // Obter saldos de tokens (mock por enquanto)
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      // Mock balances - em produção você implementaria a lógica real
      const tokenBalances: TokenBalance[] = [
        {
          symbol: "TPF",
          name: "TPulseFi",
          address: KNOWN_TOKENS.TPF,
          balance: "108567827.002",
          decimals: 18,
          icon: "/logo-tpf.png",
          formattedBalance: "108567827.002",
        },
        {
          symbol: "WLD",
          name: "Worldcoin",
          address: KNOWN_TOKENS.WLD,
          balance: "42.67",
          decimals: 18,
          icon: "/worldcoin.jpeg",
          formattedBalance: "42.67",
        },
        {
          symbol: "DNA",
          name: "DNA Token",
          address: KNOWN_TOKENS.DNA,
          balance: "22765.884",
          decimals: 18,
          icon: "/dna-token.png",
          formattedBalance: "22765.884",
        },
        {
          symbol: "WDD",
          name: "Drachma Token",
          address: KNOWN_TOKENS.WDD,
          balance: "78.32",
          decimals: 18,
          icon: "/drachma-token.png",
          formattedBalance: "78.32",
        },
      ]

      return tokenBalances.filter((token) => Number.parseFloat(token.balance) >= 0)
    } catch (error) {
      console.error("Error getting token balances:", error)
      return []
    }
  }

  // Obter cotação de swap (mock por enquanto)
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

      console.log(`💱 Getting swap quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Simular cotação - em produção você usaria a API real do Holdstation
      const amountInNum = Number.parseFloat(params.amountIn)
      const mockRate = 0.95 // Taxa de conversão mock
      const amountOut = (amountInNum * mockRate).toString()

      const quote: SwapQuote = {
        amountOut: amountOut,
        data: "0x", // Mock data
        to: "0x0000000000000000000000000000000000000000", // Mock address
        value: "0",
        feeAmountOut: (amountInNum * 0.003).toString(), // 0.3% fee
        addons: {
          outAmount: amountOut,
          rateSwap: mockRate.toString(),
          amountOutUsd: (amountInNum * mockRate * 1.2).toString(), // Mock USD value
          minReceived: (amountInNum * mockRate * 0.97).toString(), // With slippage
          feeAmountOut: (amountInNum * 0.003).toString(),
        },
      }

      console.log("Quote result:", quote)
      return quote
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  // Executar swap (mock por enquanto)
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

      console.log("🚀 Executing swap...")

      // Simular transação - em produção você usaria a API real do Holdstation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      console.log("Swap result:", mockTxHash)

      return mockTxHash
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

  // Enviar tokens (mock por enquanto)
  async sendToken(params: {
    to: string
    amount: number
    token?: string
  }): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`📤 Sending ${params.amount} tokens to ${params.to}`)

      // Simular transação - em produção você usaria a API real
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      console.log("Send result:", mockTxHash)

      return mockTxHash
    } catch (error) {
      console.error("❌ Error sending token:", error)
      throw error
    }
  }

  // Métodos auxiliares
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

  // Verificar se o endereço é válido
  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  // Formatar valor para exibição
  formatTokenAmount(amount: string, decimals = 18): string {
    try {
      const value = ethers.parseUnits(amount, decimals)
      return ethers.formatUnits(value, decimals)
    } catch {
      return "0"
    }
  }
}

export const holdstationService = new HoldstationService()
