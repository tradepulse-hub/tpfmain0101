import * as sdk from "@holdstation/worldchain-sdk"
import { ethers } from "ethers"

// Configuração da rede Worldchain
const provider = new ethers.providers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public");
const CHAIN_ID = 480

// Tokens da wallet (apenas os disponíveis)
const WALLET_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

export interface Transaction {
  id: string
  hash: string
  type: "send" | "receive" | "swap"
  amount: string
  tokenSymbol: string
  tokenAddress: string
  from: string
  to: string
  timestamp: Date
  status: "completed" | "pending" | "failed"
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
  value?: string
}

class HoldstationHistoryService {
  private provider: ethers.JsonRpcProvider | null = null
  private managerHistory: sdk.Manager | null = null
  private walletHistories: Map<string, any> = new Map()
  private initialized = false
  private watcherRefs: Map<string, any> = new Map()

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation History Service...")

      // Criar provider com a rede correta
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

      // Inicializar o Manager da Holdstation para histórico
      // Seguindo exatamente a documentação
      this.managerHistory = new sdk.Manager(this.provider, CHAIN_ID)

      this.initialized = true
      console.log("✅ Holdstation History Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation History Service:", error)
    }
  }

  // Método para obter o histórico de transações
  // Seguindo exatamente a documentação
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 20): Promise<Transaction[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.managerHistory || !walletAddress) {
        console.warn("Manager or wallet address not available")
        return []
      }

      console.log(`📜 Getting transaction history for: ${walletAddress} (offset: ${offset}, limit: ${limit})`)

      // Obter ou criar o walletHistory para este endereço
      let walletHistory = this.walletHistories.get(walletAddress)

      if (!walletHistory) {
        console.log(`Creating new wallet history for ${walletAddress}`)
        walletHistory = await this.managerHistory.wallet(walletAddress)
        this.walletHistories.set(walletAddress, walletHistory)
      }

      // Buscar transações usando o método find conforme a documentação
      console.log(`Calling walletHistory.find(${offset}, ${limit})`)
      const fetchedTransactions = await walletHistory.find(offset, limit)
      console.log("Raw transactions from Holdstation:", fetchedTransactions)

      // Processar as transações para o formato esperado
      const processedTransactions = this.processTransactions(fetchedTransactions, walletAddress)

      console.log(`Found ${processedTransactions.length} processed transactions`)
      return processedTransactions
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return []
    }
  }

  // Processar as transações brutas para o formato esperado
  private processTransactions(rawTransactions: any[], walletAddress: string): Transaction[] {
    if (!Array.isArray(rawTransactions)) {
      console.warn("Raw transactions is not an array:", rawTransactions)
      return []
    }

    const transactions: Transaction[] = []

    for (const tx of rawTransactions) {
      try {
        // Verificar se a transação tem dados mínimos necessários
        if (!tx || !tx.hash) {
          console.warn("Invalid transaction data:", tx)
          continue
        }

        // Determinar o tipo de transação e o token envolvido
        const type = this.determineTransactionType(tx, walletAddress)
        const tokenInfo = this.getTokenInfoFromTransaction(tx)

        // Se não for um token da wallet, pular
        if (!tokenInfo && type !== "swap") {
          continue
        }

        // Criar objeto de transação
        const transaction: Transaction = {
          id: tx.hash || `tx-${Date.now()}-${Math.random()}`,
          hash: tx.hash,
          type: type,
          amount: this.getTransactionAmount(tx),
          tokenSymbol: tokenInfo?.symbol || "TPF",
          tokenAddress: tokenInfo?.address || WALLET_TOKENS.TPF,
          from: tx.from || "",
          to: tx.to || "",
          timestamp: new Date(tx.timestamp ? tx.timestamp * 1000 : Date.now()),
          status: tx.blockNumber ? "completed" : "pending",
          blockNumber: tx.blockNumber,
        }

        transactions.push(transaction)
      } catch (error) {
        console.error("Error processing transaction:", error, tx)
      }
    }

    // Ordenar por timestamp (mais recente primeiro)
    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Determinar o tipo de transação
  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    // Se a transação tem um método específico de swap
    if (tx.method?.toLowerCase().includes("swap")) {
      return "swap"
    }

    // Verificar direção da transação
    const from = tx.from?.toLowerCase()
    const to = tx.to?.toLowerCase()
    const wallet = walletAddress.toLowerCase()

    if (from === wallet) {
      return "send"
    } else if (to === wallet) {
      return "receive"
    }

    // Fallback para swap se não conseguir determinar
    return "swap"
  }

  // Obter informações do token da transação
  private getTokenInfoFromTransaction(tx: any): { symbol: string; address: string } | null {
    // Verificar se a transação tem um token específico
    const tokenAddress = tx.tokenAddress || tx.contractAddress || tx.token

    if (!tokenAddress) {
      return null
    }

    // Verificar se é um dos tokens da wallet
    for (const [symbol, address] of Object.entries(WALLET_TOKENS)) {
      if (address.toLowerCase() === tokenAddress.toLowerCase()) {
        return { symbol, address }
      }
    }

    // Se não encontrou, retornar null
    return null
  }

  // Obter o valor da transação
  private getTransactionAmount(tx: any): string {
    if (tx.amount) {
      return tx.amount.toString()
    }

    if (tx.value) {
      // Converter de wei para ether se necessário
      if (tx.value.toString().length > 10) {
        return ethers.formatEther(tx.value)
      }
      return tx.value.toString()
    }

    return "0"
  }

  // Configurar watcher para novas transações
  // Seguindo exatamente a documentação
  async watchTransactions(
    walletAddress: string,
    callback: () => void,
  ): Promise<{ start: () => Promise<void>; stop: () => void } | null> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.managerHistory || !walletAddress) {
        console.warn("Manager or wallet address not available for watching")
        return null
      }

      console.log(`👀 Setting up transaction watcher for: ${walletAddress}`)

      // Parar watcher anterior se existir
      const existingWatcher = this.watcherRefs.get(walletAddress)
      if (existingWatcher) {
        existingWatcher.stop()
        this.watcherRefs.delete(walletAddress)
      }

      // Criar novo watcher usando a API da Holdstation
      // Seguindo exatamente a documentação
      const watcher = await this.managerHistory.watch(walletAddress, () => {
        console.log("🔔 New transaction detected for:", walletAddress)
        if (typeof callback === "function") {
          callback()
        }
      })

      // Salvar referência do watcher
      this.watcherRefs.set(walletAddress, watcher)

      return watcher
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
      return null
    }
  }

  // Obter transações de um token específico
  async getTokenTransactions(walletAddress: string, tokenSymbol: string, limit = 50): Promise<Transaction[]> {
    try {
      console.log(`📜 Getting ${tokenSymbol} transactions for: ${walletAddress}`)

      // Obter todas as transações
      const allTransactions = await this.getTransactionHistory(walletAddress, 0, limit)

      // Filtrar apenas transações do token específico
      const tokenTransactions = allTransactions.filter((tx) => tx.tokenSymbol === tokenSymbol)

      console.log(`Found ${tokenTransactions.length} ${tokenSymbol} transactions`)
      return tokenTransactions
    } catch (error) {
      console.error(`Error getting ${tokenSymbol} transactions:`, error)
      return []
    }
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Limpar todos os watchers ao destruir o serviço
  cleanup() {
    for (const [address, watcher] of this.watcherRefs) {
      try {
        watcher.stop()
        console.log("🛑 Cleaned up watcher for:", address)
      } catch (error) {
        console.error("Error cleaning up watcher:", error)
      }
    }
    this.watcherRefs.clear()
  }
}

// Exportar instância única
export const holdstationHistoryService = new HoldstationHistoryService()

// Limpar watchers quando a página for fechada
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    holdstationHistoryService.cleanup()
  })
}
