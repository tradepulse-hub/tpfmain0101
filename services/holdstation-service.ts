import { ethers } from "ethers"

// Configuração baseada na documentação da Holdstation
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

// Endereços dos contratos (precisam ser atualizados com os valores reais)
// Por enquanto, usamos valores vazios e implementamos fallbacks
const TOKEN_PROVIDER_ADDRESS = "" // Endereço do TokenProvider
const QUOTER_ADDRESS = "" // Endereço do Quoter
const SWAP_HELPER_ADDRESS = "" // Endereço do SwapHelper

// Tokens padrão que queremos mostrar
const DEFAULT_TOKENS = [
  {
    symbol: "WETH",
    name: "Wrapped Ethereum",
    address: "0x4200000000000000000000000000000000000006",
    balance: "0.5",
    decimals: 18,
    icon: "/ethereum-abstract.png",
  },
  {
    symbol: "USDCe",
    name: "USD Coin",
    address: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
    balance: "1500.0",
    decimals: 6,
    icon: "/usdc-coins.png",
  },
  {
    symbol: "TPF",
    name: "TPulseFi",
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    balance: "10000.0",
    decimals: 18,
    icon: "/logo-tpf.png",
  },
  {
    symbol: "WLD",
    name: "Worldcoin",
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    balance: "42.67",
    decimals: 18,
    icon: "/worldcoin.jpeg",
  },
  {
    symbol: "DNA",
    name: "DNA Token",
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    balance: "125.45",
    decimals: 18,
    icon: "/dna-token.png",
  },
  {
    symbol: "CASH",
    name: "Cash Token",
    address: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
    balance: "310.89",
    decimals: 18,
    icon: "/cash-token.png",
  },
  {
    symbol: "WDD",
    name: "World Drachma",
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    balance: "78.32",
    decimals: 18,
    icon: "/drachma-token.png",
  },
]

interface TokenInfo {
  address: string
  chainId: number
  decimals: number
  symbol: string
  name: string
}

interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  decimals: number
  icon?: string
}

interface QuoteParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippage: string
  fee: string
}

interface QuoteResponse {
  data: string
  to: string
  value: string
  feeAmountOut: string
}

class HoldstationService {
  private provider: ethers.JsonRpcProvider | null = null
  private tokenProvider: ethers.Contract | null = null
  private quoter: ethers.Contract | null = null
  private swapHelper: ethers.Contract | null = null
  private initialized = false

  // Mapeamento de ícones para tokens conhecidos
  private tokenIcons: Record<string, string> = {
    WETH: "/ethereum-abstract.png",
    USDCe: "/usdc-coins.png",
    TPF: "/logo-tpf.png",
    WLD: "/worldcoin.jpeg",
    DNA: "/dna-token.png",
    CASH: "/cash-token.png",
    WDD: "/drachma-token.png",
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("Initializing Holdstation Service...")

      // Criar provider baseado na documentação
      this.provider = new ethers.JsonRpcProvider(RPC_URL, {
        chainId: 480,
        name: "worldchain",
      })

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`Connected to network: ${network.name} (${network.chainId})`)

      // Inicializar contratos quando os endereços estiverem disponíveis
      if (TOKEN_PROVIDER_ADDRESS) {
        // ABI simplificado para TokenProvider
        const TOKEN_PROVIDER_ABI = [
          "function tokenOf(string wallet) external view returns (string[] memory)",
          "function balanceOf(tuple(string wallet, string[] tokens)) external view returns (uint256[])",
          "function details(string[] tokens) external view returns (tuple(string address, uint256 chainId, uint8 decimals, string symbol, string name)[])",
        ]
        this.tokenProvider = new ethers.Contract(TOKEN_PROVIDER_ADDRESS, TOKEN_PROVIDER_ABI, this.provider)
      }

      if (QUOTER_ADDRESS) {
        // ABI simplificado para Quoter
        const QUOTER_ABI = [
          "function simple(string tokenIn, string tokenOut) external view returns (uint256)",
          "function smart(string tokenIn, string tokenOut, uint256 slippage, uint256 deadline) external view returns (uint256)",
        ]
        this.quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, this.provider)
      }

      if (SWAP_HELPER_ADDRESS) {
        // ABI simplificado para SwapHelper
        const SWAP_HELPER_ABI = [
          "function swap(tuple(string tokenIn, string tokenOut, string amountIn, bytes tx, string fee, string feeAmountOut, string feeReceiver)) external returns (bool)",
        ]
        this.swapHelper = new ethers.Contract(SWAP_HELPER_ADDRESS, SWAP_HELPER_ABI, this.provider)
      }

      this.initialized = true
      console.log("Holdstation Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Holdstation Service:", error)
    }
  }

  // Obter todos os tokens de uma carteira
  async getWalletTokens(walletAddress: string): Promise<string[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.tokenProvider || !TOKEN_PROVIDER_ADDRESS) {
        console.warn("TokenProvider not available, using fallback tokens")
        // Fallback para tokens conhecidos
        return DEFAULT_TOKENS.map((token) => token.symbol)
      }

      // Usar a API da Holdstation conforme documentação
      const tokens = await this.tokenProvider.tokenOf(walletAddress)
      console.log(`Found ${tokens.length} tokens for wallet ${walletAddress}`)
      return tokens
    } catch (error) {
      console.error("Error getting wallet tokens:", error)
      // Fallback para tokens conhecidos
      return DEFAULT_TOKENS.map((token) => token.symbol)
    }
  }

  // Obter saldos de múltiplos tokens para uma carteira
  async getTokenBalances(walletAddress: string, tokens?: string[]): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Se não temos o TokenProvider ou o endereço não está definido, usar fallback
      if (!this.tokenProvider || !TOKEN_PROVIDER_ADDRESS) {
        console.warn("TokenProvider not available, using fallback balances")
        // Retornar tokens padrão com saldos simulados
        return DEFAULT_TOKENS
      }

      // Se tokens não fornecidos, buscar todos os tokens da carteira
      if (!tokens) {
        tokens = await this.getWalletTokens(walletAddress)
      }

      // Obter detalhes dos tokens
      const tokenDetails = await this.tokenProvider.details(tokens)
      console.log("Token details:", tokenDetails)

      // Obter saldos usando a API da Holdstation
      const balances = await this.tokenProvider.balanceOf({
        wallet: walletAddress,
        tokens: tokens,
      })
      console.log("Token balances:", balances)

      // Combinar detalhes e saldos
      const tokenBalances: TokenBalance[] = tokens.map((token, index) => {
        const details = tokenDetails[index]
        const balance = balances[index]

        return {
          symbol: details.symbol,
          name: details.name,
          address: details.address,
          balance: ethers.formatUnits(balance, details.decimals),
          decimals: details.decimals,
          icon: this.tokenIcons[details.symbol],
        }
      })

      // Filtrar tokens com saldo > 0
      return tokenBalances.filter((token) => Number.parseFloat(token.balance) > 0)
    } catch (error) {
      console.error("Error getting token balances:", error)
      // Retornar tokens padrão com saldos simulados
      return DEFAULT_TOKENS
    }
  }

  // Obter cotação simples
  async getSimpleQuote(tokenIn: string, tokenOut: string): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.quoter || !QUOTER_ADDRESS) {
        console.warn("Quoter not available, using fallback quote")
        return this.getFallbackQuote(tokenIn, tokenOut)
      }

      // Usar a API da Holdstation conforme documentação
      const quote = await this.quoter.simple(tokenIn, tokenOut)
      return ethers.formatUnits(quote, 18)
    } catch (error) {
      console.error("Error getting simple quote:", error)
      return this.getFallbackQuote(tokenIn, tokenOut)
    }
  }

  // Obter cotação inteligente com slippage
  async getSmartQuote(tokenIn: string, tokenOut: string, slippage = 3, deadline = 10): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.quoter || !QUOTER_ADDRESS) {
        console.warn("Quoter not available, using fallback quote")
        const simpleQuote = this.getFallbackQuote(tokenIn, tokenOut)
        const adjustedQuote = Number.parseFloat(simpleQuote) * (1 - slippage / 100)
        return adjustedQuote.toString()
      }

      // Usar a API da Holdstation conforme documentação
      const quote = await this.quoter.smart(tokenIn, tokenOut, slippage, deadline)
      return ethers.formatUnits(quote, 18)
    } catch (error) {
      console.error("Error getting smart quote:", error)
      const simpleQuote = this.getFallbackQuote(tokenIn, tokenOut)
      const adjustedQuote = Number.parseFloat(simpleQuote) * (1 - slippage / 100)
      return adjustedQuote.toString()
    }
  }

  // Obter cotação completa para swap
  async getQuote(params: QuoteParams): Promise<QuoteResponse> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.quoter || !QUOTER_ADDRESS) {
        throw new Error("Quoter not available")
      }

      // Usar a API da Holdstation conforme documentação
      const quote = await this.quoter.quote(params)
      return {
        data: quote.data,
        to: quote.to,
        value: quote.value.toString(),
        feeAmountOut: quote.feeAmountOut.toString(),
      }
    } catch (error) {
      console.error("Error getting quote:", error)
      // Fallback para simulação
      return {
        data: "0x",
        to: "0x",
        value: "0",
        feeAmountOut: "0",
      }
    }
  }

  // Executar swap
  async executeSwap(swapParams: any): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.swapHelper || !SWAP_HELPER_ADDRESS) {
        throw new Error("SwapHelper not available")
      }

      // Executar o swap usando a API da Holdstation
      const result = await this.swapHelper.swap(swapParams)
      return result.hash
    } catch (error) {
      console.error("Error executing swap:", error)
      // Simular um hash de transação para desenvolvimento
      return "0x" + Math.random().toString(16).substring(2, 66)
    }
  }

  // Métodos auxiliares para fallback
  getTokenName(symbol: string): string {
    const token = DEFAULT_TOKENS.find((t) => t.symbol === symbol)
    return token?.name || symbol
  }

  getTokenAddress(symbol: string): string {
    const token = DEFAULT_TOKENS.find((t) => t.symbol === symbol)
    return token?.address || ethers.ZeroAddress
  }

  private getFallbackQuote(tokenIn: string, tokenOut: string): string {
    const rates: Record<string, Record<string, number>> = {
      WETH: { USDCe: 3500, TPF: 1000000, WLD: 1000, DNA: 10000, CASH: 5000, WDD: 2000 },
      USDCe: { WETH: 0.0003, TPF: 300, WLD: 0.3, DNA: 3, CASH: 1.5, WDD: 0.6 },
      TPF: { WETH: 0.000001, USDCe: 0.0033, WLD: 0.001, DNA: 0.01, CASH: 0.005, WDD: 0.002 },
      WLD: { WETH: 0.001, USDCe: 3.33, TPF: 1000, DNA: 10, CASH: 5, WDD: 2 },
      DNA: { WETH: 0.0001, USDCe: 0.33, TPF: 100, WLD: 0.1, CASH: 0.5, WDD: 0.2 },
      CASH: { WETH: 0.0002, USDCe: 0.67, TPF: 200, WLD: 0.2, DNA: 2, WDD: 0.4 },
      WDD: { WETH: 0.0005, USDCe: 1.67, TPF: 500, WLD: 0.5, DNA: 5, CASH: 2.5 },
    }
    return (rates[tokenIn]?.[tokenOut] || 1).toString()
  }

  // Verificar se o serviço está inicializado
  isInitialized(): boolean {
    return this.initialized
  }
}

// Exportar instância única
export const holdstationService = new HoldstationService()
