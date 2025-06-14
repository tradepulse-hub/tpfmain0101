import { ethers } from "ethers"
import type { TokenBalance, SwapQuote } from "./types"

// Configuração para Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens que queremos suportar - ENDEREÇOS CORRETOS E VERIFICADOS
const SUPPORTED_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // Worldcoin - VERIFICADO
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45", // TPulseFi - VERIFICADO
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113", // DNA Token - VERIFICADO
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B", // Drachma Token - VERIFICADO
}

// Pool Uniswap V3 WLD/TPF
const WLD_TPF_POOL = "0xEE08Cef6EbCe1e037fFdbDF6ab657E5C19E86FF3"

// ABI mínimo para Uniswap V3 Pool
const UNISWAP_V3_POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function liquidity() external view returns (uint128)",
]

// ABI mínimo para ERC20
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
]

class HoldstationService {
  private provider: ethers.JsonRpcProvider | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Direct Contract Service (sem SDK da Holdstation)...")

      // Setup provider com ethers v6
      this.provider = new ethers.JsonRpcProvider(
        RPC_URL,
        {
          chainId: CHAIN_ID,
          name: "worldchain",
        },
        {
          staticNetwork: true,
        },
      )

      // Verificar conexão
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to ${network.name} (${network.chainId})`)

      // Verificar se os tokens existem na blockchain
      console.log("🔍 Verificando tokens na blockchain...")
      await this.verifyTokenContracts()

      // Verificar pool de liquidez
      console.log("🏊 Verificando pool de liquidez...")
      await this.verifyLiquidityPool()

      this.initialized = true
      console.log("✅ Direct Contract Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Direct Contract Service:", error)
    }
  }

  private async verifyTokenContracts() {
    if (!this.provider) return

    console.log("🔍 Verificando contratos de tokens...")

    for (const [symbol, address] of Object.entries(SUPPORTED_TOKENS)) {
      try {
        const contract = new ethers.Contract(address, ERC20_ABI, this.provider)

        const [name, tokenSymbol, decimals, totalSupply] = await Promise.all([
          contract.name().catch(() => "Unknown"),
          contract.symbol().catch(() => symbol),
          contract.decimals().catch(() => 18),
          contract.totalSupply().catch(() => "0"),
        ])

        console.log(`✅ ${symbol}: ${name} (${tokenSymbol}) - ${decimals} decimals`)
        console.log(`💰 Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`)
      } catch (error) {
        console.error(`❌ Erro ao verificar token ${symbol}:`, error.message)
      }
    }
  }

  private async verifyLiquidityPool() {
    if (!this.provider) return

    try {
      console.log(`🏊 Verificando pool WLD/TPF: ${WLD_TPF_POOL}`)

      const poolContract = new ethers.Contract(WLD_TPF_POOL, UNISWAP_V3_POOL_ABI, this.provider)

      const [token0, token1, fee, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
      ])

      console.log(`✅ Pool verificada:`)
      console.log(`├─ Token0: ${token0}`)
      console.log(`├─ Token1: ${token1}`)
      console.log(`├─ Fee: ${fee} (${fee / 10000}%)`)
      console.log(`├─ Liquidity: ${liquidity.toString()}`)
      console.log(`└─ Current Price: ${slot0.sqrtPriceX96.toString()}`)

      // Calcular preço atual
      const price = this.calculatePriceFromSqrtPriceX96(slot0.sqrtPriceX96, token0, token1)
      console.log(`💱 Preço atual: ${price}`)
    } catch (error) {
      console.error("❌ Erro ao verificar pool:", error)
    }
  }

  private calculatePriceFromSqrtPriceX96(sqrtPriceX96: bigint, token0: string, token1: string): string {
    try {
      // Converter sqrtPriceX96 para preço
      const sqrtPrice = Number(sqrtPriceX96) / Math.pow(2, 96)
      const price = Math.pow(sqrtPrice, 2)

      // Determinar direção baseada nos tokens
      const isWLDToken0 = token0.toLowerCase() === SUPPORTED_TOKENS.WLD.toLowerCase()

      if (isWLDToken0) {
        // Se WLD é token0, preço é TPF por WLD
        return `1 WLD = ${price.toFixed(6)} TPF`
      } else {
        // Se TPF é token0, preço é WLD por TPF
        return `1 TPF = ${price.toFixed(6)} WLD`
      }
    } catch (error) {
      console.error("Erro ao calcular preço:", error)
      return "Preço indisponível"
    }
  }

  // Obter saldos de tokens reais
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.provider) {
        throw new Error("Provider not initialized")
      }

      console.log(`💰 Getting real token balances for: ${walletAddress}`)

      const tokenBalances: TokenBalance[] = []

      for (const [symbol, address] of Object.entries(SUPPORTED_TOKENS)) {
        try {
          console.log(`🔍 Checking balance for ${symbol} (${address})...`)

          const contract = new ethers.Contract(address, ERC20_ABI, this.provider)

          // Primeiro verificar se o contrato existe
          const code = await this.provider.getCode(address)
          if (code === "0x") {
            console.warn(`⚠️ No contract code at ${address} for ${symbol}`)
            continue
          }

          const [name, tokenSymbol, decimals, balance] = await Promise.all([
            contract.name().catch((e) => {
              console.warn(`Failed to get name for ${symbol}:`, e.message)
              return symbol
            }),
            contract.symbol().catch((e) => {
              console.warn(`Failed to get symbol for ${symbol}:`, e.message)
              return symbol
            }),
            contract.decimals().catch((e) => {
              console.warn(`Failed to get decimals for ${symbol}:`, e.message)
              return 18
            }),
            contract.balanceOf(walletAddress).catch((e) => {
              console.error(`Failed to get balance for ${symbol}:`, e.message)
              return "0"
            }),
          ])

          console.log(`📊 ${symbol} contract details:`)
          console.log(`├─ Name: ${name}`)
          console.log(`├─ Symbol: ${tokenSymbol}`)
          console.log(`├─ Decimals: ${decimals}`)
          console.log(`├─ Raw Balance: ${balance.toString()}`)

          const formattedBalance = ethers.formatUnits(balance, decimals)
          console.log(`└─ Formatted Balance: ${formattedBalance}`)

          tokenBalances.push({
            symbol: symbol,
            name: name,
            address: address,
            balance: Number.parseFloat(formattedBalance).toFixed(6),
            decimals: decimals,
            icon: this.getTokenIcon(symbol),
            formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
          })

          console.log(`✅ ${symbol}: ${formattedBalance} tokens`)
        } catch (error) {
          console.error(`❌ Error getting balance for ${symbol}:`, error)
          console.error(`├─ Error type: ${typeof error}`)
          console.error(`├─ Error message: ${error.message}`)
          console.error(`└─ Error stack: ${error.stack}`)

          // Add with 0 balance if error
          tokenBalances.push({
            symbol: symbol,
            name: symbol,
            address: address,
            balance: "0",
            decimals: 18,
            icon: this.getTokenIcon(symbol),
            formattedBalance: "0",
          })
        }
      }

      console.log(`📊 Final token balances:`, tokenBalances)
      return tokenBalances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      return []
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

  // Obter cotação de swap usando dados da pool diretamente
  async getSwapQuote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
  }): Promise<SwapQuote> {
    try {
      console.log("💱 OBTENDO COTAÇÃO usando dados diretos da pool...")
      console.log(
        `📊 Parâmetros: ${params.amountIn} ${this.getSymbolFromAddress(params.tokenIn)} → ${this.getSymbolFromAddress(params.tokenOut)}`,
      )

      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.provider) {
        throw new Error("Provider not initialized")
      }

      // Verificar se é o par WLD/TPF
      const isWLDTPFPair =
        (params.tokenIn.toLowerCase() === SUPPORTED_TOKENS.WLD.toLowerCase() &&
          params.tokenOut.toLowerCase() === SUPPORTED_TOKENS.TPF.toLowerCase()) ||
        (params.tokenIn.toLowerCase() === SUPPORTED_TOKENS.TPF.toLowerCase() &&
          params.tokenOut.toLowerCase() === SUPPORTED_TOKENS.WLD.toLowerCase())

      if (!isWLDTPFPair) {
        throw new Error("Only WLD/TPF pair is supported for direct pool quotes")
      }

      console.log("🏊 Obtendo dados da pool Uniswap V3...")

      const poolContract = new ethers.Contract(WLD_TPF_POOL, UNISWAP_V3_POOL_ABI, this.provider)
      const [token0, token1, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.slot0(),
      ])

      console.log(`📊 Pool data:`)
      console.log(`├─ Token0: ${token0}`)
      console.log(`├─ Token1: ${token1}`)
      console.log(`└─ SqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`)

      // Calcular preço atual
      const sqrtPrice = Number(slot0.sqrtPriceX96) / Math.pow(2, 96)
      const price = Math.pow(sqrtPrice, 2)

      console.log(`💱 Preço calculado: ${price}`)

      // Determinar direção da conversão
      const amountInNum = Number.parseFloat(params.amountIn)
      let amountOut: number

      const isWLDToken0 = token0.toLowerCase() === SUPPORTED_TOKENS.WLD.toLowerCase()
      const isInputWLD = params.tokenIn.toLowerCase() === SUPPORTED_TOKENS.WLD.toLowerCase()

      if (isWLDToken0) {
        // WLD é token0, TPF é token1
        if (isInputWLD) {
          // WLD → TPF
          amountOut = amountInNum * price
        } else {
          // TPF → WLD
          amountOut = amountInNum / price
        }
      } else {
        // TPF é token0, WLD é token1
        if (isInputWLD) {
          // WLD → TPF
          amountOut = amountInNum / price
        } else {
          // TPF → WLD
          amountOut = amountInNum * price
        }
      }

      // Aplicar slippage
      const slippagePercent = Number.parseFloat(params.slippage || "0.5") / 100
      const minReceived = amountOut * (1 - slippagePercent)

      console.log(`✅ COTAÇÃO CALCULADA:`)
      console.log(`├─ Input: ${params.amountIn} ${this.getSymbolFromAddress(params.tokenIn)}`)
      console.log(`├─ Output: ${amountOut.toFixed(6)} ${this.getSymbolFromAddress(params.tokenOut)}`)
      console.log(`├─ Rate: ${(amountOut / amountInNum).toFixed(6)}`)
      console.log(`└─ Min Received: ${minReceived.toFixed(6)}`)

      const quote: SwapQuote = {
        amountOut: amountOut.toFixed(6),
        data: "0x", // Mock data - seria necessário construir a transação real
        to: WLD_TPF_POOL, // Pool address
        value: "0",
        addons: {
          outAmount: amountOut.toFixed(6),
          rateSwap: (amountOut / amountInNum).toString(),
          amountOutUsd: (amountOut * 1.2).toFixed(2), // Mock USD value
          minReceived: minReceived.toFixed(6),
          feeAmountOut: (amountInNum * 0.003).toFixed(6), // 0.3% fee
        },
      }

      console.log("✅ Cotação formatada:", quote)
      return quote
    } catch (error) {
      console.error("❌ ERRO ao obter cotação da pool:", error)
      throw new Error(`Pool quote failed: ${error.message}`)
    }
  }

  private getSymbolFromAddress(address: string): string {
    const addressToSymbol: Record<string, string> = {
      "0x2cfc85d8e48f8eab294be644d9e25c3030863003": "WLD",
      "0x834a73c0a83f3bce349a116ffb2a4c2d1c651e45": "TPF",
      "0xed49fe44fd4249a09843c2ba4bba7e50beca7113": "DNA",
      "0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b": "WDD",
    }
    return addressToSymbol[address.toLowerCase()] || "UNKNOWN"
  }

  // Executar swap (mock - seria necessário integração real)
  async executeSwap(params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    slippage?: string
    fee?: string
    feeReceiver?: string
  }): Promise<string> {
    try {
      console.log("🚀 EXECUTANDO SWAP (MOCK)...")
      console.log(
        `📊 ${params.amountIn} ${this.getSymbolFromAddress(params.tokenIn)} → ${this.getSymbolFromAddress(params.tokenOut)}`,
      )

      // Para execução real, seria necessário:
      // 1. Construir a transação de swap
      // 2. Assinar com a carteira
      // 3. Enviar para a blockchain

      // Por enquanto, retornar hash mock
      const txHash = "0x" + Math.random().toString(16).substring(2, 66)
      console.log("✅ Swap MOCK executado:", txHash)
      return txHash
    } catch (error) {
      console.error("❌ Erro no executeSwap:", error)
      throw new Error(`Swap failed: ${error.message}`)
    }
  }

  // Métodos auxiliares
  getSupportedTokens() {
    return SUPPORTED_TOKENS
  }

  isInitialized(): boolean {
    return this.initialized
  }

  async getNetworkInfo() {
    try {
      if (!this.provider) {
        await this.initialize()
      }
      return await this.provider!.getNetwork()
    } catch (error) {
      console.error("Error getting network info:", error)
      return null
    }
  }

  isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address)
    } catch {
      return false
    }
  }

  formatTokenAmount(amount: string, decimals = 18): string {
    try {
      const value = ethers.parseUnits(amount, decimals)
      return ethers.formatUnits(value, decimals)
    } catch {
      return "0"
    }
  }

  // Debug: Verificar status
  getModuleStatus() {
    return {
      loaded: this.initialized,
      hasProvider: !!this.provider,
      approach: "Direct Pool Access",
      supportedPairs: ["WLD/TPF"],
    }
  }

  // Método de teste para verificar um token específico
  async testTokenBalance(walletAddress: string, tokenSymbol: string): Promise<void> {
    try {
      const tokenAddress = SUPPORTED_TOKENS[tokenSymbol as keyof typeof SUPPORTED_TOKENS]
      if (!tokenAddress) {
        console.error(`Token ${tokenSymbol} not found`)
        return
      }

      console.log(`🧪 Testing ${tokenSymbol} balance for ${walletAddress}`)
      console.log(`📍 Token address: ${tokenAddress}`)

      if (!this.provider) {
        console.error("Provider not initialized")
        return
      }

      // Verificar se o contrato existe
      const code = await this.provider.getCode(tokenAddress)
      console.log(`📋 Contract code length: ${code.length}`)

      if (code === "0x") {
        console.error(`❌ No contract at address ${tokenAddress}`)
        return
      }

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider)

      // Testar cada método individualmente
      try {
        const name = await contract.name()
        console.log(`✅ Name: ${name}`)
      } catch (e) {
        console.error(`❌ Failed to get name: ${e.message}`)
      }

      try {
        const symbol = await contract.symbol()
        console.log(`✅ Symbol: ${symbol}`)
      } catch (e) {
        console.error(`❌ Failed to get symbol: ${e.message}`)
      }

      try {
        const decimals = await contract.decimals()
        console.log(`✅ Decimals: ${decimals}`)
      } catch (e) {
        console.error(`❌ Failed to get decimals: ${e.message}`)
      }

      try {
        const totalSupply = await contract.totalSupply()
        console.log(`✅ Total Supply: ${ethers.formatUnits(totalSupply, 18)}`)
      } catch (e) {
        console.error(`❌ Failed to get total supply: ${e.message}`)
      }

      try {
        const balance = await contract.balanceOf(walletAddress)
        console.log(`✅ Balance (raw): ${balance.toString()}`)
        console.log(`✅ Balance (formatted): ${ethers.formatUnits(balance, 18)}`)
      } catch (e) {
        console.error(`❌ Failed to get balance: ${e.message}`)
        console.error(`├─ Error details:`, e)
      }
    } catch (error) {
      console.error(`❌ Test failed for ${tokenSymbol}:`, error)
    }
  }
}

export const holdstationService = new HoldstationService()
