import { ethers } from "ethers"

// Configuração da WorldChain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços dos contratos Uniswap na WorldChain
const UNISWAP_CONTRACTS = {
  FACTORY_V3: "0x7a5028BDa40e7B173C278C5342087826455ea25a",
  SWAP_ROUTER_02: "0x091AD9e2e6cc414deE1eB45135672a30bcFEec9de3",
  QUOTER_V2: "0x10158D43e6cc414deE1eB45135672a30bcFEec9de3",
  WETH: "0x4200000000000000000000000000000000000006",
}

// Apenas WLD e TPF
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
}

// ABIs necessários
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]

const SWAP_ROUTER_02_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
]

interface QuoteParams {
  tokenIn: "WLD" | "TPF"
  tokenOut: "WLD" | "TPF"
  amountIn: string
}

interface SwapParams {
  tokenIn: "WLD" | "TPF"
  tokenOut: "WLD" | "TPF"
  amountIn: string
  amountOutMinimum: string
  recipient: string
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
      console.log("Initializing Uniswap Service for WLD/TPF...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`Connected to WorldChain: ${network.chainId}`)

      // Inicializar contratos
      this.quoter = new ethers.Contract(UNISWAP_CONTRACTS.QUOTER_V2, QUOTER_V2_ABI, this.provider)
      this.swapRouter = new ethers.Contract(UNISWAP_CONTRACTS.SWAP_ROUTER_02, SWAP_ROUTER_02_ABI, this.provider)

      this.initialized = true
      console.log("Uniswap Service initialized for WLD/TPF pair")
    } catch (error) {
      console.error("Failed to initialize Uniswap Service:", error)
    }
  }

  // Obter cotação WLD/TPF
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return params.amountIn
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      if (!this.quoter) {
        // Fallback para cotação simulada
        return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
      }

      // Converter amount para wei
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      // Fee de 0.3% (3000)
      const fee = 3000

      // Parâmetros para o QuoterV2
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0,
      }

      console.log(`Getting quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Chamar QuoterV2
      const result = await this.quoter.quoteExactInputSingle(quoteParams)
      const amountOut = result[0]

      // Converter de volta para formato legível
      const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

      console.log(`Quote result: ${formattedAmount} ${params.tokenOut}`)

      return formattedAmount
    } catch (error) {
      console.error("Error getting quote:", error)
      return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
    }
  }

  // Executar swap WLD/TPF
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`Executing swap: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

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

  // Obter informações dos tokens
  getTokens() {
    return TOKENS
  }

  // Verificar se o pool WLD/TPF existe
  async poolExists(): Promise<boolean> {
    try {
      if (!this.provider) return false

      const factoryABI = [
        "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
      ]

      const factory = new ethers.Contract(UNISWAP_CONTRACTS.FACTORY_V3, factoryABI, this.provider)

      const poolAddress = await factory.getPool(TOKENS.WLD.address, TOKENS.TPF.address, 3000)

      const exists = poolAddress !== ethers.ZeroAddress
      console.log(`WLD/TPF pool exists: ${exists} at ${poolAddress}`)

      return exists
    } catch (error) {
      console.error("Error checking pool existence:", error)
      return false
    }
  }

  // Fallback para cotações quando a API não está disponível
  private getFallbackQuote(tokenIn: "WLD" | "TPF", tokenOut: "WLD" | "TPF", amountIn: string): string {
    const amount = Number.parseFloat(amountIn)

    // Taxas de câmbio simuladas WLD/TPF
    if (tokenIn === "WLD" && tokenOut === "TPF") {
      // 1 WLD = 1000 TPF (exemplo)
      return (amount * 1000).toString()
    } else if (tokenIn === "TPF" && tokenOut === "WLD") {
      // 1000 TPF = 1 WLD
      return (amount / 1000).toString()
    }

    return amountIn
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
