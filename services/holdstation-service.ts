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

  constructor() {
    console.log("🔧 HoldstationService constructor - APENAS HISTÓRICO")
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

      // Usar o manager conforme documentação
      const result = await this.manager.getTransactionHistory(walletAddress, {
        offset,
        limit,
      })

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

      // Criar provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_CONFIG.rpcUrl, {
        chainId: WORLDCHAIN_CONFIG.chainId,
        name: WORLDCHAIN_CONFIG.name,
      })
      console.log("✅ Provider criado")

      // Aguardar rede
      const network = await this.provider.getNetwork()
      console.log(`✅ Rede conectada: ${network.name} (${network.chainId})`)

      // Criar client conforme documentação
      this.client = new Client(this.provider)
      console.log("✅ Client criado conforme docs")

      // Configurar config global conforme documentação
      this.config = config
      this.config.client = this.client
      console.log("✅ Config global definido")

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
        this.manager = new ManagerClass(this.client)
        console.log("✅ Manager criado conforme documentação")
      } else if (WalletHistoryClass) {
        this.manager = new WalletHistoryClass(this.client)
        console.log("✅ WalletHistory criado conforme documentação")
      } else {
        // Listar todas as classes disponíveis para debug
        console.log("🔍 Classes disponíveis em HoldstationModule:", Object.keys(HoldstationModule))
        console.log("🔍 Classes disponíveis em EthersModule:", Object.keys(EthersModule))
        throw new Error("Nenhuma classe de histórico encontrada nos módulos")
      }

      this.initialized = true
      console.log("✅ SDK inicializado APENAS para histórico!")
    } catch (error) {
      console.error("❌ Erro ao inicializar SDK:", error.message)
      console.error("Stack:", error.stack)
      this.initialized = false
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
