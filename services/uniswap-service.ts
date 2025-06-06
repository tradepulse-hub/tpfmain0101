import { ethers } from "ethers"

// Configuração da WorldChain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços dos contratos Uniswap na WorldChain
const UNISWAP_CONTRACTS = {
  FACTORY_V3: "0x7a5028BDa40e7B173C278C5342087826455ea25a",
  SWAP_ROUTER_02: "0x091AD9e2e6cc414deE1eB45135672a30bcFEec9de3",
  QUOTER_V2: "0x10158D43e6cc414deE1eB45135672a30bcFEec9de3",
  NONFUNGIBLE_POSITION_MANAGER: "0xec12a9F9a09f50550686363766Cc153D03c27b5e",
  UNIVERSAL_ROUTER: "0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743",
  PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  WETH: "0x4200000000000000000000000000000000000006",
}

// Tokens conhecidos na WorldChain
const KNOWN_TOKENS = {
  WETH: {
    address: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    name: "Wrapped Ethereum",
    decimals: 18,
    icon: "/ethereum-abstract.png",
  },
  USDCe: {
    address: "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1",
    symbol: "USDCe",
    name: "USD Coin",
    decimals: 6,
    icon: "/usdc-coins.png",
  },
  TPF: {
    address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
    symbol: "TPF",
    name: "TPulseFi",
    decimals: 18,
    icon: "/logo-tpf.png",
  },
  WLD: {
    address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
    symbol: "WLD",
    name: "Worldcoin",
    decimals: 18,
    icon: "/worldcoin.jpeg",
  },
  DNA: {
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    symbol: "DNA",
    name: "DNA Token",
    decimals: 18,
    icon: "/dna-token.png",
  },
  CASH: {
    address: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
    symbol: "CASH",
    name: "Cash Token",
    decimals: 18,
    icon: "/cash-token.png",
  },
  WDD: {
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    symbol: "WDD",
    name: "World Drachma",
    decimals: 18,
    icon: "/drachma-token.png",
  },
}

// ABIs necessários
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]

const SWAP_ROUTER_02_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
]

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

interface QuoteParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  fee?: number
}

interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOutMinimum: string
  recipient: string
  fee?: number
}

class UniswapService {
  private provider: ethers.JsonRpcProvider | null = null
  private quoter: ethers.Contract | null = null
  private swapRouter: ethers.Contract | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("Initializing Uniswap Service...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`Connected to network: ${network.name} (${network.chainId})`)

      // Inicializar contratos
      this.quoter = new ethers.Contract(UNISWAP_CONTRACTS.QUOTER_V2, QUOTER_V2_ABI, this.provider)

      this.swapRouter = new ethers.Contract(UNISWAP_CONTRACTS.SWAP_ROUTER_02, SWAP_ROUTER_02_ABI, this.provider)

      this.initialized = true
      console.log("Uniswap Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Uniswap Service:", error)
    }
  }

  // Obter cotação usando QuoterV2
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      const tokenIn = this.getTokenBySymbol(params.tokenIn)
      const tokenOut = this.getTokenBySymbol(params.tokenOut)

      if (!tokenIn || !tokenOut) {
        throw new Error("Token not supported")
      }

      if (!this.quoter) {
        // Fallback para cotações simuladas
        return this.getFallbackQuote(params.tokenIn, params.tokenOut)
      }

      // Converter amount para wei
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      // Fee padrão de 0.3% (3000)
      const fee = params.fee || 3000

      // Parâmetros para o QuoterV2
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0, // 0 = sem limite de preço
      }

      console.log("Getting quote with params:", quoteParams)

      // Chamar QuoterV2
      const result = await this.quoter.quoteExactInputSingle(quoteParams)
      const amountOut = result[0] // primeiro elemento é amountOut

      // Converter de volta para formato legível
      const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

      console.log(`Quote: ${params.amountIn} ${params.tokenIn} = ${formattedAmount} ${params.tokenOut}`)

      return formattedAmount
    } catch (error) {
      console.error("Error getting quote:", error)
      return this.getFallbackQuote(params.tokenIn, params.tokenOut)
    }
  }

  // Executar swap (simulado por enquanto)
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("Executing swap with params:", params)

      // Por enquanto, simular o swap
      // Em produção, seria necessário conectar com a carteira do usuário
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Retornar hash simulado
      const txHash = "0x" + Math.random().toString(16).substring(2, 66)
      console.log("Swap executed with hash:", txHash)

      return txHash
    } catch (error) {
      console.error("Error executing swap:", error)
      throw error
    }
  }

  // Obter informações de um token
  getTokenBySymbol(symbol: string) {
    return KNOWN_TOKENS[symbol as keyof typeof KNOWN_TOKENS] || null
  }

  // Obter todos os tokens suportados
  getSupportedTokens() {
    return Object.values(KNOWN_TOKENS)
  }

  // Verificar se um pool existe
  async poolExists(tokenA: string, tokenB: string, fee = 3000): Promise<boolean> {
    try {
      if (!this.provider) return false

      const factoryABI = [
        "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
      ]

      const factory = new ethers.Contract(UNISWAP_CONTRACTS.FACTORY_V3, factoryABI, this.provider)

      const tokenAInfo = this.getTokenBySymbol(tokenA)
      const tokenBInfo = this.getTokenBySymbol(tokenB)

      if (!tokenAInfo || !tokenBInfo) return false

      const poolAddress = await factory.getPool(tokenAInfo.address, tokenBInfo.address, fee)

      return poolAddress !== ethers.ZeroAddress
    } catch (error) {
      console.error("Error checking pool existence:", error)
      return false
    }
  }

  // Fallback para cotações quando a API não está disponível
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

    const rate = rates[tokenIn]?.[tokenOut] || 1
    return rate.toString()
  }

  // Verificar se o serviço está inicializado
  isInitialized(): boolean {
    return this.initialized
  }

  // Obter endereços dos contratos
  getContractAddresses() {
    return UNISWAP_CONTRACTS
  }
}

// Exportar instância única
export const uniswapService = new UniswapService()
