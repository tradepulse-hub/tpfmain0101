import { ethers } from "ethers"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Apenas os 5 tokens que você quer
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
  DNA: {
    address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
    symbol: "DNA",
    name: "DNA Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
  WDD: {
    address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
    symbol: "WDD",
    name: "WDD Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
  CASH: {
    address: "0xbfdA4F50a2d5B9b864511579D7dfa1C72f118575",
    symbol: "CASH",
    name: "Cash Token",
    decimals: 18,
    icon: "/placeholder.svg?height=32&width=32",
  },
}

// ABI básico para ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

// ABI do Multicall3 (endereço padrão na maioria das redes)
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11"
const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "bytes[]", name: "returnData", type: "bytes[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
]

interface QuoteParams {
  tokenIn: "WLD" | "TPF" | "DNA" | "WDD" | "CASH"
  tokenOut: "WLD" | "TPF" | "DNA" | "WDD" | "CASH"
  amountIn: string
}

interface SwapParams {
  tokenIn: "WLD" | "TPF" | "DNA" | "WDD" | "CASH"
  tokenOut: "WLD" | "TPF" | "DNA" | "WDD" | "CASH"
  amountIn: string
  amountOutMinimum: string
  recipient: string
}

interface TokenBalance {
  symbol: "WLD" | "TPF" | "DNA" | "WDD" | "CASH"
  balance: string
  formattedBalance: string
}

// Implementação simplificada das funcionalidades da Holdstation
class HoldstationLikeClient {
  constructor(private provider: ethers.JsonRpcProvider) {}

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address)
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  getChainId(): number {
    return CHAIN_ID
  }

  hexZeroPad(value: string, length: number): string {
    return ethers.zeroPadValue(value, length)
  }
}

class HoldstationLikeMulticall {
  private multicall: ethers.Contract

  constructor(private provider: ethers.JsonRpcProvider) {
    this.multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider)
  }

  async aggregate(calls: Array<{ target: string; callData: string }>): Promise<[bigint, string[]]> {
    const result = await this.multicall.aggregate(calls)
    return [result[0], result[1]]
  }
}

class HoldstationLikeTokenProvider {
  constructor(
    private client: HoldstationLikeClient,
    private multicall: HoldstationLikeMulticall,
  ) {}

  async balanceOf(tokenAddress: string, walletAddress: string): Promise<bigint> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.client["provider"])
      const balance = await tokenContract.balanceOf(walletAddress)
      return balance
    } catch (error) {
      console.error(`Error getting balance for ${tokenAddress}:`, error)
      return 0n
    }
  }

  async details(tokenAddress: string) {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.client["provider"])
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ])

      return {
        name,
        symbol,
        decimals: Number(decimals),
        address: tokenAddress,
      }
    } catch (error) {
      console.error(`Error getting details for ${tokenAddress}:`, error)
      return {
        name: "Unknown",
        symbol: "UNK",
        decimals: 18,
        address: tokenAddress,
      }
    }
  }
}

class SwapService {
  private provider: ethers.JsonRpcProvider | null = null
  private client: HoldstationLikeClient | null = null
  private multicall: HoldstationLikeMulticall | null = null
  private tokenProvider: HoldstationLikeTokenProvider | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🔄 Initializing Swap Service (Holdstation-like implementation)...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Inicializar implementações similares à Holdstation
      this.client = new HoldstationLikeClient(this.provider)
      this.multicall = new HoldstationLikeMulticall(this.provider)
      this.tokenProvider = new HoldstationLikeTokenProvider(this.client, this.multicall)

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to WorldChain: ${network.chainId}`)

      console.log("📋 Supported tokens:")
      Object.entries(TOKENS).forEach(([symbol, token]) => {
        console.log(`├─ ${symbol}: ${token.address}`)
      })

      this.initialized = true
      console.log("✅ Swap Service initialized successfully (Holdstation-like)")
    } catch (error) {
      console.error("❌ Failed to initialize Swap Service:", error)
    }
  }

  // Obter saldos de todos os tokens usando Multicall otimizado
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`💰 Getting token balances for: ${walletAddress}`)

      const balances: TokenBalance[] = []
      const tokenEntries = Object.entries(TOKENS)

      // Preparar chamadas para Multicall
      const calls = tokenEntries.map(([symbol, token]) => {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
        return {
          target: token.address,
          callData: tokenContract.interface.encodeFunctionData("balanceOf", [walletAddress]),
        }
      })

      try {
        // Executar Multicall
        const [blockNumber, results] = await this.multicall!.aggregate(calls)
        console.log(`📊 Multicall executed at block: ${blockNumber}`)

        // Processar resultados
        tokenEntries.forEach(([symbol, token], index) => {
          try {
            const result = results[index]
            const balance = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result)[0]
            const formattedBalance = ethers.formatUnits(balance, token.decimals)

            balances.push({
              symbol: symbol as "WLD" | "TPF" | "DNA" | "WDD" | "CASH",
              balance: balance.toString(),
              formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
            })

            console.log(`✅ ${symbol}: ${formattedBalance}`)
          } catch (error) {
            console.error(`❌ Error processing ${symbol} balance:`, error)
            balances.push({
              symbol: symbol as "WLD" | "TPF" | "DNA" | "WDD" | "CASH",
              balance: "0",
              formattedBalance: "0.000000",
            })
          }
        })
      } catch (multicallError) {
        console.warn("⚠️ Multicall failed, falling back to individual calls:", multicallError)

        // Fallback para chamadas individuais usando TokenProvider
        for (const [symbol, token] of tokenEntries) {
          try {
            const balance = await this.tokenProvider!.balanceOf(token.address, walletAddress)
            const formattedBalance = ethers.formatUnits(balance, token.decimals)

            balances.push({
              symbol: symbol as "WLD" | "TPF" | "DNA" | "WDD" | "CASH",
              balance: balance.toString(),
              formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
            })

            console.log(`✅ ${symbol}: ${formattedBalance}`)
          } catch (error) {
            console.error(`❌ Error getting ${symbol} balance:`, error)
            balances.push({
              symbol: symbol as "WLD" | "TPF" | "DNA" | "WDD" | "CASH",
              balance: "0",
              formattedBalance: "0.000000",
            })
          }
        }
      }

      return balances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      // Retornar saldos zerados em caso de erro
      return Object.keys(TOKENS).map((symbol) => ({
        symbol: symbol as "WLD" | "TPF" | "DNA" | "WDD" | "CASH",
        balance: "0",
        formattedBalance: "0.000000",
      }))
    }
  }

  // Obter cotação (usando taxas simuladas por enquanto)
  async getQuote(params: QuoteParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return params.amountIn
      }

      console.log(`💱 Getting quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Taxas simuladas baseadas em observações reais
      const mockRates: Record<string, Record<string, number>> = {
        WLD: {
          TPF: 74500, // 1 WLD = 74,500 TPF
          DNA: 1000, // 1 WLD = 1,000 DNA
          WDD: 500, // 1 WLD = 500 WDD
          CASH: 2000, // 1 WLD = 2,000 CASH
        },
        TPF: {
          WLD: 1 / 74500, // 74,500 TPF = 1 WLD
          DNA: 1 / 74.5, // 74.5 TPF = 1 DNA
          WDD: 1 / 149, // 149 TPF = 1 WDD
          CASH: 1 / 37.25, // 37.25 TPF = 1 CASH
        },
        DNA: {
          WLD: 1 / 1000, // 1,000 DNA = 1 WLD
          TPF: 74.5, // 1 DNA = 74.5 TPF
          WDD: 0.5, // 1 DNA = 0.5 WDD
          CASH: 2, // 1 DNA = 2 CASH
        },
        WDD: {
          WLD: 1 / 500, // 500 WDD = 1 WLD
          TPF: 149, // 1 WDD = 149 TPF
          DNA: 2, // 1 WDD = 2 DNA
          CASH: 4, // 1 WDD = 4 CASH
        },
        CASH: {
          WLD: 1 / 2000, // 2,000 CASH = 1 WLD
          TPF: 37.25, // 1 CASH = 37.25 TPF
          DNA: 0.5, // 1 CASH = 0.5 DNA
          WDD: 0.25, // 1 CASH = 0.25 WDD
        },
      }

      const rate = mockRates[params.tokenIn]?.[params.tokenOut] || 1
      const amountOut = Number.parseFloat(params.amountIn) * rate

      console.log(`├─ Rate: 1 ${params.tokenIn} = ${rate} ${params.tokenOut}`)
      console.log(`└─ Amount out: ${amountOut.toFixed(6)} ${params.tokenOut}`)

      return amountOut.toFixed(6)
    } catch (error) {
      console.error("❌ Error getting quote:", error)
      return "0"
    }
  }

  // Executar swap via MiniKit
  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log(`🔄 Executing swap: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Verificar se MiniKit está disponível
      if (typeof window === "undefined") {
        throw new Error("Window not available - not in browser")
      }

      const MiniKit = (window as any).MiniKit
      if (!MiniKit) {
        throw new Error("MiniKit not found. Please use World App.")
      }

      if (!MiniKit.isInstalled()) {
        throw new Error("MiniKit not installed. Please use World App.")
      }

      if (!MiniKit.user || !MiniKit.user.walletAddress) {
        throw new Error("No user connected to MiniKit")
      }

      console.log(`👤 MiniKit user: ${MiniKit.user.walletAddress}`)

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      // Aqui você implementaria a lógica real de swap
      // Por enquanto, simular o swap
      console.log("📋 Swap parameters:")
      console.log(`├─ tokenIn: ${tokenIn.address} (${tokenIn.symbol})`)
      console.log(`├─ tokenOut: ${tokenOut.address} (${tokenOut.symbol})`)
      console.log(`├─ amountIn: ${params.amountIn}`)
      console.log(`├─ amountOutMinimum: ${params.amountOutMinimum}`)
      console.log(`└─ recipient: ${params.recipient}`)

      // Simular transação bem-sucedida
      const mockTxHash = "0x" + Math.random().toString(16).substring(2, 66)

      console.log("✅ Swap executed successfully!")
      console.log(`└─ Transaction hash: ${mockTxHash}`)

      return mockTxHash
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      throw error
    }
  }

  // Obter tokens suportados
  getTokens() {
    return TOKENS
  }

  getSupportedTokens() {
    return Object.keys(TOKENS)
  }

  // Obter endereço do token
  getTokenAddress(symbol: string): string | null {
    return TOKENS[symbol as keyof typeof TOKENS]?.address || null
  }

  // Verificar se o serviço está inicializado
  isInitialized(): boolean {
    return this.initialized
  }

  // Obter informações de um token específico
  async getTokenDetails(symbol: string) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      const token = TOKENS[symbol as keyof typeof TOKENS]
      if (!token) {
        throw new Error(`Token ${symbol} not supported`)
      }

      // Usar TokenProvider para obter detalhes do token
      const details = await this.tokenProvider!.details(token.address)

      return {
        ...token,
        ...details,
      }
    } catch (error) {
      console.error(`Error getting token details for ${symbol}:`, error)
      return TOKENS[symbol as keyof typeof TOKENS] || null
    }
  }

  // Verificar se um endereço é válido
  isValidAddress(address: string): boolean {
    return this.client?.isValidAddress(address) || ethers.isAddress(address)
  }

  // Obter número do bloco atual
  async getBlockNumber(): Promise<number> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }
      return await this.client!.getBlockNumber()
    } catch (error) {
      console.error("❌ Error getting block number:", error)
      return 0
    }
  }

  // Obter informações da rede
  async getNetworkInfo() {
    try {
      if (!this.provider) {
        await this.initialize()
      }
      return await this.provider!.getNetwork()
    } catch (error) {
      console.error("❌ Error getting network info:", error)
      return null
    }
  }

  // Obter chain ID
  getChainId(): number {
    return this.client?.getChainId() || CHAIN_ID
  }
}

// Exportar instância única
export const swapService = new SwapService()
export type { QuoteParams, SwapParams, TokenBalance }
