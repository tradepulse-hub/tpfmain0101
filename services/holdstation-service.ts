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
  formattedBalance?: string
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

      this.client = new Client(this.provider)
      config.client = this.client
      config.multicall3 = new Multicall3(this.provider)

      this.tokenProvider = new TokenProvider({
        client: this.client,
        multicall3: config.multicall3,
      })

      this.sender = new Sender(this.provider)

      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      this.zeroX = new ZeroX(this.tokenProvider, inmemoryTokenStorage)
      this.swapHelper.load(this.zeroX)

      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to ${network.name} (${network.chainId})`)

      this.initialized = true
      console.log("✅ Holdstation Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Service:", error)
    }
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider || !walletAddress) {
        throw new Error("TokenProvider not initialized or wallet address missing")
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      const walletTokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log(`Found ${walletTokens.length} tokens in wallet`)

      if (walletTokens.length === 0) {
        const tokenAddresses = Object.values(KNOWN_TOKENS)
        return this.getBalancesForTokens(walletAddress, tokenAddresses)
      }

      return this.getBalancesForTokens(walletAddress, walletTokens)
    } catch (error) {
      console.error("Error getting token balances:", error)
      const tokenAddresses = Object.values(KNOWN_TOKENS)
      return this.getBalancesForTokens(walletAddress, tokenAddresses)
    }
  }

  private async getBalancesForTokens(walletAddress: string, tokenAddresses: string[]): Promise<TokenBalance[]> {
    try {
      const tokenDetails = await this.tokenProvider!.details(...tokenAddresses)
      const balances = await this.tokenProvider!.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })

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
            formattedBalance: formattedBalance,
          })
        }
      }

      return tokenBalances.filter((token) => Number.parseFloat(token.balance) > 0)
    } catch (error) {
      console.error("Error processing token balances:", error)
      return []
    }
  }

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

      const quote = await this.getSwapQuote(params)

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
      return result.hash || result.transactionHash || "0x"
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

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

      const sendParams = {
        to: params.to,
        amount: params.amount,
        ...(params.token && { token: params.token }),
      }

      const result = await this.sender.send(sendParams)
      return result.hash || result.transactionHash || "0x"
    } catch (error) {
      console.error("❌ Error sending token:", error)
      throw error
    }
  }

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

// Enhanced Token Service
class EnhancedTokenService {
  private holdstationService: HoldstationService

  constructor(holdstationService: HoldstationService) {
    this.holdstationService = holdstationService
  }

  async getTokensInfo(tokenAddresses: string[]): Promise<Record<string, any>> {
    try {
      return await this.holdstationService.getTokenDetails(tokenAddresses)
    } catch (error) {
      console.error("Error getting token info:", error)
      return {}
    }
  }

  async getAllTokenBalances(walletAddress: string): Promise<Record<string, string>> {
    try {
      const balances = await this.holdstationService.getTokenBalances(walletAddress)
      return balances.reduce((acc: Record<string, string>, token: TokenBalance) => {
        acc[token.symbol] = token.balance
        return acc
      }, {})
    } catch (error) {
      console.error("Error getting all token balances:", error)
      return {}
    }
  }

  async getTokenBalance(walletAddress: string, tokenSymbol: string): Promise<string> {
    try {
      const balances = await this.getAllTokenBalances(walletAddress)
      return balances[tokenSymbol] || "0"
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} balance:`, error)
      return "0"
    }
  }

  getTokenInfo(tokenSymbol: string): any {
    const tokenAddresses = this.holdstationService.getKnownTokens()
    const tokenAddress = Object.entries(tokenAddresses).find(([key]) => key === tokenSymbol)?.[1]

    if (!tokenAddress) return null

    return {
      symbol: tokenSymbol,
      address: tokenAddress,
      name: this.getTokenName(tokenSymbol),
      decimals: 18,
      logo: this.getTokenIcon(tokenSymbol),
    }
  }

  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      WETH: "Wrapped Ether",
      USDCe: "USD Coin (Bridged)",
      TPF: "TPulseFi",
      WLD: "Worldcoin",
      DNA: "DNA Token",
      CASH: "Cash Token",
      WDD: "Drachma Token",
    }
    return names[symbol] || symbol
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

  isInitialized(): boolean {
    return this.holdstationService.isInitialized()
  }
}

// Swap Service
class SwapService {
  private holdstationService: HoldstationService

  constructor(holdstationService: HoldstationService) {
    this.holdstationService = holdstationService
  }

  async getQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<SwapQuote> {
    try {
      return await this.holdstationService.getSwapQuote(params)
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    amountOutMinimum?: string
    recipient?: string
    slippage?: number
  }): Promise<string> {
    try {
      return await this.holdstationService.executeSwap({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage?.toString() || "0.5",
      })
    } catch (error) {
      console.error("Error executing swap:", error)
      throw error
    }
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      return await this.holdstationService.getTokenBalances(walletAddress)
    } catch (error) {
      console.error("Error getting token balances:", error)
      return []
    }
  }

  getTokens() {
    const knownTokens = this.holdstationService.getKnownTokens()
    const tokens: Record<string, any> = {}

    for (const [symbol, address] of Object.entries(knownTokens)) {
      tokens[symbol] = {
        symbol,
        address,
        name: this.getTokenName(symbol),
        icon: this.getTokenIcon(symbol),
      }
    }

    return tokens
  }

  private getTokenName(symbol: string): string {
    const names: Record<string, string> = {
      WETH: "Wrapped Ether",
      USDCe: "USD Coin (Bridged)",
      TPF: "TPulseFi",
      WLD: "Worldcoin",
      DNA: "DNA Token",
      CASH: "Cash Token",
      WDD: "Drachma Token",
    }
    return names[symbol] || symbol
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

  isInitialized(): boolean {
    return this.holdstationService.isInitialized()
  }
}

// Criar instâncias
export const holdstationService = new HoldstationService()
export const enhancedTokenService = new EnhancedTokenService(holdstationService)
export const swapService = new SwapService(holdstationService)

// Exportar tipos
export type { TokenBalance, SwapQuote }
