import { ethers } from "ethers"
import { TokenProvider, Manager } from "@holdstation/worldchain-sdk"
import { Client, Multicall3, Quoter, SwapHelper } from "@holdstation/worldchain-ethers-v5"
import { config, inmemoryTokenStorage } from "@holdstation/worldchain-sdk"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços de tokens conhecidos
const KNOWN_TOKENS = {
  WETH: "0x4200000000000000000000000000000000000006",
  USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
}

class HoldstationService {
  private provider: ethers.providers.StaticJsonRpcProvider
  private client: Client
  private multicall: Multicall3
  private tokenProvider: TokenProvider
  private quoter: Quoter
  private swapHelper: SwapHelper
  private historyManager: Manager
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
      console.log("Initializing Holdstation service...")

      // Configurar provider
      this.provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Configurar cliente e multicall
      this.client = new Client(this.provider)
      this.multicall = new Multicall3(this.provider)

      // Configurar SDK global
      config.client = this.client
      config.multicall3 = this.multicall

      // Inicializar serviços
      this.tokenProvider = new TokenProvider()
      this.quoter = new Quoter(this.client)
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })
      this.historyManager = new Manager(this.provider, CHAIN_ID)

      console.log("Holdstation service initialized successfully")
      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize Holdstation service:", error)
    }
  }

  // Obter detalhes de tokens
  async getTokenDetails(tokenAddresses: string[]) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching token details for:", tokenAddresses)
      const details = await this.tokenProvider.details(...tokenAddresses)
      console.log("Token details:", details)
      return details
    } catch (error) {
      console.error("Error fetching token details:", error)
      return {}
    }
  }

  // Obter todos os tokens de uma carteira
  async getWalletTokens(walletAddress: string) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching tokens for wallet:", walletAddress)
      const tokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log("Wallet tokens:", tokens)
      return tokens
    } catch (error) {
      console.error("Error fetching wallet tokens:", error)
      return []
    }
  }

  // Obter saldos de múltiplos tokens
  async getTokenBalances(walletAddress: string, tokenAddresses: string[]) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching balances for:", { walletAddress, tokenAddresses })
      const balances = await this.tokenProvider.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })
      console.log("Token balances:", balances)
      return balances
    } catch (error) {
      console.error("Error fetching token balances:", error)
      return {}
    }
  }

  // Obter saldo de um token específico
  async getSingleTokenBalance(tokenAddress: string, walletAddress: string) {
    try {
      if (!this.initialized) await this.initialize()

      const balances = await this.getTokenBalances(walletAddress, [tokenAddress])
      return balances[tokenAddress] || "0"
    } catch (error) {
      console.error("Error fetching single token balance:", error)
      return "0"
    }
  }

  // Obter cotação para swap
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
  }) {
    try {
      if (!this.initialized) await this.initialize()

      const quoteParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        slippage: params.slippage || "0.5",
        fee: params.fee || "0.0",
      }

      console.log("Getting swap quote:", quoteParams)
      const quote = await this.swapHelper.quote(quoteParams)
      console.log("Swap quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting swap quote:", error)
      throw error
    }
  }

  // Executar swap
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    tx: any
    fee?: string
    feeReceiver?: string
  }) {
    try {
      if (!this.initialized) await this.initialize()

      const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: params.tx,
        fee: params.fee || "0.0",
        feeReceiver: params.feeReceiver || ethers.constants.AddressZero,
      }

      console.log("Executing swap:", swapParams)
      const result = await this.swapHelper.swap(swapParams)
      console.log("Swap result:", result)
      return result
    } catch (error) {
      console.error("Error executing swap:", error)
      throw error
    }
  }

  // Monitorar histórico de transações
  async watchTransactionHistory(walletAddress: string, callback: () => void) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Starting transaction history monitoring for:", walletAddress)
      const { start, stop } = await this.historyManager.watch(walletAddress, callback)

      // Iniciar monitoramento
      await start()

      return { stop }
    } catch (error) {
      console.error("Error watching transaction history:", error)
      return { stop: () => {} }
    }
  }

  // Obter histórico de transações
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Fetching transaction history:", { walletAddress, offset, limit })

      // Primeiro, iniciar o monitoramento para garantir que os dados estejam atualizados
      const { stop } = await this.watchTransactionHistory(walletAddress, () => {})

      // Aguardar um pouco para os dados serem processados
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Buscar transações
      const transactions = await this.historyManager.find(offset, limit)
      console.log("Transaction history:", transactions)

      // Parar o monitoramento
      stop()

      return transactions
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      return []
    }
  }

  // Obter cotação simples
  async getSimpleQuote(tokenIn: string, tokenOut: string) {
    try {
      if (!this.initialized) await this.initialize()

      console.log("Getting simple quote:", { tokenIn, tokenOut })
      const quote = await this.quoter.simple(tokenIn, tokenOut)
      console.log("Simple quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting simple quote:", error)
      return null
    }
  }

  // Obter cotação inteligente
  async getSmartQuote(tokenIn: string, options: { slippage?: number; deadline?: number } = {}) {
    try {
      if (!this.initialized) await this.initialize()

      const { slippage = 3, deadline = 10 } = options
      console.log("Getting smart quote:", { tokenIn, slippage, deadline })

      const quote = await this.quoter.smart(tokenIn, { slippage, deadline })
      console.log("Smart quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting smart quote:", error)
      return null
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
}

export const holdstationService = new HoldstationService()
