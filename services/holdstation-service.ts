import { ethers } from "ethers"
import {
  TokenProvider,
  Sender,
  config,
  inmemoryTokenStorage,
  SwapHelper,
  type SwapParams,
  ZeroX,
} from "@holdstation/worldchain-sdk"
import { Client, Multicall3 } from "@holdstation/worldchain-ethers-v6"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens conhecidos na Worldchain
const KNOWN_TOKENS = {
  WETH: "0x4200000000000000000000000000000000000006",
  USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  CASH: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  decimals: number
  icon?: string
}

interface SwapQuote {
  amountOut: string
  data: string
  to: string
  value: string
  feeAmountOut?: string
}

class HoldstationService {
  private provider: ethers.JsonRpcProvider | null = null
  private client: Client | null = null
  private tokenProvider: TokenProvider | null = null
  private sender: Sender | null = null
  private swapHelper: SwapHelper | null = null
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
      console.log("🚀 Initializing Holdstation Service...")

      // Configurar provider conforme documentação
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

      // Configurar client e multicall3
      this.client = new Client(this.provider)
      config.client = this.client
      config.multicall3 = new Multicall3(this.provider)

      // Inicializar TokenProvider
      this.tokenProvider = new TokenProvider({
        client: this.client,
        multicall3: config.multicall3,
      })

      // Inicializar Sender
      this.sender = new Sender(this.provider)

      // Inicializar SwapHelper
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      // Inicializar ZeroX
      this.zeroX = new ZeroX(this.tokenProvider, inmemoryTokenStorage)
      this.swapHelper.load(this.zeroX)

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to ${network.name} (${network.chainId})`)

      this.initialized = true
      console.log("✅ Holdstation Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Service:", error)
    }
  }

  // ==================== TOKEN BALANCES ====================

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider || !walletAddress) {
        throw new Error("TokenProvider not initialized or wallet address missing")
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      // Obter todos os tokens da carteira
      const walletTokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log(`Found ${walletTokens.length} tokens in wallet`)

      if (walletTokens.length === 0) {
        // Se não encontrou tokens, usar tokens conhecidos
        const tokenAddresses = Object.values(KNOWN_TOKENS)
        return this.getBalancesForTokens(walletAddress, tokenAddresses)
      }

      return this.getBalancesForTokens(walletAddress, walletTokens)
    } catch (error) {
      console.error("Error getting token balances:", error)
      // Fallback para tokens conhecidos
      const tokenAddresses = Object.values(KNOWN_TOKENS)
      return this.getBalancesForTokens(walletAddress, tokenAddresses)
    }
  }

  private async getBalancesForTokens(walletAddress: string, tokenAddresses: string[]): Promise<TokenBalance[]> {
    try {
      // Obter detalhes dos tokens
      const tokenDetails = await this.tokenProvider!.details(...tokenAddresses)
      console.log("Token details:", tokenDetails)

      // Obter saldos
      const balances = await this.tokenProvider!.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })
      console.log("Token balances:", balances)

      // Processar resultados
      const tokenBalances: TokenBalance[] = []

      for (const address of tokenAddresses) {
        const details = tokenDetails[address]
        const balance = balances[address]

        if (details && balance !== undefined) {
          const formattedBalance = ethers.formatUnits(balance, details.decimals)

          tokenBalances.push({
            symbol: details.symbol,
            name: details.name,
            address: details.address,
            balance: formattedBalance,
            decimals: details.decimals,
            icon: this.getTokenIcon(details.symbol),
          })
        }
      }

      // Filtrar tokens com saldo > 0
      return tokenBalances.filter((token) => Number.parseFloat(token.balance) > 0)
    } catch (error) {
      console.error("Error processing token balances:", error)
      return []
    }
  }

  // ==================== SWAP FUNCTIONALITY ====================

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

      const quoteParams: SwapParams["quoteInput"] = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.3",
        fee: params.fee || "0.2",
        preferRouters: ["0x"],
      }

      const result = await this.swapHelper.estimate.quote(quoteParams)
      console.log("Swap quote result:", result)

      return {
        amountOut: result.amountOut || "0",
        data: result.data,
        to: result.to,
        value: result.value,
        feeAmountOut: result.addons?.feeAmountOut,
      }
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

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

      // Preparar parâmetros do swap
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
        feeReceiver: params.feeReceiver || ethers.ZeroAddress,
      }

      const result = await this.swapHelper.swap(swapParams)
      console.log("✅ Swap executed successfully:", result)

      return result.hash || result.transactionHash || "0x"
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

  // ==================== SEND FUNCTIONALITY ====================

  async sendToken(params: {
    to: string
    amount: number
    token?: string // Se omitido, envia ETH nativo
  }): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.sender) {
        throw new Error("Sender not initialized")
      }

      console.log(`📤 Sending ${params.amount} ${params.token || "ETH"} to ${params.to}`)

      const sendParams = {
        to: params.to,
        amount: params.amount,
        ...(params.token && { token: params.token }),
      }

      const result = await this.sender.send(sendParams)
      console.log("✅ Token sent successfully:", result)

      return result.hash || result.transactionHash || "0x"
    } catch (error) {
      console.error("❌ Error sending token:", error)
      throw error
    }
  }

  // ==================== UTILITY METHODS ====================

  async getTokenDetails(tokenAddresses: string[]): Promise<Record<string, any>> {
    try {
      if (!this.tokenProvider) {
        throw new Error("TokenProvider not initialized")
      }

      const details = await this.tokenProvider.details(...tokenAddresses)
      return details
    } catch (error) {
      console.error("Error getting token details:", error)
      return {}
    }
  }

  private getTokenIcon(symbol: string): string {
    const icons: Record<string, string> = {
      WETH: "/ethereum-abstract.png",
      USDCe: "/usdc-coins.png",
      TPF: "/logo-tpf.png",
      WLD: "/worldcoin.jpeg",
      DNA: "/dna-token.png",
      CASH: "/cash-token.png",
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

// Exportar instância única
export const holdstationService = new HoldstationService()
export type { TokenBalance, SwapQuote }
