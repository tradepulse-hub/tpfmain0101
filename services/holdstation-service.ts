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

        // Testar múltiplas operações para garantir que a rede está pronta
        const [network, blockNumber, balance] = await Promise.all([
          this.provider.getNetwork(),
          this.provider.getBlockNumber(),
          this.provider.getBalance("0x0000000000000000000000000000000000000000"), // Endereço zero para teste
        ])

        console.log("✅ Rede completamente pronta!")
        console.log(`├─ Network: ${network.name} (ChainId: ${network.chainId})`)
        console.log(`├─ Block Number: ${blockNumber}`)
        console.log(`└─ Conexão verificada`)

        this.networkReady = true
        return
      } catch (error) {
        console.log(`⚠️ Rede não pronta (tentativa ${i + 1}/${maxRetries}):`, error.message)
        if (i < maxRetries - 1) {
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          // Aumentar delay progressivamente
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

      console.log("📡 Chamando manager para buscar histórico...")

      // Tentar diferentes métodos do manager
      let result = null
      const methods = ["getTransactionHistory", "getHistory", "fetchTransactions", "getTransactions", "fetch"]

      for (const methodName of methods) {
        if (typeof this.manager[methodName] === "function") {
          try {
            console.log(`🔄 Tentando método: ${methodName}`)
            result = await this.manager[methodName](walletAddress, { offset, limit })
            console.log(`✅ Método ${methodName} funcionou!`)
            break
          } catch (methodError) {
            console.log(`❌ Método ${methodName} falhou:`, methodError.message)
          }
        }
      }

      if (!result) {
        // Listar métodos disponíveis para debug
        const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager))
        console.log("🔍 Métodos disponíveis no manager:", availableMethods)
        throw new Error("Nenhum método de histórico funcionou")
      }

      console.log("✅ Histórico obtido via HoldStation:", result)
      console.log(`📊 Total de transações: ${result?.length || 0}`)

      return result || []
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error.message)
      console.error("Stack:", error.stack)
      throw error // SEM FALLBACK - falha se não funcionar
    }
  }

  private async initializeSDK(): Promise<void> {
    try {
      console.log("🔧 Inicializando SDK conforme documentação HoldStation...")

      // Importar módulos CORRETOS conforme documentação
      const [HoldstationModule, EthersModule] = await Promise.all([
        import("@holdstation/worldchain-sdk"),
        import("@holdstation/worldchain-ethers-v6"),
      ])

      console.log("✅ Módulos corretos importados")
      console.log("📋 HoldstationModule exports:", Object.keys(HoldstationModule))
      console.log("📋 EthersModule exports:", Object.keys(EthersModule))

      // Extrair componentes conforme documentação
      const { config } = HoldstationModule
      const { Client } = EthersModule

      console.log("✅ Componentes extraídos")

      // Criar provider com configurações mais robustas
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })

      // Configurar timeouts mais longos
      this.provider.pollingInterval = 4000 // 4 segundos
      console.log("✅ Provider criado com configurações robustas")

      // AGUARDAR REDE ESTAR COMPLETAMENTE PRONTA
      await this.waitForNetwork()

      // Criar client conforme documentação APÓS rede estar pronta
      console.log("🔧 Criando client após rede estar pronta...")
      this.client = new Client(this.provider)
      console.log("✅ Client criado conforme docs")

      // Configurar config global conforme documentação
      this.config = config
      this.config.client = this.client
      console.log("✅ Config global definido")

      // Aguardar um pouco mais para estabilizar
      console.log("⏳ Aguardando estabilização do SDK...")
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Procurar por Manager ou WalletHistory nos módulos
      let ManagerClass = null
      let WalletHistoryClass = null

      // Tentar encontrar a classe correta para histórico
      if (HoldstationModule.Manager) {
        ManagerClass = HoldstationModule.Manager
        console.log("✅ Encontrado HoldstationModule.Manager")
      } else if (HoldstationModule.WalletHistory) {
        WalletHistoryClass = HoldstationModule.WalletHistory
        console.log("✅ Encontrado HoldstationModule.WalletHistory")
      } else if (EthersModule.Manager) {
        ManagerClass = EthersModule.Manager
        console.log("✅ Encontrado EthersModule.Manager")
      } else if (EthersModule.WalletHistory) {
        WalletHistoryClass = EthersModule.WalletHistory
        console.log("✅ Encontrado EthersModule.WalletHistory")
      }

      // Criar manager/history conforme documentação
      if (ManagerClass) {
        console.log("🔧 Criando Manager...")
        this.manager = new ManagerClass(this.client)
        console.log("✅ Manager criado conforme documentação")
      } else if (WalletHistoryClass) {
        console.log("🔧 Criando WalletHistory...")
        this.manager = new WalletHistoryClass(this.client)
        console.log("✅ WalletHistory criado conforme documentação")
      } else {
        // Listar todas as classes disponíveis para debug
        console.log("🔍 Classes disponíveis em HoldstationModule:", Object.keys(HoldstationModule))
        console.log("🔍 Classes disponíveis em EthersModule:", Object.keys(EthersModule))

        // Tentar usar qualquer classe que pareça relacionada a histórico
        const possibleClasses = [
          ...Object.keys(HoldstationModule).filter(
            (key) => key.toLowerCase().includes("history") || key.toLowerCase().includes("transaction"),
          ),
          ...Object.keys(EthersModule).filter(
            (key) => key.toLowerCase().includes("history") || key.toLowerCase().includes("transaction"),
          ),
        ]

        if (possibleClasses.length > 0) {
          console.log("🔍 Classes relacionadas a histórico encontradas:", possibleClasses)
          const FirstClass = HoldstationModule[possibleClasses[0]] || EthersModule[possibleClasses[0]]
          if (FirstClass) {
            this.manager = new FirstClass(this.client)
            console.log(`✅ Usando ${possibleClasses[0]} como manager`)
          }
        }

        if (!this.manager) {
          throw new Error("Nenhuma classe de histórico encontrada nos módulos")
        }
      }

      // Testar se o manager tem métodos
      if (this.manager) {
        const managerMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.manager))
        console.log("📋 Métodos do manager:", managerMethods)
      }

      this.initialized = true
      console.log("✅ SDK inicializado APENAS para histórico!")
    } catch (error) {
      console.error("❌ Erro ao inicializar SDK:", error.message)
      console.error("Stack:", error.stack)
      this.initialized = false
      this.networkReady = false
      throw error // SEM FALLBACK
    }
  }

  // Métodos mínimos necessários
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

  // Métodos não usados para histórico
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
      hasManager: !!this.manager,
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

console.log("✅ HoldstationService definido - APENAS HISTÓRICO")

export const holdstationService = new HoldstationService()

console.log("🎯 HOLDSTATION SERVICE - APENAS HISTÓRICO CONFORME DOCS")
