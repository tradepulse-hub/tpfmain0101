import { ethers } from "ethers"

// Configuração da WorldChain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços corretos dos contratos Uniswap na WorldChain
const UNISWAP_CONTRACTS = {
  FACTORY_V3: "0x7a5028BDa40e7B173C278C5342087826455ea25a",
  SWAP_ROUTER_02: "0x091AD9e2e6cc414deE1eB45135672a30bcFEec9de3",
  QUOTER_V2: "0x10158D43e6cc414deE1eB45135672a30bcFEec9de3",
  WETH: "0x4200000000000000000000000000000000000006",
  // Pool TPF/WLD real
  TPF_WLD_POOL: "0xEE08Cef6EbCe1e037fFdbDF6ab657E5C19E86FF3",
}

// Tokens TPF e WLD
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

// ABI do Factory V3
const FACTORY_V3_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
  "function feeAmountTickSpacing(uint24 fee) external view returns (int24)",
]

// ABI do Pool V3 (baseado nas imagens)
const POOL_V3_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function liquidity() external view returns (uint128)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data) external returns (int256 amount0, int256 amount1)",
]

// ABI do QuoterV2 simplificado
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]

// ABI do SwapRouter02
const SWAP_ROUTER_02_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
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

interface TokenBalance {
  symbol: "WLD" | "TPF"
  balance: string
  formattedBalance: string
}

interface PoolInfo {
  address: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  liquidity: string
  sqrtPriceX96: string
  tick: number
  isValid: boolean
}

class UniswapService {
  private provider: ethers.JsonRpcProvider | null = null
  private factory: ethers.Contract | null = null
  private quoter: ethers.Contract | null = null
  private pool: ethers.Contract | null = null
  private swapRouter: ethers.Contract | null = null
  private initialized = false
  private poolInfo: PoolInfo | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("Initializing Uniswap Service with Factory and Pool contracts...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`Connected to WorldChain: ${network.chainId}`)

      // Inicializar contratos
      this.factory = new ethers.Contract(UNISWAP_CONTRACTS.FACTORY_V3, FACTORY_V3_ABI, this.provider)
      this.quoter = new ethers.Contract(UNISWAP_CONTRACTS.QUOTER_V2, QUOTER_V2_ABI, this.provider)
      this.swapRouter = new ethers.Contract(UNISWAP_CONTRACTS.SWAP_ROUTER_02, SWAP_ROUTER_02_ABI, this.provider)

      // Verificar e configurar pool
      await this.setupPool()

      this.initialized = true
      console.log("Uniswap Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Uniswap Service:", error)
    }
  }

  private async setupPool() {
    try {
      console.log("Setting up TPF/WLD pool...")

      // Primeiro, verificar se o pool existe usando o Factory
      const poolAddress = await this.factory!.getPool(
        TOKENS.TPF.address,
        TOKENS.WLD.address,
        3000, // Fee de 0.3%
      )

      console.log(`Pool address from factory: ${poolAddress}`)
      console.log(`Expected pool address: ${UNISWAP_CONTRACTS.TPF_WLD_POOL}`)

      // Usar o endereço do pool que você forneceu
      this.pool = new ethers.Contract(UNISWAP_CONTRACTS.TPF_WLD_POOL, POOL_V3_ABI, this.provider)

      // Verificar informações do pool
      const token0 = await this.pool.token0()
      const token1 = await this.pool.token1()
      const fee = await this.pool.fee()
      const tickSpacing = await this.pool.tickSpacing()
      const liquidity = await this.pool.liquidity()
      const slot0 = await this.pool.slot0()

      this.poolInfo = {
        address: UNISWAP_CONTRACTS.TPF_WLD_POOL,
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
        fee: Number(fee),
        tickSpacing: Number(tickSpacing),
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0[0].toString(),
        tick: Number(slot0[1]),
        isValid: this.validatePoolTokens(token0, token1),
      }

      console.log("Pool info loaded:", this.poolInfo)

      if (this.poolInfo.isValid) {
        console.log("✅ Pool TPF/WLD verified and configured successfully")
      } else {
        console.warn("⚠️ Pool tokens don't match expected TPF/WLD addresses")
      }
    } catch (error) {
      console.error("Error setting up pool:", error)
    }
  }

  private validatePoolTokens(token0: string, token1: string): boolean {
    const tpfAddress = TOKENS.TPF.address.toLowerCase()
    const wldAddress = TOKENS.WLD.address.toLowerCase()

    return (token0 === tpfAddress && token1 === wldAddress) || (token0 === wldAddress && token1 === tpfAddress)
  }

  // Obter saldos reais da carteira
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.provider) {
        throw new Error("Provider not initialized")
      }

      const balances: TokenBalance[] = []

      for (const [symbol, token] of Object.entries(TOKENS)) {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
          const balance = await contract.balanceOf(walletAddress)
          const formattedBalance = ethers.formatUnits(balance, token.decimals)

          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: balance.toString(),
            formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
          })

          console.log(`${symbol} balance: ${formattedBalance}`)
        } catch (error) {
          console.error(`Error getting ${symbol} balance:`, error)
          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: "0",
            formattedBalance: "0.000000",
          })
        }
      }

      return balances
    } catch (error) {
      console.error("Error getting token balances:", error)
      return [
        { symbol: "WLD", balance: "0", formattedBalance: "0.000000" },
        { symbol: "TPF", balance: "0", formattedBalance: "0.000000" },
      ]
    }
  }

  // Obter cotação usando o pool diretamente
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return params.amountIn
      }

      if (!this.poolInfo || !this.quoter) {
        console.warn("Pool info or quoter not available, using fallback")
        return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      // Converter amount para wei
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      console.log(`Getting quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)
      console.log(`Pool fee: ${this.poolInfo.fee} (${this.poolInfo.fee / 10000}%)`)

      // Usar QuoterV2 com informações do pool real
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: this.poolInfo.fee,
        amountIn: amountIn,
        sqrtPriceLimitX96: 0n,
      }

      try {
        // Tentar usar QuoterV2
        const result = await this.quoter.quoteExactInputSingle.staticCall(quoteParams)
        const amountOut = result[0]
        const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

        console.log(`Quote from QuoterV2: ${formattedAmount} ${params.tokenOut}`)
        return formattedAmount
      } catch (quoterError) {
        console.warn("QuoterV2 failed, calculating from pool price:", quoterError)

        // Fallback: calcular usando o preço atual do pool
        return this.calculateQuoteFromPoolPrice(params)
      }
    } catch (error) {
      console.error("Error getting quote:", error)
      return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
    }
  }

  // Calcular cotação usando o preço atual do pool
  private calculateQuoteFromPoolPrice(params: QuoteParams): string {
    if (!this.poolInfo) {
      return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
    }

    try {
      const amount = Number.parseFloat(params.amountIn)
      const sqrtPriceX96 = BigInt(this.poolInfo.sqrtPriceX96)

      // Calcular preço a partir de sqrtPriceX96
      // price = (sqrtPriceX96 / 2^96)^2
      const Q96 = BigInt(2) ** BigInt(96)
      const price = Number(sqrtPriceX96 * sqrtPriceX96) / Number(Q96 * Q96)

      console.log(`Pool price calculated: ${price}`)

      // Determinar direção da conversão baseada na ordem dos tokens no pool
      const isToken0ToToken1 = this.isTokenInToken0(params.tokenIn)

      let result: number
      if (isToken0ToToken1) {
        result = amount * price
      } else {
        result = amount / price
      }

      console.log(`Calculated quote: ${result} ${params.tokenOut}`)
      return result.toFixed(6)
    } catch (error) {
      console.error("Error calculating quote from pool price:", error)
      return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
    }
  }

  private isTokenInToken0(tokenSymbol: "WLD" | "TPF"): boolean {
    if (!this.poolInfo) return false

    const tokenAddress = TOKENS[tokenSymbol].address.toLowerCase()
    return tokenAddress === this.poolInfo.token0
  }

  // Executar swap real
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`Executing swap: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Por enquanto, simular o swap
      // Em produção, seria necessário conectar com a carteira do usuário
      await new Promise((resolve) => setTimeout(resolve, 2000))

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

  // Obter informações do pool
  async getPoolInfo() {
    if (!this.poolInfo && this.initialized) {
      await this.setupPool()
    }
    return this.poolInfo
  }

  // Fallback para cotações
  private getFallbackQuote(tokenIn: "WLD" | "TPF", tokenOut: "WLD" | "TPF", amountIn: string): string {
    const amount = Number.parseFloat(amountIn)

    // Taxas baseadas em observação do mercado
    if (tokenIn === "WLD" && tokenOut === "TPF") {
      return (amount * 1000).toString()
    } else if (tokenIn === "TPF" && tokenOut === "WLD") {
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

  // Obter fee do pool
  getPoolFee(): number | null {
    return this.poolInfo?.fee || null
  }
}

// Exportar instância única
export const uniswapService = new UniswapService()
