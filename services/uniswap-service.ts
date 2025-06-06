import { ethers } from "ethers"

// Configuração da WorldChain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços dos contratos Uniswap na WorldChain (baseados na documentação)
const UNISWAP_CONTRACTS = {
  FACTORY_V3: "0x7a5028BDa40e7B173C278C5342087826455ea25a",
  SWAP_ROUTER_02: "0x091AD9e2e6cc414deE1eB45135672a30bcFEec9de3",
  QUOTER_V2: "0x10158D43e6cc414deE1eB45135672a30bcFEec9de3",
  WETH: "0x4200000000000000000000000000000000000006",
  // Pool TPF/WLD real verificado
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

// ABI do QuoterV2 - versão completa para garantir compatibilidade
const QUOTER_V2_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      { internalType: "uint32", name: "initializedTicksCrossed", type: "uint32" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// ABI do Pool V3
const POOL_V3_ABI = [
  {
    inputs: [],
    name: "fee",
    outputs: [{ internalType: "uint24", name: "", type: "uint24" }],
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
]

// ABI do ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

// ABI do SwapRouter02
const SWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
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
  fee: number
  feePercent: number
  token0: string
  token1: string
  liquidity: string
  sqrtPriceX96: string
  tick: number
  isValid: boolean
  isActive: boolean
}

class UniswapService {
  private provider: ethers.JsonRpcProvider | null = null
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
      console.log("🔄 Initializing Uniswap Service...")

      // Criar provider com configurações otimizadas
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to WorldChain: ${network.chainId}`)

      // Inicializar contratos
      this.quoter = new ethers.Contract(UNISWAP_CONTRACTS.QUOTER_V2, QUOTER_V2_ABI, this.provider)
      this.pool = new ethers.Contract(UNISWAP_CONTRACTS.TPF_WLD_POOL, POOL_V3_ABI, this.provider)
      this.swapRouter = new ethers.Contract(UNISWAP_CONTRACTS.SWAP_ROUTER_02, SWAP_ROUTER_ABI, this.provider)

      console.log("📋 Contract addresses:")
      console.log(`QuoterV2: ${UNISWAP_CONTRACTS.QUOTER_V2}`)
      console.log(`Pool: ${UNISWAP_CONTRACTS.TPF_WLD_POOL}`)
      console.log(`SwapRouter: ${UNISWAP_CONTRACTS.SWAP_ROUTER_02}`)

      // Verificar e configurar pool
      await this.setupPool()

      this.initialized = true
      console.log("✅ Uniswap Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Uniswap Service:", error)
      throw error
    }
  }

  private async setupPool() {
    if (!this.pool) return

    try {
      console.log("🔍 Verifying TPF/WLD pool...")

      // Obter informações do pool
      const [fee, token0, token1, liquidity, slot0] = await Promise.all([
        this.pool.fee(),
        this.pool.token0(),
        this.pool.token1(),
        this.pool.liquidity(),
        this.pool.slot0(),
      ])

      // Verificar se os tokens correspondem
      const isValidPool = this.validatePoolTokens(token0, token1)
      const hasLiquidity = liquidity > 0n

      this.poolInfo = {
        address: UNISWAP_CONTRACTS.TPF_WLD_POOL,
        fee: Number(fee),
        feePercent: Number(fee) / 10000,
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0[0].toString(),
        tick: Number(slot0[1]),
        isValid: isValidPool,
        isActive: hasLiquidity,
      }

      console.log("📊 Pool Information:")
      console.log(`├─ Address: ${this.poolInfo.address}`)
      console.log(`├─ Fee: ${this.poolInfo.fee} (${this.poolInfo.feePercent}%)`)
      console.log(`├─ Token0: ${this.poolInfo.token0}`)
      console.log(`├─ Token1: ${this.poolInfo.token1}`)
      console.log(`├─ Liquidity: ${this.poolInfo.liquidity}`)
      console.log(`├─ Current Tick: ${this.poolInfo.tick}`)
      console.log(`├─ Valid: ${this.poolInfo.isValid ? "✅" : "❌"}`)
      console.log(`└─ Active: ${this.poolInfo.isActive ? "✅" : "❌"}`)

      if (!this.poolInfo.isValid) {
        throw new Error("Pool tokens don't match expected TPF/WLD addresses")
      }

      if (!this.poolInfo.isActive) {
        throw new Error("Pool has no liquidity")
      }

      console.log("✅ Pool TPF/WLD verified and active")
    } catch (error) {
      console.error("❌ Error setting up pool:", error)
      throw error
    }
  }

  private validatePoolTokens(token0: string, token1: string): boolean {
    const tpfAddress = TOKENS.TPF.address.toLowerCase()
    const wldAddress = TOKENS.WLD.address.toLowerCase()

    return (
      (token0.toLowerCase() === tpfAddress && token1.toLowerCase() === wldAddress) ||
      (token0.toLowerCase() === wldAddress && token1.toLowerCase() === tpfAddress)
    )
  }

  // Obter saldos reais da carteira
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.provider) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

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

          console.log(`├─ ${symbol}: ${formattedBalance}`)
        } catch (error) {
          console.error(`❌ Error getting ${symbol} balance:`, error)
          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: "0",
            formattedBalance: "0.000000",
          })
        }
      }

      return balances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      return [
        { symbol: "WLD", balance: "0", formattedBalance: "0.000000" },
        { symbol: "TPF", balance: "0", formattedBalance: "0.000000" },
      ]
    }
  }

  // Obter cotação REAL usando QuoterV2 da Uniswap
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return params.amountIn
      }

      if (!this.quoter || !this.poolInfo) {
        throw new Error("Quoter or pool not initialized")
      }

      if (!this.poolInfo.isValid || !this.poolInfo.isActive) {
        throw new Error("Pool is not valid or active")
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      // Converter amount para wei
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      console.log(`💱 Getting REAL quote from Uniswap:`)
      console.log(`├─ Input: ${params.amountIn} ${params.tokenIn}`)
      console.log(`├─ Output Token: ${params.tokenOut}`)
      console.log(`├─ Pool Fee: ${this.poolInfo.feePercent}%`)
      console.log(`└─ Amount In (wei): ${amountIn.toString()}`)

      // Parâmetros para o QuoterV2 (estrutura correta)
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: this.poolInfo.fee,
        amountIn: amountIn,
        sqrtPriceLimitX96: 0n, // Sem limite de preço
      }

      try {
        // Chamar QuoterV2 com staticCall para simular
        console.log("🔄 Calling QuoterV2...")
        const result = await this.quoter.quoteExactInputSingle.staticCall(quoteParams)

        const amountOut = result[0] // Primeiro elemento é amountOut
        const sqrtPriceX96After = result[1]
        const initializedTicksCrossed = result[2]
        const gasEstimate = result[3]

        // Converter de volta para formato legível
        const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

        console.log(`✅ Real Uniswap Quote Result:`)
        console.log(`├─ Amount Out: ${formattedAmount} ${params.tokenOut}`)
        console.log(`├─ Price After: ${sqrtPriceX96After.toString()}`)
        console.log(`├─ Ticks Crossed: ${initializedTicksCrossed}`)
        console.log(`└─ Gas Estimate: ${gasEstimate.toString()}`)

        return formattedAmount
      } catch (quoterError: any) {
        console.error("❌ QuoterV2 call failed:", quoterError)

        // Log detalhado do erro
        if (quoterError.reason) {
          console.error(`Reason: ${quoterError.reason}`)
        }
        if (quoterError.code) {
          console.error(`Code: ${quoterError.code}`)
        }
        if (quoterError.data) {
          console.error(`Data: ${quoterError.data}`)
        }

        throw new Error(`Failed to get real quote from Uniswap: ${quoterError.message}`)
      }
    } catch (error) {
      console.error("❌ Error getting quote:", error)
      throw error
    }
  }

  // Executar swap real usando MiniKit
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.poolInfo || !this.poolInfo.isValid || !this.poolInfo.isActive) {
        throw new Error("Pool not ready for swapping")
      }

      console.log(`🔄 Executing swap via MiniKit:`)
      console.log(`├─ ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)
      console.log(`└─ Minimum Out: ${params.amountOutMinimum}`)

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

        console.log("📱 MiniKit available, executing real swap...")

        // Primeiro, aprovar o token se necessário
        await this.approveTokenIfNeeded(tokenIn.address, amountIn.toString(), params.recipient)

        // Preparar parâmetros para o swap
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
          value: "0x0",
          data: swapData,
        }

        console.log("📤 Sending transaction via MiniKit...")

        // Enviar transação via MiniKit
        const result = await MiniKit.commandsAsync.sendTransaction(transaction)

        if (result.success) {
          console.log("✅ Swap executed successfully:", result.transaction_id)
          return result.transaction_id
        } else {
          throw new Error(`Swap failed: ${result.error_code}`)
        }
      } else {
        throw new Error("MiniKit not available. Please use World App.")
      }
    } catch (error) {
      console.error("❌ Error executing swap:", error)
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

        console.log(`🔍 Checking token approval:`)
        console.log(`├─ Current allowance: ${currentAllowance.toString()}`)
        console.log(`└─ Required amount: ${amount}`)

        // Se allowance é suficiente, não precisa aprovar
        if (currentAllowance >= BigInt(amount)) {
          console.log("✅ Sufficient allowance, no approval needed")
          return
        }

        console.log("🔄 Approval needed, sending approval transaction...")

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
          console.log("✅ Token approved successfully:", result.transaction_id)
        } else {
          throw new Error(`Approval failed: ${result.error_code}`)
        }
      }
    } catch (error) {
      console.error("❌ Error approving token:", error)
      throw error
    }
  }

  // Obter informações dos tokens
  getTokens() {
    return TOKENS
  }

  // Obter informações do pool
  async getPoolInfo(): Promise<PoolInfo | null> {
    if (!this.poolInfo && this.initialized) {
      await this.setupPool()
    }
    return this.poolInfo
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
