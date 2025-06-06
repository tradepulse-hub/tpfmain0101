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
]

// ABI completa do Pool V3 (fornecida pelo usuário)
const POOL_V3_ABI = [
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fee",
    outputs: [{ internalType: "uint24", name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidity",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "slot0",
    outputs: [
      { internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
      { internalType: "int24", name: "tick", type: "int24" },
      { internalType: "uint16", name: "observationIndex", type: "uint16" },
      { internalType: "uint16", name: "observationCardinality", type: "uint16" },
      { internalType: "uint16", name: "observationCardinalityNext", type: "uint16" },
      { internalType: "uint8", name: "feeProtocol", type: "uint8" },
      { internalType: "bool", name: "unlocked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tickSpacing",
    outputs: [{ internalType: "int24", name: "", type: "int24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "bool", name: "zeroForOne", type: "bool" },
      { internalType: "int256", name: "amountSpecified", type: "int256" },
      { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "swap",
    outputs: [
      { internalType: "int256", name: "amount0", type: "int256" },
      { internalType: "int256", name: "amount1", type: "int256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// ABI do QuoterV2
const QUOTER_V2_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]

// ABI do SwapRouter02
const SWAP_ROUTER_02_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
]

// ABI do ERC20
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
      console.log("Initializing Uniswap Service...")

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
      this.pool = new ethers.Contract(UNISWAP_CONTRACTS.TPF_WLD_POOL, POOL_V3_ABI, this.provider)

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

      if (!this.pool) return

      // Verificar informações do pool usando a ABI completa
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
        console.log("✅ Pool TPF/WLD verified successfully")
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

  // Obter cotação usando QuoterV2
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

      // Usar QuoterV2
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: this.poolInfo.fee,
        amountIn: amountIn,
        sqrtPriceLimitX96: 0n,
      }

      try {
        const result = await this.quoter.quoteExactInputSingle.staticCall(quoteParams)
        const amountOut = result[0]
        const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

        console.log(`Quote from QuoterV2: ${formattedAmount} ${params.tokenOut}`)
        return formattedAmount
      } catch (quoterError) {
        console.warn("QuoterV2 failed, using fallback:", quoterError)
        return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
      }
    } catch (error) {
      console.error("Error getting quote:", error)
      return this.getFallbackQuote(params.tokenIn, params.tokenOut, params.amountIn)
    }
  }

  // Executar swap real usando MiniKit (sem janela simulada)
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.poolInfo) {
        throw new Error("Pool not initialized")
      }

      console.log(`Executing swap via MiniKit: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      // Converter valores para wei
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)
      const amountOutMinimum = ethers.parseUnits(params.amountOutMinimum, tokenOut.decimals)

      // Deadline: 20 minutos a partir de agora
      const deadline = Math.floor(Date.now() / 1000) + 1200

      // Verificar se MiniKit está disponível
      if (typeof window !== "undefined" && (window as any).MiniKit) {
        const MiniKit = (window as any).MiniKit

        console.log("MiniKit available, executing real swap...")

        // Primeiro, aprovar o token se necessário
        await this.approveTokenIfNeeded(tokenIn.address, amountIn.toString(), params.recipient)

        // Preparar dados para o swap via SwapRouter02
        const swapParams = {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          fee: this.poolInfo.fee,
          recipient: params.recipient,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        }

        // Codificar a chamada para o SwapRouter02
        const swapData = this.swapRouter!.interface.encodeFunctionData("exactInputSingle", [swapParams])

        const transaction = {
          to: UNISWAP_CONTRACTS.SWAP_ROUTER_02,
          value: "0x0", // Não é ETH
          data: swapData,
        }

        console.log("Sending transaction via MiniKit:", transaction)

        // Enviar transação via MiniKit - isso vai abrir a janela nativa do World App
        const result = await MiniKit.commandsAsync.sendTransaction(transaction)

        if (result.success) {
          console.log("Swap executed successfully:", result.transaction_id)
          return result.transaction_id
        } else {
          throw new Error(`Swap failed: ${result.error_code}`)
        }
      } else {
        throw new Error("MiniKit not available. Please use World App.")
      }
    } catch (error) {
      console.error("Error executing swap:", error)
      throw error
    }
  }

  // Aprovar token se necessário
  private async approveTokenIfNeeded(tokenAddress: string, amount: string, userAddress: string): Promise<void> {
    try {
      if (typeof window !== "undefined" && (window as any).MiniKit) {
        const MiniKit = (window as any).MiniKit

        // Verificar allowance atual
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const currentAllowance = await tokenContract.allowance(userAddress, UNISWAP_CONTRACTS.SWAP_ROUTER_02)

        console.log(`Current allowance: ${currentAllowance.toString()}`)
        console.log(`Required amount: ${amount}`)

        // Se allowance é suficiente, não precisa aprovar
        if (currentAllowance >= BigInt(amount)) {
          console.log("Sufficient allowance, no approval needed")
          return
        }

        console.log("Approval needed, sending approval transaction...")

        // Preparar transação de aprovação
        const approvalData = tokenContract.interface.encodeFunctionData("approve", [
          UNISWAP_CONTRACTS.SWAP_ROUTER_02,
          amount,
        ])

        const approvalTransaction = {
          to: tokenAddress,
          value: "0x0",
          data: approvalData,
        }

        // Enviar aprovação via MiniKit
        const result = await MiniKit.commandsAsync.sendTransaction(approvalTransaction)

        if (result.success) {
          console.log("Token approved successfully:", result.transaction_id)
        } else {
          throw new Error(`Approval failed: ${result.error_code}`)
        }
      }
    } catch (error) {
      console.error("Error approving token:", error)
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
