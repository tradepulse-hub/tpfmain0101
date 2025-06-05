import { ethers } from "ethers"
import { Client, Multicall3, Quoter, SwapHelper } from "@holdstation/worldchain-ethers-v5"
import { config, inmemoryTokenStorage, TokenProvider, Manager } from "@holdstation/worldchain-sdk"
import { Sender } from "@holdstation/worldchain-ethers-v5"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços de tokens conhecidos na Worldchain
const KNOWN_TOKENS = {
  WETH: "0x4200000000000000000000000000000000000006",
  USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
}

class HoldstationService {
  private provider: ethers.providers.StaticJsonRpcProvider | null = null
  private client: Client | null = null
  private multicall: Multicall3 | null = null
  private tokenProvider: TokenProvider | null = null
  private quoter: Quoter | null = null
  private swapHelper: SwapHelper | null = null
  private sender: Sender | null = null
  private historyManager: Manager | null = null
  private initialized = false

  constructor() {
    // Inicializar apenas no lado do cliente
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("Initializing REAL Holdstation SDK...")

      // Configurar provider para Worldchain usando ethers v5
      this.provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Verificar conexão
      const network = await this.provider.getNetwork()
      console.log("Connected to network:", network)

      // Inicializar cliente Holdstation
      this.client = new Client(this.provider)
      this.multicall = new Multicall3(this.provider)

      // Configurar SDK global
      config.client = this.client
      config.multicall3 = this.multicall

      // Inicializar providers
      this.tokenProvider = new TokenProvider()
      this.quoter = new Quoter(this.client)
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })
      this.sender = new Sender(this.provider)
      this.historyManager = new Manager(this.provider, CHAIN_ID)

      console.log("REAL Holdstation SDK initialized successfully")
      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize REAL Holdstation SDK:", error)
      // Não marcar como inicializado em caso de erro real
      throw error
    }
  }

  // Obter detalhes REAIS de tokens
  async getTokenDetails(tokenAddresses: string[]): Promise<Record<string, any>> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.tokenProvider) throw new Error("TokenProvider not initialized")

      console.log("Fetching REAL token details for:", tokenAddresses)

      // Usar a SDK real para obter detalhes
      const details = await this.tokenProvider.details(...tokenAddresses)

      console.log("REAL token details:", details)
      return details
    } catch (error) {
      console.error("Error fetching REAL token details:", error)
      throw error
    }
  }

  // Obter tokens REAIS de uma carteira
  async getWalletTokens(walletAddress: string): Promise<string[]> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.tokenProvider) throw new Error("TokenProvider not initialized")

      console.log("Fetching REAL tokens for wallet:", walletAddress)

      // Usar a SDK real para obter tokens da carteira
      const tokens = await this.tokenProvider.tokenOf(walletAddress)

      console.log("REAL wallet tokens:", tokens)
      return tokens
    } catch (error) {
      console.error("Error fetching REAL wallet tokens:", error)
      // Fallback para tokens conhecidos
      return Object.values(KNOWN_TOKENS)
    }
  }

  // Obter saldos REAIS de múltiplos tokens
  async getTokenBalances(walletAddress: string, tokenAddresses: string[]): Promise<Record<string, string>> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.tokenProvider) throw new Error("TokenProvider not initialized")

      console.log("Fetching REAL balances for:", { walletAddress, tokenAddresses })

      // Usar a SDK real para obter saldos
      const balances = await this.tokenProvider.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })

      console.log("REAL token balances:", balances)
      return balances
    } catch (error) {
      console.error("Error fetching REAL token balances:", error)
      throw error
    }
  }

  // Obter saldo REAL de um token específico
  async getSingleTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      if (!this.initialized) await this.initialize()

      const balances = await this.getTokenBalances(walletAddress, [tokenAddress])
      return balances[tokenAddress] || "0"
    } catch (error) {
      console.error("Error fetching REAL single token balance:", error)
      throw error
    }
  }

  // Obter cotação REAL para swap
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
  }): Promise<any> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.swapHelper) throw new Error("SwapHelper not initialized")

      console.log("Getting REAL swap quote:", params)

      // Usar a SDK real para obter cotação
      const quote = await this.swapHelper.quote({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.5",
        fee: params.fee || "0.0",
      })

      console.log("REAL swap quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting REAL swap quote:", error)
      throw error
    }
  }

  // Executar swap REAL
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    tx: any
    fee?: string
    feeAmountOut?: string
    feeReceiver?: string
  }): Promise<any> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.swapHelper) throw new Error("SwapHelper not initialized")

      console.log("Executing REAL swap:", params)

      // Usar a SDK real para executar swap
      const result = await this.swapHelper.swap({
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: params.tx,
        fee: params.fee || "0.0",
        feeAmountOut: params.feeAmountOut,
        feeReceiver: params.feeReceiver || ethers.constants.AddressZero,
      })

      console.log("REAL swap result:", result)
      return result
    } catch (error) {
      console.error("Error executing REAL swap:", error)
      throw error
    }
  }

  // Enviar tokens REAIS
  async sendToken(params: { to: string; amount: number; token?: string }): Promise<any> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.sender) throw new Error("Sender not initialized")

      console.log("Sending REAL token:", params)

      // Usar a SDK real para enviar tokens
      const result = await this.sender.send({
        to: params.to,
        amount: params.amount,
        token: params.token, // Se undefined, envia ETH nativo
      })

      console.log("REAL send result:", result)
      return result
    } catch (error) {
      console.error("Error sending REAL token:", error)
      throw error
    }
  }

  // Monitorar histórico REAL de transações
  async watchTransactionHistory(
    walletAddress: string,
    callback: () => void,
  ): Promise<{ start: () => Promise<void>; stop: () => void }> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.historyManager) throw new Error("History manager not initialized")

      console.log("Starting REAL transaction history monitoring for:", walletAddress)

      // Usar a SDK real para monitorar histórico
      const { start, stop } = await this.historyManager.watch(walletAddress, callback)

      return {
        start: async () => {
          await start()
          console.log("REAL transaction monitoring started")
        },
        stop: () => {
          stop()
          console.log("REAL transaction monitoring stopped")
        },
      }
    } catch (error) {
      console.error("Error watching REAL transaction history:", error)
      throw error
    }
  }

  // Obter histórico REAL de transações
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.historyManager) throw new Error("History manager not initialized")

      console.log("Fetching REAL transaction history:", { walletAddress, offset, limit })

      // Usar a SDK real para obter histórico
      const transactions = await this.historyManager.find(offset, limit)

      console.log("REAL transaction history:", transactions)
      return transactions
    } catch (error) {
      console.error("Error fetching REAL transaction history:", error)
      throw error
    }
  }

  // Obter cotação simples REAL
  async getSimpleQuote(tokenIn: string, tokenOut: string): Promise<any> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.quoter) throw new Error("Quoter not initialized")

      console.log("Getting REAL simple quote:", { tokenIn, tokenOut })

      const quote = await this.quoter.simple(tokenIn, tokenOut)

      console.log("REAL simple quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting REAL simple quote:", error)
      throw error
    }
  }

  // Obter cotação inteligente REAL
  async getSmartQuote(tokenIn: string, options: { slippage: number; deadline: number }): Promise<any> {
    try {
      if (!this.initialized) await this.initialize()
      if (!this.quoter) throw new Error("Quoter not initialized")

      console.log("Getting REAL smart quote:", { tokenIn, options })

      const quote = await this.quoter.smart(tokenIn, options)

      console.log("REAL smart quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting REAL smart quote:", error)
      throw error
    }
  }

  // Obter informações da rede
  getNetworkInfo() {
    return {
      chainId: CHAIN_ID,
      name: "WorldChain",
      rpcUrl: RPC_URL,
      blockExplorer: "https://worldscan.org",
    }
  }

  // Obter tokens conhecidos
  getKnownTokens() {
    return KNOWN_TOKENS
  }

  // Verificar se o serviço está inicializado
  isInitialized() {
    return this.initialized
  }

  // Obter provider
  getProvider() {
    return this.provider
  }

  // Obter cliente
  getClient() {
    return this.client
  }
}

export const holdstationService = new HoldstationService()
