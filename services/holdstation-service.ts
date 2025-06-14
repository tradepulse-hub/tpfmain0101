import type { TokenBalance, SwapQuote } from "./types"
import { ethers } from "ethers"

// Configuração para Worldchain conforme documentação
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

console.log("🚀 HOLDSTATION SERVICE - SEGUINDO DOCUMENTAÇÃO OFICIAL")

class HoldstationService {
  private client: any = null
  private manager: any = null
  private walletHistory: any = null
  private multicall3: any = null
  private tokenProvider: any = null
  private quoter: any = null
  private swapHelper: any = null
  private provider: any = null
  private config: any = null
  private initialized = false

  constructor() {
    console.log("🔧 HoldstationService constructor - SEGUINDO DOCS")
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Inicializando conforme DOCUMENTAÇÃO OFICIAL...")

      // 1. Importar módulos conforme documentação
      console.log("📦 Importando módulos...")
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Módulos importados!")
      console.log("📋 HoldstationModule exports:", Object.keys(HoldstationModule))
      console.log("📋 EthersModule exports:", Object.keys(EthersModule))

      // 2. Extrair componentes conforme documentação
      const { config, inmemoryTokenStorage, TokenProvider } = HoldstationModule
      const { Client, Multicall3, Quoter, SwapHelper } = EthersModule

      console.log("✅ Componentes extraídos conforme docs!")

      // 3. Criar provider ethers v6
      console.log("🔧 Criando provider ethers v6...")
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      // 4. Aguardar rede estar pronta
      console.log("⏳ Aguardando rede...")
      const network = await this.provider.getNetwork()
      const blockNumber = await this.provider.getBlockNumber()
      console.log(`✅ Rede pronta: ${network.name} (${network.chainId}) - Block: ${blockNumber}`)

      // 5. Criar Client conforme documentação
      console.log("🔧 Criando Client conforme docs...")
      this.client = new Client(this.provider)
      console.log("✅ Client criado!")

      // 6. Criar Multicall3 conforme documentação
      console.log("🔧 Criando Multicall3...")
      this.multicall3 = new Multicall3(this.provider)
      console.log("✅ Multicall3 criado!")

      // 7. CONFIGURAR CONFIG GLOBAL conforme documentação
      console.log("🔧 Configurando config global conforme docs...")
      this.config = config
      this.config.client = this.client
      this.config.multicall3 = this.multicall3
      console.log("✅ Config global configurado!")

      // 8. Criar TokenProvider conforme documentação
      console.log("🔧 Criando TokenProvider conforme docs...")
      this.tokenProvider = new TokenProvider({
        client: this.client,
        multicall3: this.multicall3,
        storage: inmemoryTokenStorage,
      })
      console.log("✅ TokenProvider criado!")

      // 9. Criar Quoter conforme documentação
      console.log("🔧 Criando Quoter conforme docs...")
      this.quoter = new Quoter(this.client)
      console.log("✅ Quoter criado!")

      // 10. Criar SwapHelper conforme documentação
      console.log("🔧 Criando SwapHelper conforme docs...")
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })
      console.log("✅ SwapHelper criado!")

      // 11. Carregar SwapHelper conforme documentação
      console.log("🔄 Carregando SwapHelper...")
      if (typeof this.swapHelper.load === "function") {
        await this.swapHelper.load()
        console.log("✅ SwapHelper carregado!")
      }

      // 12. Verificar se tudo está funcionando
      console.log("🧪 Testando componentes...")
      console.log(`├─ Client: ${!!this.client}`)
      console.log(`├─ Multicall3: ${!!this.multicall3}`)
      console.log(`├─ TokenProvider: ${!!this.tokenProvider}`)
      console.log(`├─ Quoter: ${!!this.quoter}`)
      console.log(`├─ SwapHelper: ${!!this.swapHelper}`)
      console.log(`└─ Config: ${!!this.config?.client}`)

      this.initialized = true
      console.log("✅ HoldStation SDK inicializado conforme DOCUMENTAÇÃO!")
    } catch (error) {
      console.error("❌ Erro ao inicializar conforme docs:", error)
      console.error("❌ Stack:", error.stack)
      this.initialized = false
      throw error
    }
  }

  // Obter saldos conforme documentação
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      await this.initialize()

      console.log(`💰 Obtendo saldos conforme docs para: ${walletAddress}`)

      if (!this.tokenProvider) {
        throw new Error("TokenProvider não disponível")
      }

      // Usar método do TokenProvider conforme documentação
      const balances = await this.tokenProvider.getTokenBalances(walletAddress)
      console.log("📊 Saldos obtidos conforme docs:", balances)

      // Processar conforme documentação
      const formattedBalances: TokenBalance[] = balances.map((balance: any) => ({
        symbol: balance.symbol,
        name: balance.name || balance.symbol,
        address: balance.address || balance.tokenAddress,
        balance: balance.balance || balance.amount || "0",
        decimals: balance.decimals || 18,
        icon: this.getTokenIcon(balance.symbol),
        formattedBalance: balance.formattedBalance || balance.balance || "0",
      }))

      console.log("✅ Saldos formatados conforme docs:", formattedBalances)
      return formattedBalances
    } catch (error) {
      console.error("❌ Erro ao obter saldos conforme docs:", error)
      throw new Error(`Falha ao obter saldos: ${error.message}`)
    }
  }

  // Obter cotação conforme documentação
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<SwapQuote> {
    try {
      console.log("🚨 === COTAÇÃO CONFORME DOCUMENTAÇÃO OFICIAL ===")
      console.log("📋 Parâmetros:", params)

      await this.initialize()

      if (!this.quoter) {
        throw new Error("Quoter não disponível")
      }

      // Converter para wei conforme documentação
      const amountInWei = ethers.parseEther(params.amountIn)
      console.log(`💰 Amount: ${params.amountIn} → ${amountInWei.toString()} wei`)

      // Usar Quoter conforme documentação
      console.log("📡 Chamando quoter.getQuote conforme docs...")
      const quoteParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: amountInWei.toString(),
        slippage: params.slippage || "3",
      }

      const quote = await this.quoter.getQuote(quoteParams)
      console.log("✅ Cotação obtida conforme docs:", quote)

      // Formatar resposta conforme documentação
      const formattedQuote: SwapQuote = {
        amountOut: quote.amountOut || "0",
        data: quote.data || "0x",
        to: quote.to || "0x0000000000000000000000000000000000000000",
        value: quote.value || "0",
        feeAmountOut: quote.feeAmountOut || "0",
        addons: {
          outAmount: quote.amountOut || "0",
          rateSwap: quote.rateSwap || "0",
          amountOutUsd: quote.amountOutUsd || "0",
          minReceived: quote.minReceived || "0",
          feeAmountOut: quote.feeAmountOut || "0",
        },
      }

      console.log("✅ Cotação formatada conforme docs:", formattedQuote)
      return formattedQuote
    } catch (error) {
      console.error("❌ Erro na cotação conforme docs:", error)
      throw new Error(`Falha na cotação: ${error.message}`)
    }
  }

  // Executar swap conforme documentação
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
  }): Promise<string> {
    try {
      console.log("🚀 Executando swap conforme DOCUMENTAÇÃO...")
      console.log("📋 Parâmetros:", params)

      await this.initialize()

      if (!this.swapHelper) {
        throw new Error("SwapHelper não disponível")
      }

      // Primeiro obter cotação
      const quote = await this.getSwapQuote(params)

      // Executar swap conforme documentação
      console.log("📡 Chamando swapHelper.swap conforme docs...")
      const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        amountIn: params.amountIn,
        tx: {
          data: quote.data,
          to: quote.to,
        },
        fee: "0.3",
        feeAmountOut: quote.feeAmountOut,
        feeReceiver: "0x0000000000000000000000000000000000000000",
      }

      const txResult = await this.swapHelper.swap(swapParams)
      console.log("✅ Swap executado conforme docs:", txResult)

      // Extrair hash conforme documentação
      const txHash = txResult.hash || txResult.transactionHash || txResult
      console.log("📋 Hash da transação:", txHash)

      return txHash
    } catch (error) {
      console.error("❌ Erro no swap conforme docs:", error)
      throw new Error(`Falha no swap: ${error.message}`)
    }
  }

  // Histórico conforme documentação
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
    try {
      console.log("=== BUSCAR HISTÓRICO CONFORME DOCUMENTAÇÃO ===")
      console.log(`Endereço: ${walletAddress}`)
      console.log(`Offset: ${offset}, Limit: ${limit}`)

      if (!this.initialized) {
        console.log("❌ SDK não inicializado - inicializando...")
        await this.initializeSDK()
      }

      if (!this.walletHistory) {
        console.log("❌ walletHistory não disponível - reinicializando...")
        await this.initializeSDK()
      }

      console.log("📡 Chamando walletHistory.fetch conforme documentação...")

      // Usar método conforme documentação
      const result = await this.walletHistory.fetch({
        address: walletAddress,
        offset,
        limit,
      })

      console.log("✅ Histórico obtido:", result)
      console.log(`📊 Total de transações: ${result?.length || 0}`)

      return result || []
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error.message)
      console.error("Stack:", error.stack)
      throw error
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

  // Métodos auxiliares
  getSupportedTokens() {
    return SUPPORTED_TOKENS
  }

  isInitialized(): boolean {
    return this.initialized
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
      hasProvider: !!this.provider,
      hasClient: !!this.client,
      hasTokenProvider: !!this.tokenProvider,
      hasQuoter: !!this.quoter,
      hasSwapHelper: !!this.swapHelper,
      hasMulticall3: !!this.multicall3,
      hasGlobalConfig: !!this.config?.client,
      sdkType: "OFICIAL - Seguindo documentação HoldStation",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  async debugSDK() {
    try {
      await this.initialize()
      console.log("=== DEBUG CONFORME DOCUMENTAÇÃO ===")
      console.log("Status:", this.getSDKStatus())
      return this.getSDKStatus()
    } catch (error) {
      console.error("Debug falhou:", error)
      return { error: error.message }
    }
  }

  async initializeSDK(): Promise<void> {
    try {
      console.log("🔧 Inicializando APENAS histórico conforme documentação HoldStation...")

      // Importar módulos conforme documentação
      const { Client } = await import("@holdstation/sdk")
      const { config } = await import("@holdstation/sdk")

      console.log("✅ Módulos importados")

      // Criar provider
      const provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public")
      console.log("✅ Provider criado")

      // Criar client conforme documentação
      this.client = new Client({
        provider,
        chainId: 480,
      })

      console.log("✅ Client criado conforme docs")

      // Configurar config global conforme documentação
      config.setGlobalConfig({
        client: this.client,
      })

      console.log("✅ Config global definido")

      // Importar WalletHistory conforme documentação
      const { WalletHistory } = await import("@holdstation/sdk")

      // Criar WalletHistory conforme documentação
      this.walletHistory = new WalletHistory()

      console.log("✅ WalletHistory criado conforme documentação")

      this.initialized = true
      console.log("✅ SDK inicializado APENAS para histórico!")
    } catch (error) {
      console.error("❌ Erro ao inicializar SDK:", error.message)
      console.error("Stack:", error.stack)
      throw error
    }
  }

  getManager() {
    return this.manager
  }
}

console.log("✅ HoldstationService definido conforme DOCUMENTAÇÃO")

export const holdstationService = new HoldstationService()

console.log("✅ holdstationService criado conforme DOCS:", !!holdstationService)
console.log("🎯 HOLDSTATION SERVICE - SEGUINDO DOCUMENTAÇÃO OFICIAL")
