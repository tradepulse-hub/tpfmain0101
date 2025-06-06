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
  TPF_WLD_POOL: "0xEE08Cef6EbCe1e037fFdbDF6ab657E5C19E86FF3",
}

// Tokens TPF e WLD - vamos verificar estes endereços
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

// ABIs simplificados
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

const POOL_V3_ABI = [
  "function fee() external view returns (uint24)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function liquidity() external view returns (uint128)",
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
]

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
      console.log("🔄 Initializing Uniswap Service (Simplified)...")

      // Criar provider
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
      console.log(`├─ QuoterV2: ${UNISWAP_CONTRACTS.QUOTER_V2}`)
      console.log(`├─ Pool: ${UNISWAP_CONTRACTS.TPF_WLD_POOL}`)
      console.log(`├─ SwapRouter: ${UNISWAP_CONTRACTS.SWAP_ROUTER_02}`)
      console.log(`├─ WLD Token: ${TOKENS.WLD.address}`)
      console.log(`└─ TPF Token: ${TOKENS.TPF.address}`)

      // Verificar contratos individualmente
      await this.verifyContracts()

      // Verificar pool
      await this.setupPool()

      this.initialized = true
      console.log("✅ Uniswap Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Uniswap Service:", error)
    }
  }

  // Verificar se os contratos existem e são válidos
  private async verifyContracts() {
    try {
      console.log("🔍 Verifying contracts...")

      // Verificar tokens
      for (const [symbol, token] of Object.entries(TOKENS)) {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
          const [name, symbol_contract, decimals] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals(),
          ])

          console.log(`✅ ${symbol} Token verified:`)
          console.log(`   ├─ Name: ${name}`)
          console.log(`   ├─ Symbol: ${symbol_contract}`)
          console.log(`   └─ Decimals: ${decimals}`)
        } catch (error) {
          console.error(`❌ Error verifying ${symbol} token:`, error)
        }
      }

      // Verificar pool
      try {
        const [fee, token0, token1, liquidity] = await Promise.all([
          this.pool!.fee(),
          this.pool!.token0(),
          this.pool!.token1(),
          this.pool!.liquidity(),
        ])

        console.log(`✅ Pool verified:`)
        console.log(`   ├─ Fee: ${fee} (${Number(fee) / 10000}%)`)
        console.log(`   ├─ Token0: ${token0}`)
        console.log(`   ├─ Token1: ${token1}`)
        console.log(`   └─ Liquidity: ${liquidity.toString()}`)
      } catch (error) {
        console.error(`❌ Error verifying pool:`, error)
      }
    } catch (error) {
      console.error("❌ Error in contract verification:", error)
    }
  }

  private async setupPool() {
    if (!this.pool) return

    try {
      console.log("🔍 Setting up pool...")

      const [fee, token0, token1, liquidity, slot0] = await Promise.all([
        this.pool.fee(),
        this.pool.token0(),
        this.pool.token1(),
        this.pool.liquidity(),
        this.pool.slot0(),
      ])

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
      console.log(`├─ sqrtPriceX96: ${this.poolInfo.sqrtPriceX96}`)
      console.log(`├─ Valid: ${this.poolInfo.isValid ? "✅" : "❌"}`)
      console.log(`└─ Active: ${this.poolInfo.isActive ? "✅" : "❌"}`)

      // Verificar qual token é qual
      console.log("🔍 Token mapping:")
      if (this.poolInfo.token0 === TOKENS.WLD.address.toLowerCase()) {
        console.log(`├─ Token0 = WLD (${TOKENS.WLD.address})`)
      } else if (this.poolInfo.token0 === TOKENS.TPF.address.toLowerCase()) {
        console.log(`├─ Token0 = TPF (${TOKENS.TPF.address})`)
      } else {
        console.log(`├─ Token0 = UNKNOWN (${this.poolInfo.token0})`)
      }

      if (this.poolInfo.token1 === TOKENS.WLD.address.toLowerCase()) {
        console.log(`└─ Token1 = WLD (${TOKENS.WLD.address})`)
      } else if (this.poolInfo.token1 === TOKENS.TPF.address.toLowerCase()) {
        console.log(`└─ Token1 = TPF (${TOKENS.TPF.address})`)
      } else {
        console.log(`└─ Token1 = UNKNOWN (${this.poolInfo.token1})`)
      }
    } catch (error) {
      console.error("❌ Error setting up pool:", error)
    }
  }

  private validatePoolTokens(token0: string, token1: string): boolean {
    const tpfAddress = TOKENS.TPF.address.toLowerCase()
    const wldAddress = TOKENS.WLD.address.toLowerCase()

    const isValid =
      (token0.toLowerCase() === tpfAddress && token1.toLowerCase() === wldAddress) ||
      (token0.toLowerCase() === wldAddress && token1.toLowerCase() === tpfAddress)

    console.log("🔍 Pool validation:")
    console.log(`├─ Expected TPF: ${tpfAddress}`)
    console.log(`├─ Expected WLD: ${wldAddress}`)
    console.log(`├─ Pool Token0: ${token0.toLowerCase()}`)
    console.log(`├─ Pool Token1: ${token1.toLowerCase()}`)
    console.log(`└─ Valid: ${isValid ? "✅" : "❌"}`)

    return isValid
  }

  // Obter saldos reais da carteira - versão simplificada
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.provider) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      const balances: TokenBalance[] = []

      for (const [symbol, token] of Object.entries(TOKENS)) {
        try {
          console.log(`🔍 Checking ${symbol} balance...`)
          console.log(`   ├─ Token address: ${token.address}`)
          console.log(`   └─ Wallet address: ${walletAddress}`)

          const contract = new ethers.Contract(token.address, ERC20_ABI, this.provider)

          // Verificar se o contrato existe
          const code = await this.provider.getCode(token.address)
          if (code === "0x") {
            console.error(`❌ No contract found at ${token.address} for ${symbol}`)
            balances.push({
              symbol: symbol as "WLD" | "TPF",
              balance: "0",
              formattedBalance: "0.000000",
            })
            continue
          }

          // Obter saldo
          const balance = await contract.balanceOf(walletAddress)
          const decimals = await contract.decimals()
          const formattedBalance = ethers.formatUnits(balance, decimals)

          console.log(`✅ ${symbol} balance: ${formattedBalance}`)
          console.log(`   ├─ Raw balance: ${balance.toString()}`)
          console.log(`   ├─ Decimals: ${decimals}`)
          console.log(`   └─ Formatted: ${formattedBalance}`)

          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: balance.toString(),
            formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
          })
        } catch (error) {
          console.error(`❌ Error getting ${symbol} balance:`, error)
          balances.push({
            symbol: symbol as "WLD" | "TPF",
            balance: "0",
            formattedBalance: "0.000000",
          })
        }
      }

      console.log("📊 Final balances:", balances)
      return balances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      return [
        { symbol: "WLD", balance: "0", formattedBalance: "0.000000" },
        { symbol: "TPF", balance: "0", formattedBalance: "0.000000" },
      ]
    }
  }

  // Obter cotação - versão simplificada
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return params.amountIn
      }

      if (!this.poolInfo || !this.poolInfo.isValid || !this.poolInfo.isActive) {
        console.warn("⚠️ Pool not ready, using fallback calculation")
        return this.getFallbackQuote(params)
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]
      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)

      console.log(`💱 Getting quote:`)
      console.log(`├─ Input: ${params.amountIn} ${params.tokenIn} (${tokenIn.address})`)
      console.log(`├─ Output: ${params.tokenOut} (${tokenOut.address})`)
      console.log(`├─ Amount (wei): ${amountIn.toString()}`)
      console.log(`└─ Pool fee: ${this.poolInfo.feePercent}%`)

      try {
        // Tentar QuoterV2
        const quoteParams = {
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          fee: this.poolInfo.fee,
          amountIn: amountIn,
          sqrtPriceLimitX96: 0n,
        }

        console.log("🔄 Calling QuoterV2...")
        const result = await this.quoter!.quoteExactInputSingle.staticCall(quoteParams)
        const amountOut = result[0]
        const formattedAmount = ethers.formatUnits(amountOut, tokenOut.decimals)

        console.log(`✅ QuoterV2 result: ${formattedAmount} ${params.tokenOut}`)
        return formattedAmount
      } catch (quoterError) {
        console.warn("⚠️ QuoterV2 failed, using pool calculation:", quoterError)
        return this.calculatePriceFromPool(params)
      }
    } catch (error) {
      console.error("❌ Error getting quote:", error)
      return this.getFallbackQuote(params)
    }
  }

  // Cálculo baseado no sqrtPriceX96 do pool
  private calculatePriceFromPool(params: QuoteParams): string {
    try {
      if (!this.poolInfo) {
        throw new Error("Pool info not available")
      }

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]
      const amountIn = Number.parseFloat(params.amountIn)

      const sqrtPriceX96 = BigInt(this.poolInfo.sqrtPriceX96)
      const Q96 = 2n ** 96n

      // Calcular preço: price = (sqrtPriceX96 / 2^96)^2
      const price = Number((sqrtPriceX96 * sqrtPriceX96) / (Q96 * Q96))

      console.log(`🧮 Pool calculation:`)
      console.log(`├─ sqrtPriceX96: ${sqrtPriceX96.toString()}`)
      console.log(`├─ Raw price: ${price}`)

      const token0Address = this.poolInfo.token0
      const tokenInAddress = tokenIn.address.toLowerCase()
      const tokenOutAddress = tokenOut.address.toLowerCase()

      let finalPrice: number
      let amountOut: number

      if (tokenInAddress === token0Address) {
        // Token0 -> Token1
        finalPrice = price
        amountOut = amountIn * finalPrice
        console.log(`├─ Direction: Token0 -> Token1`)
      } else {
        // Token1 -> Token0
        finalPrice = 1 / price
        amountOut = amountIn * finalPrice
        console.log(`├─ Direction: Token1 -> Token0`)
      }

      console.log(`├─ Final price: ${finalPrice}`)
      console.log(`└─ Amount out: ${amountOut}`)

      return amountOut.toFixed(6)
    } catch (error) {
      console.error("❌ Error calculating price from pool:", error)
      return this.getFallbackQuote(params)
    }
  }

  // Fallback simples baseado em observação
  private getFallbackQuote(params: QuoteParams): string {
    const amount = Number.parseFloat(params.amountIn)

    console.log(`🔄 Using fallback quote for ${params.tokenIn} -> ${params.tokenOut}`)

    if (params.tokenIn === "WLD" && params.tokenOut === "TPF") {
      // 1 WLD ≈ 75000 TPF (baseado na sua observação)
      const result = (amount * 75000).toString()
      console.log(`├─ Fallback: ${amount} WLD -> ${result} TPF`)
      return result
    } else if (params.tokenIn === "TPF" && params.tokenOut === "WLD") {
      // 75000 TPF ≈ 1 WLD
      const result = (amount / 75000).toString()
      console.log(`├─ Fallback: ${amount} TPF -> ${result} WLD`)
      return result
    }

    return params.amountIn
  }

  // Executar swap
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.poolInfo || !this.poolInfo.isValid || !this.poolInfo.isActive) {
        throw new Error("Pool not ready for swapping")
      }

      console.log(`🔄 Executing swap:`)
      console.log(`├─ ${params.amountIn} ${params.tokenIn} -> ${params.tokenOut}`)
      console.log(`└─ Minimum out: ${params.amountOutMinimum}`)

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      const amountIn = ethers.parseUnits(params.amountIn, tokenIn.decimals)
      const amountOutMinimum = ethers.parseUnits(params.amountOutMinimum, tokenOut.decimals)
      const deadline = Math.floor(Date.now() / 1000) + 1200

      if (typeof window !== "undefined" && (window as any).MiniKit) {
        const MiniKit = (window as any).MiniKit

        console.log("📱 Executing via MiniKit...")

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
          console.log("✅ Swap executed:", result.transaction_id)
          return result.transaction_id
        } else {
          throw new Error(`Swap failed: ${result.error_code}`)
        }
      } else {
        throw new Error("MiniKit not available")
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
          console.log("✅ Sufficient allowance")
          return
        }

        console.log("🔄 Approving token...")

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
          console.log("✅ Token approved:", result.transaction_id)
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
      await this.setupPool()
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
