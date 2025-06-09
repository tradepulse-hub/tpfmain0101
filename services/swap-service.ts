import { ethers } from "ethers"

// Holdstation SDK Imports
import { Client, Multicall3, Quoter, SwapHelper } from "@holdstation/worldchain-ethers-v5"
import { config, inmemoryTokenStorage, TokenProvider } from "@holdstation/worldchain-sdk"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens suportados
const TOKENS = {
  WLD: {
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    symbol: "WLD",
    name: "Worldcoin",
    decimals: 18,
    icon: "/worldcoin.jpeg",
  },
  TPF: {
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    symbol: "TPF",
    name: "TPulseFi",
    decimals: 18,
    icon: "/logo-tpf.png",
  },
  DNA: {
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    symbol: "DNA",
    name: "DNA Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
  WDD: {
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    symbol: "WDD",
    name: "WDD Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
  CASH: {
    address: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
    symbol: "CASH",
    name: "Cash Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
}

interface TokenBalance {
  symbol: keyof typeof TOKENS
  balance: string
  formattedBalance: string
}

// Classe para gerenciar o Holdstation SDK
class HoldstationSwapService {
  private provider: ethers.providers.StaticJsonRpcProvider | null = null
  private client: Client | null = null
  private multicall3: Multicall3 | null = null
  private tokenProvider: TokenProvider | null = null
  private quoter: Quoter | null = null
  private swapHelper: SwapHelper | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation SDK...")

      // Configurar provider
      this.provider = new ethers.providers.StaticJsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Inicializar componentes do Holdstation SDK
      this.client = new Client(this.provider)
      this.multicall3 = new Multicall3(this.provider)

      // Configurar SDK global
      config.client = this.client
      config.multicall3 = this.multicall3

      // Inicializar serviços
      this.tokenProvider = new TokenProvider()
      this.quoter = new Quoter(this.client)
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      console.log("✅ Holdstation SDK initialized successfully")
      this.initialized = true
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation SDK:", error)
      throw error
    }
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    if (!this.initialized) await this.initialize()

    const balances: TokenBalance[] = []

    for (const [symbol, token] of Object.entries(TOKENS)) {
      try {
        const contract = new ethers.Contract(
          token.address,
          ["function balanceOf(address) view returns (uint256)"],
          this.provider!,
        )

        const balance = await contract.balanceOf(walletAddress)
        const formattedBalance = ethers.utils.formatUnits(balance, token.decimals)

        balances.push({
          symbol: symbol as keyof typeof TOKENS,
          balance: balance.toString(),
          formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
        })
      } catch (error) {
        console.error(`Error getting balance for ${symbol}:`, error)
        balances.push({
          symbol: symbol as keyof typeof TOKENS,
          balance: "0",
          formattedBalance: "0.000000",
        })
      }
    }

    return balances
  }

  async getQuote(tokenIn: string, tokenOut: string, amountIn: string) {
    if (!this.initialized) await this.initialize()

    try {
      console.log(`💱 Getting quote: ${amountIn} ${tokenIn} → ${tokenOut}`)

      const tokenInAddress = TOKENS[tokenIn as keyof typeof TOKENS].address
      const tokenOutAddress = TOKENS[tokenOut as keyof typeof TOKENS].address

      // Usar SwapHelper para obter cotação
      const quoteParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn,
        slippage: "0.5", // 0.5% slippage
        fee: "0.0", // Sem taxa
      }

      const estimate = await this.swapHelper!.quote(quoteParams)
      console.log("✅ Quote estimate:", estimate)

      return estimate
    } catch (error) {
      console.error("❌ Error getting quote:", error)
      throw error
    }
  }

  async executeSwap(tokenIn: string, tokenOut: string, amountIn: string, quoteData: any, walletAddress: string) {
    if (!this.initialized) await this.initialize()

    try {
      console.log("🚀 Executing swap via Holdstation...")

      const tokenInAddress = TOKENS[tokenIn as keyof typeof TOKENS].address
      const tokenOutAddress = TOKENS[tokenOut as keyof typeof TOKENS].address

      // Preparar parâmetros do swap
      const swapParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn,
        tx: {
          data: quoteData.data,
          to: quoteData.to,
          value: quoteData.value || "0",
        },
        feeAmountOut: quoteData.addons?.feeAmountOut || "0",
        fee: "0.0",
        feeReceiver: ethers.constants.AddressZero,
      }

      // Verificar MiniKit
      if (typeof window === "undefined") {
        throw new Error("Window not available")
      }

      const MiniKit = (window as any).MiniKit
      if (!MiniKit?.isInstalled()) {
        throw new Error("MiniKit not available. Please use World App.")
      }

      // Executar swap via MiniKit
      console.log("📋 Swap transaction:", swapParams.tx)

      const result = await MiniKit.commandsAsync.sendTransaction({
        to: swapParams.tx.to,
        data: swapParams.tx.data,
        value: swapParams.tx.value,
      })

      if (!result.success) {
        throw new Error(`Swap transaction failed: ${result.error}`)
      }

      console.log("✅ Swap executed successfully:", result.transactionId)
      return result.transactionId
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

  // Métodos auxiliares
  getTokens() {
    return TOKENS
  }

  getSupportedTokens() {
    return Object.keys(TOKENS)
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

// Instância global do serviço
export const holdstationService = new HoldstationSwapService()
export type { TokenBalance }
