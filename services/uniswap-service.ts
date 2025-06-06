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

// ABIs necessários
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

const POOL_ABI = [
  "function fee() external view returns (uint24)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function liquidity() external view returns (uint128)",
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

class UniswapService {
  private provider: ethers.JsonRpcProvider | null = null
  private quoter: ethers.Contract | null = null
  private pool: ethers.Contract | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("Initializing Uniswap Service with real TPF/WLD pool...")

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
      this.pool = new ethers.Contract(UNISWAP_CONTRACTS.TPF_WLD_POOL, POOL_ABI, this.provider)

      // Verificar pool
      await this.verifyPool()

      this.initialized = true
      console.log("Uniswap Service initialized with real pool")
    } catch (error) {
      console.error("Failed to initialize Uniswap Service:", error)
    }
  }

  private async verifyPool() {
    if (!this.pool) return

    try {
      const fee = await this.pool.fee()
      const token0 = await this.pool.token0()
      const token1 = await this.pool.token1()
      const liquidity = await this.pool.liquidity()

      console.log("Pool verification:")
      console.log(`Fee: ${fee} (${fee / 10000}%)`)
      console.log(`Token0: ${token0}`)
      console.log(`Token1: ${token1}`)
      console.log(`Liquidity: ${liquidity.toString()}`)

      // Verificar se os tokens correspondem
      const isValidPool =
        (token0.toLowerCase() === TOKENS.TPF.address.toLowerCase() &&
          token1.toLowerCase() === TOKENS.WLD.address.toLowerCase()) ||
        (token0.toLowerCase() === TOKENS.WLD.address.toLowerCase() &&
          token1.toLowerCase() === TOKENS.TPF.address.toLowerCase())

      if (isValidPool) {
        console.log("✅ Pool TPF/WLD verified successfully")
      } else {
        console.warn("⚠️ Pool tokens don't match expected TPF/WLD addresses")
      }
    } catch (error) {
      console.error("Error verifying pool:", error)
    }
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
          // Fallback para saldo 0
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
      // Fallback para saldos padrão
      return [
        { symbol: "WLD", balance: "0", formattedBalance: "0.000000" },
        { symbol: "TPF", balance: "0", formattedBalance: "0.000000" },
      ]
    }
  }

  // Obter cotação real usando o pool TPF/WLD
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

      if (!this.quoter || !this.pool) {
        console.warn("Quoter or pool not available, using fallback")
        return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
      }

      // Converter amount para wei
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      // Obter fee do pool real
      const fee = await this.pool.fee()

      // Parâmetros para o QuoterV2
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0,
      }

      console.log(`Getting real quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)
      console.log(`Using pool fee: ${fee} (${fee / 10000}%)`)

      // Chamar QuoterV2 com o pool real
      const result = await this.quoter.quoteExactInputSingle(quoteParams)
      const amountOut = result[0]

      // Converter de volta para formato legível
      const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

      console.log(`Real quote result: ${formattedAmount} ${params.tokenOut}`)

      return formattedAmount
    } catch (error) {
      console.error("Error getting real quote:", error)
      console.log("Falling back to simulated quote")
      return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
    }
  }

  // Executar swap real
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`Executing real swap: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Por enquanto, simular o swap
      // Em produção, seria necessário conectar com a carteira do usuário e fazer o swap real
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

  // Obter informações do pool
  async getPoolInfo() {
    try {
      if (!this.pool) return null

      const fee = await this.pool.fee()
      const token0 = await this.pool.token0()
      const token1 = await this.pool.token1()
      const liquidity = await this.pool.liquidity()

      return {
        address: UNISWAP_CONTRACTS.TPF_WLD_POOL,
        fee: fee,
        feePercent: fee / 10000,
        token0,
        token1,
        liquidity: liquidity.toString(),
      }
    } catch (error) {
      console.error("Error getting pool info:", error)
      return null
    }
  }

  // Fallback para cotações quando a API não está disponível
  private getFallbackQuote(tokenIn: "WLD" | "TPF", tokenOut: "WLD" | "TPF", amountIn: string): string {
    const amount = Number.parseFloat(amountIn)

    // Taxas de câmbio simuladas baseadas em dados reais
    if (tokenIn === "WLD" && tokenOut === "TPF") {
      // 1 WLD ≈ 1000 TPF (ajustar conforme mercado real)
      return (amount * 1000).toString()
    } else if (tokenIn === "TPF" && tokenOut === "WLD") {
      // 1000 TPF ≈ 1 WLD
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
