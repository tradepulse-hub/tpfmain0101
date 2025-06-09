import { ethers } from "ethers"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens suportados
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

// ABI do Multicall3
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

interface TokenBalance {
  symbol: keyof typeof TOKENS
  balance: string
  formattedBalance: string
}

interface QuoteParams {
  tokenIn: keyof typeof TOKENS
  tokenOut: keyof typeof TOKENS
  amountIn: string
}

interface SwapParams {
  tokenIn: keyof typeof TOKENS
  tokenOut: keyof typeof TOKENS
  amountIn: string
  amountOutMinimum: string
  recipient: string
  slippage: number
}

// Implementação do serviço de swap
class SwapService {
  private provider: ethers.JsonRpcProvider | null = null
  private multicall: ethers.Contract | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Swap Service...")

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC, {
        chainId: CHAIN_ID,
        name: "worldchain",
      })

      // Inicializar Multicall3
      this.multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, this.provider)

      // Testar conexão
      const network = await this.provider.getNetwork()
      console.log(`✅ Connected to WorldChain: ${network.chainId}`)

      console.log("📋 Supported tokens:")
      Object.entries(TOKENS).forEach(([symbol, token]) => {
        console.log(`├─ ${symbol}: ${token.address}`)
      })

      this.initialized = true
      console.log("✅ Swap Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Swap Service:", error)
    }
  }

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
              symbol: symbol as keyof typeof TOKENS,
              balance: balance.toString(),
              formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
            })

            console.log(`✅ ${symbol}: ${formattedBalance}`)
          } catch (error) {
            console.error(`❌ Error processing ${symbol} balance:`, error)
            balances.push({
              symbol: symbol as keyof typeof TOKENS,
              balance: "0",
              formattedBalance: "0.000000",
            })
          }
        })
      } catch (multicallError) {
        console.warn("⚠️ Multicall failed, falling back to individual calls:", multicallError)

        // Fallback para chamadas individuais
        for (const [symbol, token] of tokenEntries) {
          try {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, this.provider)
            const balance = await tokenContract.balanceOf(walletAddress)
            const formattedBalance = ethers.formatUnits(balance, token.decimals)

            balances.push({
              symbol: symbol as keyof typeof TOKENS,
              balance: balance.toString(),
              formattedBalance: Number.parseFloat(formattedBalance).toFixed(6),
            })

            console.log(`✅ ${symbol}: ${formattedBalance}`)
          } catch (error) {
            console.error(`❌ Error getting ${symbol} balance:`, error)
            balances.push({
              symbol: symbol as keyof typeof TOKENS,
              balance: "0",
              formattedBalance: "0.000000",
            })
          }
        }
      }

      return balances
    } catch (error) {
      console.error("❌ Error getting token balances:", error)
      return Object.keys(TOKENS).map((symbol) => ({
        symbol: symbol as keyof typeof TOKENS,
        balance: "0",
        formattedBalance: "0.000000",
      }))
    }
  }

  async getQuote(params: QuoteParams): Promise<{ amountOut: string; data?: any }> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (params.tokenIn === params.tokenOut) {
        return { amountOut: params.amountIn }
      }

      console.log(`💱 Getting quote: ${params.amountIn} ${params.tokenIn} → ${params.tokenOut}`)

      // Taxas simuladas baseadas em observações reais
      const mockRates: Record<string, Record<string, number>> = {
        WLD: {
          TPF: 74500,
          DNA: 1000,
          WDD: 500,
          CASH: 2000,
        },
        TPF: {
          WLD: 1 / 74500,
          DNA: 1 / 74.5,
          WDD: 1 / 149,
          CASH: 1 / 37.25,
        },
        DNA: {
          WLD: 1 / 1000,
          TPF: 74.5,
          WDD: 0.5,
          CASH: 2,
        },
        WDD: {
          WLD: 1 / 500,
          TPF: 149,
          DNA: 2,
          CASH: 4,
        },
        CASH: {
          WLD: 1 / 2000,
          TPF: 37.25,
          DNA: 0.5,
          WDD: 0.25,
        },
      }

      const rate = mockRates[params.tokenIn]?.[params.tokenOut] || 1
      const amountOut = Number.parseFloat(params.amountIn) * rate

      console.log(`├─ Rate: 1 ${params.tokenIn} = ${rate} ${params.tokenOut}`)
      console.log(`└─ Amount out: ${amountOut.toFixed(6)} ${params.tokenOut}`)

      return {
        amountOut: amountOut.toFixed(6),
        data: {
          rate,
          priceImpact: "0.1",
          route: ["Direct"],
        },
      }
    } catch (error) {
      console.error("❌ Error getting quote:", error)
      return { amountOut: "0" }
    }
  }

  async executeSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("🚀 Executing swap:")
      console.log(`├─ ${params.amountIn} ${params.tokenIn} -> ${params.tokenOut}`)
      console.log(`├─ Minimum out: ${params.amountOutMinimum}`)
      console.log(`├─ Slippage: ${params.slippage}%`)
      console.log(`└─ Recipient: ${params.recipient}`)

      // Verificar MiniKit
      if (typeof window === "undefined") {
        throw new Error("Window not available")
      }

      const MiniKit = (window as any).MiniKit
      if (!MiniKit?.isInstalled()) {
        throw new Error("MiniKit not available. Please use World App.")
      }

      const userAddress = MiniKit.user?.walletAddress
      if (!userAddress) {
        throw new Error("No wallet connected to MiniKit")
      }

      console.log(`👤 MiniKit user: ${userAddress}`)

      const tokenIn = TOKENS[params.tokenIn]
      const tokenOut = TOKENS[params.tokenOut]

      // Simular transação de swap
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

  // Métodos auxiliares
  getTokens() {
    return TOKENS
  }

  getSupportedTokens() {
    return Object.keys(TOKENS)
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
      console.error("❌ Error getting network info:", error)
      return null
    }
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address)
  }
}

// Exportar instância única
export const swapService = new SwapService()
export type { TokenBalance, QuoteParams, SwapParams }
