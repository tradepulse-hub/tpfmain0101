import { ethers } from "ethers"

// Endereço do Multicall3 na WorldChain
const MULTICALL3_ADDRESS = "0x0a22c04215c97E3F532F4eF30e0aD9458792dAB9"

// ABI do Multicall3
const MULTICALL3_ABI = [
  {
    inputs: [],
    name: "getCurrentBlockTimestamp",
    outputs: [{ internalType: "uint256", name: "timestamp", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "addr", type: "address" }],
    name: "getEthBalance",
    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "uint256", name: "gasLimit", type: "uint256" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct AtletaInterfaceMulticall.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "multicall",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      {
        components: [
          { internalType: "bool", name: "success", type: "bool" },
          { internalType: "uint256", name: "gasUsed", type: "uint256" },
          { internalType: "bytes", name: "returnData", type: "bytes" },
        ],
        internalType: "struct AtletaInterfaceMulticall.Result[]",
        name: "returnData",
        type: "tuple[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]

interface MulticallCall {
  target: string
  gasLimit: number
  callData: string
}

interface MulticallResult {
  success: boolean
  gasUsed: number
  returnData: string
}

interface MulticallResponse {
  blockNumber: number
  results: MulticallResult[]
}

class MulticallService {
  private provider: ethers.JsonRpcProvider | null = null
  private multicall: ethers.Contract | null = null
  private initialized = false

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider
    this.initialize()
  }

  private async initialize() {
    if (this.initialized || !this.provider) return

    try {
      console.log("🔄 Initializing Multicall3 Service...")

      this.multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, this.provider)

      // Testar se o contrato está funcionando
      const timestamp = await this.multicall.getCurrentBlockTimestamp()
      console.log(`✅ Multicall3 initialized - Block timestamp: ${timestamp}`)

      this.initialized = true
    } catch (error) {
      console.error("❌ Failed to initialize Multicall3:", error)
    }
  }

  // Executar múltiplas chamadas em uma única transação
  async multicall(calls: MulticallCall[]): Promise<MulticallResponse> {
    if (!this.initialized || !this.multicall) {
      throw new Error("Multicall3 not initialized")
    }

    try {
      console.log(`📞 Executing ${calls.length} calls via Multicall3...`)

      const result = await this.multicall.multicall.staticCall(calls)
      const blockNumber = result[0]
      const results = result[1]

      console.log(`✅ Multicall completed at block ${blockNumber}`)

      return {
        blockNumber: Number(blockNumber),
        results: results.map((r: any) => ({
          success: r.success,
          gasUsed: Number(r.gasUsed),
          returnData: r.returnData,
        })),
      }
    } catch (error) {
      console.error("❌ Multicall failed:", error)
      throw error
    }
  }

  // Criar call data para uma função de contrato
  createCallData(contract: ethers.Contract, functionName: string, params: any[]): string {
    return contract.interface.encodeFunctionData(functionName, params)
  }

  // Decodificar resultado de uma call
  decodeResult(contract: ethers.Contract, functionName: string, returnData: string): any {
    return contract.interface.decodeFunctionResult(functionName, returnData)
  }

  // Verificar se está inicializado
  isInitialized(): boolean {
    return this.initialized
  }

  // Obter timestamp do bloco atual
  async getCurrentBlockTimestamp(): Promise<number> {
    if (!this.multicall) {
      throw new Error("Multicall3 not initialized")
    }

    const timestamp = await this.multicall.getCurrentBlockTimestamp()
    return Number(timestamp)
  }

  // Obter saldo ETH de um endereço
  async getEthBalance(address: string): Promise<string> {
    if (!this.multicall) {
      throw new Error("Multicall3 not initialized")
    }

    const balance = await this.multicall.getEthBalance(address)
    return ethers.formatEther(balance)
  }
}

export { MulticallService, type MulticallCall, type MulticallResult, type MulticallResponse }
