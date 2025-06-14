import type { TokenBalance, SwapQuote } from "./types"
import { ethers } from "ethers"

// Configuração para Worldchain conforme documentação
const WORLDCHAIN_CONFIG = {
  chainId: 480,
  rpcUrl: "https://worldchain-mainnet.g.alchemy.com/public",
  name: "worldchain",
}

console.log("🚀 HOLDSTATION SERVICE - APENAS HISTÓRICO")

class HoldstationService {
  private client: any = null
  private multicall3: any = null
  private manager: any = null
  private provider: any = null
  private config: any = null
  private initialized = false
  private networkReady = false

  constructor() {
    console.log("🔧 HoldstationService constructor - APENAS HISTÓRICO")
  }

  private async waitForNetwork(maxRetries = 15, delay = 2000): Promise<void> {
    if (this.networkReady) return

    console.log("🔄 Aguardando rede estar completamente pronta...")

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`🔄 Tentativa ${i + 1}/${maxRetries} - testando rede...`)

        const [network, blockNumber] = await Promise.all([this.provider.getNetwork(), this.provider.getBlockNumber()])

        console.log("✅ Rede completamente pronta!")
        console.log(`├─ Network: ${network.name} (ChainId: ${network.chainId})`)
        console.log(`└─ Block Number: ${blockNumber}`)

        this.networkReady = true
        return
      } catch (error) {
        console.log(`⚠️ Rede não pronta (tentativa ${i + 1}/${maxRetries}):`, error.message)
        if (i < maxRetries - 1) {
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay = Math.min(delay * 1.2, 5000)
        }
      }
    }

    throw new Error("Rede não ficou pronta após todas as tentativas")
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<any[]> {
    try {
      console.log("=== BUSCAR HISTÓRICO CONFORME DOCUMENTAÇÃO ===")
      console.log(`Endereço: ${walletAddress}`)
      console.log(`Offset: ${offset}, Limit: ${limit}`)

      if (!this.initialized) {
        console.log("🔧 Inicializando SDK conforme documentação...")
        await this.initializeSDK()
      }

      if (!this.manager) {
        throw new Error("Manager não disponível após inicialização")
      }

      console.log("📡 Testando TODOS os métodos disponíveis no manager...")

      // Listar TODOS os métodos disponíveis primeiro
      const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager))
      console.log("🔍 TODOS os métodos disponíveis no manager:", allMethods)

      // Tentar TODOS os métodos que podem retornar histórico
      const possibleMethods = [
        // Métodos específicos de histórico
        "getTransactionHistory",
        "getHistory",
        "fetchTransactions",
        "getTransactions",
        "fetch",
        "fetchHistory",
        "getWalletHistory",
        "getAccountHistory",
        "queryTransactions",
        "searchTransactions",
        // Métodos genéricos que podem funcionar
        "get",
        "query",
        "search",
        "load",
        "retrieve",
        "find",
        // Métodos com parâmetros diferentes
        "getTransactionHistoryByAddress",
        "getHistoryByWallet",
        "fetchByAddress",
      ]

      let result = null
      let workingMethod = null

      for (const methodName of possibleMethods) {
        if (typeof this.manager[methodName] === "function") {
          console.log(`🔄 Testando método: ${methodName}`)

          try {
            // Tentar diferentes formas de chamar o método
            const attempts = [
              () => this.manager[methodName](walletAddress, { offset, limit }),
              () => this.manager[methodName](walletAddress, offset, limit),
              () => this.manager[methodName]({ address: walletAddress, offset, limit }),
              () => this.manager[methodName]({ walletAddress, offset, limit }),
              () => this.manager[methodName](walletAddress),
              () => this.manager[methodName]({ address: walletAddress }),
              () => this.manager[methodName]({ walletAddress }),
            ]

            for (let i = 0; i < attempts.length; i++) {
              try {
                console.log(`  └─ Tentativa ${i + 1}: ${methodName} com diferentes parâmetros`)
                result = await attempts[i]()
                if (result !== null && result !== undefined) {
                  workingMethod = `${methodName} (tentativa ${i + 1})`
                  console.log(`✅ SUCESSO! Método ${workingMethod} funcionou!`)
                  console.log(`📊 Resultado:`, result)
                  break
                }
              } catch (attemptError) {
                console.log(`    ❌ Tentativa ${i + 1} falhou:`, attemptError.message)
              }
            }

            if (result !== null && result !== undefined) break
          } catch (methodError) {
            console.log(`❌ Método ${methodName} falhou completamente:`, methodError.message)
          }
        } else {
          console.log(`⚠️ Método ${methodName} não existe`)
        }
      }

      if (result === null || result === undefined) {
        console.log("🔍 Tentando métodos diretos do manager...")

        // Tentar chamar métodos diretamente sem parâmetros para ver o que acontece
        for (const method of allMethods) {
          if (typeof this.manager[method] === "function" && !method.startsWith("_")) {
            try {
              console.log(`🔄 Testando método direto: ${method}`)
              const directResult = await this.manager[method]()
              console.log(`📊 Resultado de ${method}:`, directResult)
            } catch (error) {
              console.log(`❌ ${method} falhou:`, error.message)
            }
          }
        }

        throw new Error(
          `Nenhum método funcionou. Métodos testados: ${possibleMethods.filter((m) => typeof this.manager[m] === "function").join(", ")}`,
        )
      }

      console.log(`✅ Histórico obtido via ${workingMethod}:`, result)
      console.log(`📊 Total de transações: ${Array.isArray(result) ? result.length : "não é array"}`)

      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error.message)
      console.error("Stack:", error.stack)
      throw error
    }
  }

  private async initializeSDK(): Promise<void> {
    try {
      console.log("🔧 Inicializando SDK conforme documentação HoldStation...")

      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Módulos corretos importados")
      console.log("📋 HoldstationModule exports:", Object.keys(HoldstationModule))
      console.log("📋 EthersModule exports:", Object.keys(EthersModule))

      const { config } = HoldstationModule
      const { Client, Multicall3 } = EthersModule

      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      this.provider.pollingInterval = 4000
      console.log("✅ Provider criado")

      await this.waitForNetwork()

      this.client = new Client(this.provider)
      console.log("✅ Client criado")

      this.multicall3 = new Multicall3(this.provider)
      console.log("✅ Multicall3 criado")

      this.config = config
      this.config.client = this.client
      this.config.multicall3 = this.multicall3
      console.log("✅ Config global configurado")

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Tentar TODAS as classes possíveis para histórico
      const allClasses = [...Object.keys(HoldstationModule), ...Object.keys(EthersModule)]
      console.log("🔍 TODAS as classes disponíveis:", allClasses)

      let managerCreated = false

      for (const className of allClasses) {
        const ClassConstructor = HoldstationModule[className] || EthersModule[className]

        if (typeof ClassConstructor === "function") {
          console.log(`🔄 Tentando criar instância de: ${className}`)

          try {
            // Tentar diferentes formas de criar a instância
            const attempts = [
              () => new ClassConstructor(this.client, this.multicall3),
              () => new ClassConstructor({ client: this.client, multicall3: this.multicall3 }),
              () => new ClassConstructor(this.client),
              () => new ClassConstructor({ client: this.client }),
              () => new ClassConstructor(),
            ]

            for (let i = 0; i < attempts.length; i++) {
              try {
                const instance = attempts[i]()
                if (instance) {
                  this.manager = instance
                  console.log(`✅ ${className} criado com sucesso (tentativa ${i + 1})!`)

                  // Listar métodos desta instância
                  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
                  console.log(`📋 Métodos de ${className}:`, methods)

                  managerCreated = true
                  break
                }
              } catch (attemptError) {
                console.log(`  ❌ Tentativa ${i + 1} para ${className} falhou:`, attemptError.message)
              }
            }

            if (managerCreated) break
          } catch (classError) {
            console.log(`❌ Não foi possível criar ${className}:`, classError.message)
          }
        }
      }

      if (!this.manager) {
        throw new Error("Nenhuma classe pôde ser instanciada como manager")
      }

      this.initialized = true
      console.log("✅ SDK inicializado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao inicializar SDK:", error.message)
      console.error("Stack:", error.stack)
      this.initialized = false
      this.networkReady = false
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
      hasGlobalConfig: !!this.config?.client && !!this.config?.multicall3,
      sdkType: "APENAS HISTÓRICO - Conforme documentação HoldStation",
      chainId: WORLDCHAIN_CONFIG.chainId,
      rpcUrl: WORLDCHAIN_CONFIG.rpcUrl,
    }
  }

  async debugSDK() {
    try {
      if (!this.initialized) {
        await this.initializeSDK()
      }
      console.log("=== DEBUG APENAS HISTÓRICO ===")
      console.log("Status:", this.getSDKStatus())
      return this.getSDKStatus()
    } catch (error) {
      console.error("Debug falhou:", error)
      return { error: error.message }
    }
  }
}

export const holdstationService = new HoldstationService()
