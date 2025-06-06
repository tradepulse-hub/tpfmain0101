import { ethers } from "ethers"
import { MulticallService, type MulticallCall } from "./multicall-service"

// Configuração da WorldChain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Endereços dos contratos Uniswap na WorldChain
const UNISWAP_CONTRACTS = {
  FACTORY_V3: "0x7a5028BDa40e7B173C278C5342087826455ea25a",
  SWAP_ROUTER_02: "0x091AD9e2e6cc414deE1eB45135672a30bcFEec9de3",
  QUOTER_V2: "0x10158D43e6cc414deE1eB45135672a30bcFEec9de3",
  WETH: "0x4200000000000000000000000000000000000006",
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

// ABIs
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

const POOL_V3_ABI = [
  "function fee() external view returns (uint24)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function liquidity() external view returns (uint128)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
]

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

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

interface BatchQuoteResult {
  quotes: { [key: string]: string }
  poolInfo: PoolInfo
  balances: TokenBalance[]
  timestamp: number
}

class UniswapService {
  private provider: ethers.JsonRpcProvider | null = null
  private multicall: MulticallService | null = null
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
      console.log("🔄 Initializing Enhanced Uniswap Service with Multicall3...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Inicializar Multicall3
      this.multicall = new MulticallService(this.provider)

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to WorldChain: ${network.chainId}`)

      // Inicializar contratos
      this.quoter = new ethers.Contract(UNISWAP_CONTRACTS.QUOTER_V2, QUOTER_V2_ABI, this.provider)
      this.pool = new ethers.Contract(UNISWAP_CONTRACTS.TPF_WLD_POOL, POOL_V3_ABI, this.provider)
      this.swapRouter = new ethers.Contract(UNISWAP_CONTRACTS.SWAP_ROUTER_02, SWAP_ROUTER_ABI, this.provider)

      // Verificar pool usando Multicall3
      await this.setupPoolWithMulticall()

      this.initialized = true
      console.log("✅ Enhanced Uniswap Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Enhanced Uniswap Service:", error)
    }
  }

  // Configurar pool usando Multicall3 para otimizar
  private async setupPoolWithMulticall() {
    if (!this.pool || !this.multicall) return

    try {
      console.log("🔍 Verifying TPF/WLD pool with Multicall3...")

      // Preparar calls para obter todas as informações do pool em uma única chamada
      const calls: MulticallCall[] = [
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool, "fee", []),
        },
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool, "token0", []),
        },
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool, "token1", []),
        },
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool, "liquidity", []),
        },
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool, "slot0", []),
        },
      ]

      // Executar todas as calls em uma única transação
      const result = await this.multicall.multicall(calls)

      // Decodificar resultados
      const fee = this.multicall.decodeResult(this.pool, "fee", result.results[0].returnData)[0]
      const token0 = this.multicall.decodeResult(this.pool, "token0", result.results[1].returnData)[0]
      const token1 = this.multicall.decodeResult(this.pool, "token1", result.results[2].returnData)[0]
      const liquidity = this.multicall.decodeResult(this.pool, "liquidity", result.results[3].returnData)[0]
      const slot0 = this.multicall.decodeResult(this.pool, "slot0", result.results[4].returnData)

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

      console.log("📊 Pool Information (via Multicall3):")
      console.log(`├─ Block: ${result.blockNumber}`)
      console.log(`├─ Address: ${this.poolInfo.address}`)
      console.log(`├─ Fee: ${this.poolInfo.fee} (${this.poolInfo.feePercent}%)`)
      console.log(`├─ Token0: ${this.poolInfo.token0}`)
      console.log(`├─ Token1: ${this.poolInfo.token1}`)
      console.log(`├─ Liquidity: ${this.poolInfo.liquidity}`)
      console.log(`├─ Current Tick: ${this.poolInfo.tick}`)
      console.log(`├─ sqrtPriceX96: ${this.poolInfo.sqrtPriceX96}`)
      console.log(`├─ Valid: ${this.poolInfo.isValid ? "✅" : "❌"}`)
      console.log(`└─ Active: ${this.poolInfo.isActive ? "✅" : "❌"}`)

      if (this.poolInfo.isValid && this.poolInfo.isActive) {
        console.log("✅ Pool TPF/WLD verified and ready (via Multicall3)")
      }
    } catch (error) {
      console.error("❌ Error setting up pool with Multicall3:", error)
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

  // Obter saldos usando Multicall3 para otimizar
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.provider || !this.multicall) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances via Multicall3 for: ${walletAddress}`)

      // Preparar calls para obter saldos de ambos os tokens
      const calls: MulticallCall[] = []

      for (const [symbol, token] of Object.entries(TOKENS)) {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
        calls.push({
          target: token.address,
          gasLimit: 100000,
          callData: this.multicall!.createCallData(tokenContract, "balanceOf", [walletAddress]),
        })
      }

      // Executar todas as calls
      const result = await this.multicall!.multicall(calls)

      const balances: TokenBalance[] = []
      let callIndex = 0

      for (const [symbol, token] of Object.entries(TOKENS)) {
        try {
          const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
          const balance = this.multicall!.decodeResult(
            tokenContract,
            "balanceOf",
            result.results[callIndex].returnData,
          )[0]
          const formattedBalance = ethers.formatUnits(balance, token.decimals)

          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: balance.toString(),
            formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
          })

          console.log(`├─ ${symbol}: ${formattedBalance}`)
          callIndex++
        } catch (error) {
          console.error(`❌ Error processing ${symbol} balance:`, error)
          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: "0",
            formattedBalance: "0.000000",
          })
        }
      }

      console.log(`✅ Balances retrieved via Multicall3 at block ${result.blockNumber}`)
      return balances
    } catch (error) {
      console.error("❌ Error getting token balances via Multicall3:", error)
      return [
        { symbol: "WLD", balance: "0", formattedBalance: "0.000000" },
        { symbol: "TPF", balance: "0", formattedBalance: "0.000000" },
      ]
    }
  }

  // Obter cotação otimizada com Multicall3
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return params.amountIn
      }

      if (!this.quoter || !this.poolInfo || !this.multicall) {
        throw new Error("Service not properly initialized")
      }

      if (!this.poolInfo.isValid || !this.poolInfo.isActive) {
        throw new Error("Pool is not valid or active")
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      console.log(`💱 Getting optimized quote via Multicall3:`)
      console.log(`├─ Input: ${params.amountIn} ${params.tokenIn}`)
      console.log(`├─ Output Token: ${params.tokenOut}`)
      console.log(`└─ Pool Fee: ${this.poolInfo.feePercent}%`)

      // Preparar parâmetros para o QuoterV2
      const quoteParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: this.poolInfo.fee,
        amountIn: amountIn,
        sqrtPriceLimitX96: 0n,
      }

      try {
        // Tentar QuoterV2 primeiro (método direto)
        const result = await this.quoter.quoteExactInputSingle.staticCall(quoteParams)
        const amountOut = result[0]
        const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

        console.log(`✅ QuoterV2 Result: ${formattedAmount} ${params.tokenOut}`)
        return formattedAmount
      } catch (quoterError) {
        console.warn("⚠️ QuoterV2 failed, using pool price calculation...")
        return await this.calculatePriceFromPool(params)
      }
    } catch (error) {
      console.error("❌ Error getting optimized quote:", error)
      throw error
    }
  }

  // Método para obter múltiplas cotações e informações em uma única call
  async getBatchQuoteData(walletAddress: string, quoteParams: QuoteParams[]): Promise<BatchQuoteResult> {
    try {
      if (!this.initialized || !this.multicall) {
        await this.initialize()
      }

      console.log(`🚀 Getting batch data via Multicall3...`)

      const calls: MulticallCall[] = []

      // 1. Adicionar calls para saldos dos tokens
      for (const [symbol, token] of Object.entries(TOKENS)) {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
        calls.push({
          target: token.address,
          gasLimit: 100000,
          callData: this.multicall.createCallData(tokenContract, "balanceOf", [walletAddress]),
        })
      }

      // 2. Adicionar calls para informações do pool
      calls.push(
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool!, "slot0", []),
        },
        {
          target: UNISWAP_CONTRACTS.TPF_WLD_POOL,
          gasLimit: 100000,
          callData: this.multicall.createCallData(this.pool!, "liquidity", []),
        },
      )

      // 3. Adicionar timestamp
      calls.push({
        target: "0x0a22c04215c97E3F532F4eF30e0aD9458792dAB9", // Multicall3 address
        gasLimit: 50000,
        callData: "0x0f28c97d", // getCurrentBlockTimestamp()
      })

      // Executar todas as calls
      const result = await this.multicall.multicall(calls)

      // Processar resultados
      const balances: TokenBalance[] = []
      let callIndex = 0

      // Processar saldos
      for (const [symbol, token] of Object.entries(TOKENS)) {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
        const balance = this.multicall.decodeResult(tokenContract, "balanceOf", result.results[callIndex].returnData)[0]
        const formattedBalance = ethers.formatUnits(balance, token.decimals)

        balances.push({
          symbol: symbol as "WLD" | "TPF",
          balance: balance.toString(),
          formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
        })
        callIndex++
      }

      // Processar informações do pool
      const slot0 = this.multicall.decodeResult(this.pool!, "slot0", result.results[callIndex].returnData)
      const liquidity = this.multicall.decodeResult(
        this.pool!,
        "liquidity",
        result.results[callIndex + 1].returnData,
      )[0]

      // Atualizar pool info
      if (this.poolInfo) {
        this.poolInfo.sqrtPriceX96 = slot0[0].toString()
        this.poolInfo.tick = Number(slot0[1])
        this.poolInfo.liquidity = liquidity.toString()
      }

      // Processar timestamp
      const timestampData = result.results[callIndex + 2].returnData
      const timestamp = Number(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], timestampData)[0])

      // Calcular cotações para todos os parâmetros solicitados
      const quotes: { [key: string]: string } = {}
      for (const params of quoteParams) {
        try {
          const quote = await this.getQuote(params)
          quotes[`${params.tokenIn}_${params.tokenOut}_${params.amountIn}`] = quote
        } catch (error) {
          console.error(`Error getting quote for ${params.tokenIn}->${params.tokenOut}:`, error)
          quotes[`${params.tokenIn}_${params.tokenOut}_${params.amountIn}`] = "0"
        }
      }

      console.log(`✅ Batch data retrieved at block ${result.blockNumber}`)

      return {
        quotes,
        poolInfo: this.poolInfo!,
        balances,
        timestamp,
      }
    } catch (error) {
      console.error("❌ Error getting batch quote data:", error)
      throw error
    }
  }

  // Calcular preço baseado no sqrtPriceX96 do pool
  private async calculatePriceFromPool(params: QuoteParams): Promise<string> {
    try {
      if (!this.poolInfo) {
        throw new Error("Pool info not available")
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]
      const amountIn = Number.parseFloat(params.amountIn)

      const sqrtPriceX96 = BigInt(this.poolInfo.sqrtPriceX96)
      const Q96 = 2n ** 96n
      const price = Number((sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96))

      const token0Address = this.poolInfo.token0
      const token1Address = this.poolInfo.token1
      const tokenInAddress = tokenIn.address.toLowerCase()
      const tokenOutAddress = tokenOut.address.toLowerCase()

      let finalPrice: number
      let amountOut: number

      if (tokenInAddress === token0Address && tokenOutAddress === token1Address) {
        finalPrice = price
        amountOut = amountIn * finalPrice
      } else if (tokenInAddress === token1Address && tokenOutAddress === token0Address) {
        finalPrice = 1 / price
        amountOut = amountIn * finalPrice
      } else {
        throw new Error("Token addresses don't match pool tokens")
      }

      console.log(`🧮 Pool-based calculation: ${amountOut} ${params.tokenOut}`)
      return amountOut.toString()
    } catch (error) {
      console.error("❌ Error calculating price from pool:", error)
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

      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)
      const amountOutMinimum = ethers.parseUnits(params.amountOutMinimum, tokenOut.decimals)
      const deadline = Math.floor(Date.now() / 1000) + 1200

      if (typeof window !== "undefined" && (window as any).MiniKit) {
        const MiniKit = (window as any).MiniKit

        console.log("📱 MiniKit available, executing real swap...")

        await this.approveTokenIfNeeded(tokenIn.address, amountIn.toString(), params.recipient)

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

        const swapData = this.swapRouter!.interface.encodeFunctionData("exactInputSingle", [swapParams])

        const transaction = {
          to: UNISWAP_CONTRACTS.SWAP_ROUTER_02,
          value: "0x0",
          data: swapData,
        }

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

  private async approveTokenIfNeeded(tokenAddress: string, amount: string, userAddress: string): Promise<void> {
    try {
      if (typeof window !== "undefined" && (window as any).MiniKit) {
        const MiniKit = (window as any).MiniKit

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)
        const currentAllowance = await tokenContract.allowance(userAddress, UNISWAP_CONTRACTS.SWAP_ROUTER_02)

        if (currentAllowance >= BigInt(amount)) {
          console.log("✅ Sufficient allowance, no approval needed")
          return
        }

        console.log("🔄 Approval needed, sending approval transaction...")

        const approvalData = tokenContract.interface.encodeFunctionData("approve", [
          UNISWAP_CONTRACTS.SWAP_ROUTER_02,
          amount,
        ])

        const approvalTransaction = {
          to: tokenAddress,
          value: "0x0",
          data: approvalData,
        }

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

  getTokens() {
    return TOKENS
  }

  async getPoolInfo(): Promise<PoolInfo | null> {
    if (!this.poolInfo && this.initialized) {
      await this.setupPoolWithMulticall()
    }
    return this.poolInfo
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getContractAddresses() {
    return UNISWAP_CONTRACTS
  }

  getPoolFee(): number | null {
    return this.poolInfo?.fee || null
  }
}

export const uniswapService = new UniswapService()
