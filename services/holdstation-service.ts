import type { TokenBalance, SwapQuote } from "./types"
import { ethers } from "ethers"

const WORLDCHAIN_CONFIG = {
  chainId: 480,
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  name: "worldchain",
}

console.log("🚀 HOLDSTATION SERVICE - FORÇA DEBUG V2")

class HoldstationService {
  private client: any = null
  private multicall3: any = null
  private manager: any = null
  private provider: any = null
  private config: any = null
  private initialized = false
  private networkReady = false

  constructor() {
    console.log("🔧 HoldstationService constructor - FORÇA DEBUG V2")
  }

  private async waitForNetwork(maxRetries = 10, delay = 1500): Promise<void> {
    if (this.networkReady) return

    console.log("🔄 FORÇA DEBUG - Aguardando rede...")

    for (let i = 0; i < maxRetries; i++) {
      try {
        const [network, blockNumber] = await Promise.all([this.provider.getNetwork(), this.provider.getBlockNumber()])
        console.log(`✅ FORÇA DEBUG - Rede pronta: ${network.name} (${network.chainId}) - Bloco: ${blockNumber}`)
        this.networkReady = true
        return
      } catch (error) {
        console.log(`⚠️ FORÇA DEBUG - Rede não pronta (${i + 1}/${maxRetries}):`, error.message)
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw new Error("FORÇA DEBUG - Rede não ficou pronta")
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
    try {
      console.log("🚨 === FORÇA DEBUG V2 - HISTÓRICO ===")
      console.log(`🚨 Endereço: ${walletAddress}`)
      console.log(`🚨 Offset: ${offset}, Limit: ${limit}`)
      console.log(`🚨 Timestamp: ${new Date().toISOString()}`)

      if (!this.initialized) {
        console.log("🚨 FORÇA DEBUG - Inicializando SDK...")
        await this.initializeSDK()
      }

      console.log(`🚨 FORÇA DEBUG - Manager existe: ${!!this.manager}`)
      console.log(`🚨 FORÇA DEBUG - Manager tipo: ${typeof this.manager}`)

      if (!this.manager) {
        throw new Error("FORÇA DEBUG - Manager não disponível")
      }

      // FORÇAR LOGS DE DEBUG
      console.log("🚨 === FORÇA DEBUG - LISTANDO MÉTODOS ===")
      const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager))
      console.log("🚨 TODOS OS MÉTODOS:", allMethods)
      console.log("🚨 TOTAL DE MÉTODOS:", allMethods.length)

      // Filtrar métodos que podem ser de histórico
      const historyMethods = allMethods.filter(
        (method) =>
          method.toLowerCase().includes("history") ||
          method.toLowerCase().includes("transaction") ||
          method.toLowerCase().includes("fetch") ||
          method.toLowerCase().includes("get") ||
          method.toLowerCase().includes("query"),
      )

      console.log("🚨 MÉTODOS RELACIONADOS A HISTÓRICO:", historyMethods)

      if (historyMethods.length === 0) {
        console.log("🚨 NENHUM MÉTODO DE HISTÓRICO ENCONTRADO!")
        console.log("🚨 TENTANDO TODOS OS MÉTODOS DISPONÍVEIS...")

        // Tentar TODOS os métodos
        for (const method of allMethods) {
          if (typeof this.manager[method] === "function" && !method.startsWith("_")) {
            console.log(`🚨 TESTANDO MÉTODO: ${method}`)
            try {
              const result = await this.manager[method](walletAddress)
              console.log(`🚨 RESULTADO DE ${method}:`, result)
              if (result && (Array.isArray(result) || typeof result === "object")) {
                console.log(`✅ MÉTODO ${method} RETORNOU DADOS!`)
                return Array.isArray(result) ? result : [result]
              }
            } catch (error) {
              console.log(`❌ MÉTODO ${method} FALHOU:`, error.message)
            }
          }
        }
      }

      throw new Error(`FORÇA DEBUG - Nenhum método funcionou. Total testados: ${allMethods.length}`)
    } catch (error) {
      console.error("🚨 FORÇA DEBUG - ERRO:", error.message)
      throw error
    }
  }

  private async initializeSDK(): Promise<void> {
    try {
      console.log("🚨 === FORÇA DEBUG - INICIALIZANDO SDK ===")

      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("🚨 HOLDSTATION EXPORTS:", Object.keys(HoldstationModule))
      console.log("🚨 ETHERS EXPORTS:", Object.keys(EthersModule))

      const { config } = HoldstationModule
      const { Client, Multicall3 } = EthersModule

      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      console.log("🚨 PROVIDER CRIADO")

      await this.waitForNetwork()

      this.client = new Client(this.provider)
      console.log("🚨 CLIENT CRIADO")

      this.multicall3 = new Multicall3(this.provider)
      console.log("🚨 MULTICALL3 CRIADO")

      this.config = config
      this.config.client = this.client
      this.config.multicall3 = this.multicall3
      console.log("🚨 CONFIG GLOBAL DEFINIDO")

      // TENTAR CRIAR MANAGER COM TODAS AS CLASSES
      console.log("🚨 === FORÇA DEBUG - CRIANDO MANAGER ===")
      const allClasses = [...Object.keys(HoldstationModule), ...Object.keys(EthersModule)]
      console.log("🚨 TODAS AS CLASSES:", allClasses)

      for (const className of allClasses) {
        const ClassConstructor = HoldstationModule[className] || EthersModule[className]

        if (typeof ClassConstructor === "function") {
          console.log(`🚨 TESTANDO CLASSE: ${className}`)

          try {
            // Tentar criar instância
            let instance = null
            try {
              instance = new ClassConstructor(this.client, this.multicall3)
              console.log(`🚨 ${className} CRIADO COM CLIENT + MULTICALL3`)
            } catch (e1) {
              try {
                instance = new ClassConstructor(this.client)
                console.log(`🚨 ${className} CRIADO COM CLIENT`)
              } catch (e2) {
                try {
                  instance = new ClassConstructor()
                  console.log(`🚨 ${className} CRIADO SEM PARÂMETROS`)
                } catch (e3) {
                  console.log(`🚨 ${className} NÃO PODE SER CRIADO`)
                  continue
                }
              }
            }

            if (instance) {
              const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
              console.log(`🚨 MÉTODOS DE ${className}:`, methods)

              // Se tem métodos relacionados a histórico, usar como manager
              const hasHistoryMethods = methods.some(
                (m) =>
                  m.toLowerCase().includes("history") ||
                  m.toLowerCase().includes("transaction") ||
                  m.toLowerCase().includes("fetch"),
              )

              if (hasHistoryMethods || !this.manager) {
                this.manager = instance
                console.log(`🚨 USANDO ${className} COMO MANAGER`)
                if (hasHistoryMethods) break // Se tem métodos de histórico, usar este
              }
            }
          } catch (error) {
            console.log(`🚨 ERRO AO CRIAR ${className}:`, error.message)
          }
        }
      }

      if (!this.manager) {
        throw new Error("FORÇA DEBUG - Nenhuma classe pôde ser instanciada")
      }

      console.log("🚨 MANAGER FINAL CRIADO:", this.manager.constructor.name)
      this.initialized = true
    } catch (error) {
      console.error("🚨 FORÇA DEBUG - ERRO INICIALIZAÇÃO:", error.message)
      throw error
    }
  }

  getSupportedTokens() {
    return {}
  }

  isInitialized(): boolean {
    return this.initialized
  }

  isNetworkReady(): boolean {
    return this.networkReady
  }

  getManager() {
    return this.manager
  }

  getClient() {
    return this.client
  }

  getProvider() {
    return this.provider
  }

  getMulticall3() {
    return this.multicall3
  }

  async getTokenBalances(): Promise<TokenBalance[]> {
    throw new Error("getTokenBalances não implementado - apenas histórico")
  }

  async getSwapQuote(): Promise<SwapQuote> {
    throw new Error("getSwapQuote não implementado - apenas histórico")
  }

  async executeSwap(): Promise<string> {
    throw new Error("executeSwap não implementado - apenas histórico")
  }

  getTokenProvider() {
    return null
  }

  getQuoter() {
    return null
  }

  getSwapHelper() {
    return null
  }

  getSDKStatus() {
    return {
      initialized: this.initialized,
      networkReady: this.networkReady,
      hasProvider: !!this.provider,
      hasClient: !!this.client,
      hasMulticall3: !!this.multicall3,
      hasManager: !!this.manager,
      managerType: this.manager?.constructor?.name || "unknown",
      sdkType: "FORÇA DEBUG V2 - APENAS HISTÓRICO",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  async debugSDK() {
    console.log("🚨 === FORÇA DEBUG - STATUS SDK ===")
    const status = this.getSDKStatus()
    console.log("🚨 STATUS:", status)
    return status
  }
}

export const holdstationService = new HoldstationService()

console.log("🚨 HOLDSTATION SERVICE CRIADO - FORÇA DEBUG V2")
