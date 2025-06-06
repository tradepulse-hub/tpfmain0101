import { ethers } from "ethers"
import { Client, Multicall3, Quoter, SwapHelper } from "@holdstation/worldchain-ethers-v5"
import { config, inmemoryTokenStorage, TokenProvider, Sender, Manager } from "@holdstation/worldchain-sdk"

// Configuração do RPC da Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

// Serviço real da Holdstation
class HoldstationService {
  private provider: ethers.providers.StaticJsonRpcProvider
  private client: Client
  private multicall3: Multicall3
  private tokenProvider: TokenProvider
  private quoter: Quoter
  private swapHelper: SwapHelper
  private sender: Sender
  private manager: Manager
  private initialized = false

  constructor() {
    this.initializeService()
  }

  private async initializeService() {
    try {
      console.log("Initializing Holdstation SDK...")

      // Configurar provider
      this.provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL, {
        chainId: 480,
        name: "worldchain",
      })

      // Configurar client e multicall
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
      this.sender = new Sender(this.provider)
      this.manager = new Manager(this.provider, 480)

      this.initialized = true
      console.log("Holdstation SDK initialized successfully")
    } catch (error) {
      console.error("Error initializing Holdstation SDK:", error)
      this.initialized = false
    }
  }

  // Aguardar inicialização
  private async ensureInitialized() {
    let attempts = 0
    while (!this.initialized && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
    if (!this.initialized) {
      throw new Error("Holdstation SDK failed to initialize")
    }
  }

  // Obter detalhes de tokens
  async getTokenDetails(tokenAddresses: string[]) {
    await this.ensureInitialized()
    try {
      const details = await this.tokenProvider.details(...tokenAddresses)
      console.log("Token details:", details)
      return details
    } catch (error) {
      console.error("Error getting token details:", error)
      return {}
    }
  }

  // Obter tokens da carteira
  async getWalletTokens(walletAddress: string) {
    await this.ensureInitialized()
    try {
      const tokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log("Wallet tokens:", tokens)
      return tokens
    } catch (error) {
      console.error("Error getting wallet tokens:", error)
      return []
    }
  }

  // Obter saldos de múltiplos tokens
  async getTokenBalances(walletAddress: string, tokenAddresses: string[]) {
    await this.ensureInitialized()
    try {
      const balances = await this.tokenProvider.balanceOf({
        wallet: walletAddress,
        tokens: tokenAddresses,
      })
      console.log("Token balances:", balances)
      return balances
    } catch (error) {
      console.error("Error getting token balances:", error)
      return {}
    }
  }

  // Obter saldo de um token específico
  async getSingleTokenBalance(tokenAddress: string, walletAddress: string) {
    await this.ensureInitialized()
    try {
      const balances = await this.tokenProvider.balanceOf({
        token: tokenAddress,
        wallets: [walletAddress],
      })
      return balances[walletAddress] || "0"
    } catch (error) {
      console.error("Error getting single token balance:", error)
      return "0"
    }
  }

  // Obter cotação para swap
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage: string
    fee: string
  }) {
    await this.ensureInitialized()
    try {
      const quote = await this.swapHelper.quote(params)
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
    tx: {
      data: string
      to: string
      value: string
    }
    feeAmountOut?: string
    fee: string
    feeReceiver: string
  }) {
    await this.ensureInitialized()
    try {
      const result = await this.swapHelper.swap(params)
      console.log("Swap result:", result)
      return result
    } catch (error) {
      console.error("Error executing swap:", error)
      throw error
    }
  }

  // Enviar tokens
  async sendToken(params: { to: string; amount: number; token?: string }) {
    await this.ensureInitialized()
    try {
      const result = await this.sender.send(params)
      console.log("Send result:", result)
      return result
    } catch (error) {
      console.error("Error sending token:", error)
      throw error
    }
  }

  // Obter histórico de transações
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50) {
    await this.ensureInitialized()
    try {
      const transactions = await this.manager.find(offset, limit)
      console.log("Transaction history:", transactions)
      return transactions
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return []
    }
  }

  // Monitorar histórico de transações
  async watchTransactionHistory(walletAddress: string, callback: () => void) {
    await this.ensureInitialized()
    try {
      const { start, stop } = await this.manager.watch(walletAddress, callback)
      await start()
      return { stop }
    } catch (error) {
      console.error("Error watching transaction history:", error)
      return { stop: () => {} }
    }
  }

  // Obter cotação simples
  async getSimpleQuote(tokenIn: string, tokenOut: string) {
    await this.ensureInitialized()
    try {
      const quote = await this.quoter.simple(tokenIn, tokenOut)
      console.log("Simple quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting simple quote:", error)
      throw error
    }
  }

  // Obter cotação inteligente
  async getSmartQuote(tokenIn: string, options: { slippage: number; deadline: number }) {
    await this.ensureInitialized()
    try {
      const quote = await this.quoter.smart(tokenIn, options)
      console.log("Smart quote:", quote)
      return quote
    } catch (error) {
      console.error("Error getting smart quote:", error)
      throw error
    }
  }

  // Tokens conhecidos da Worldchain
  getKnownTokens() {
    return {
      TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
      WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
      WETH: "0x4200000000000000000000000000000000000006",
      USDCe: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
      DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
      CASH: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
      WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    }
  }

  // Verificar se está inicializado
  isInitialized() {
    return this.initialized
  }

  // Obter informações da rede
  getNetworkInfo() {
    return {
      chainId: 480,
      name: "worldchain",
      rpcUrl: RPC_URL,
    }
  }
}

export const holdstationService = new HoldstationService()
