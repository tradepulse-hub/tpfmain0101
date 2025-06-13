import * as sdk from "@holdstation/worldchain-sdk"
import { ethers } from "ethers"
import type { Transaction } from "./types"

// Configuração da rede Worldchain conforme documentação
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
const CHAIN_ID = 480

// Tokens da wallet
const WALLET_TOKENS = {
  WLD: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
  TPF: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45",
  DNA: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113",
  WDD: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
}

class HoldstationHistoryService {
  private provider: ethers.providers.JsonRpcProvider | null = null
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

      // Setup exato conforme documentação
      this.provider = new ethers.providers.JsonRpcProvider(RPC_URL)

      // Inicializar o Manager conforme documentação
      this.managerHistory = new sdk.Manager(this.provider, CHAIN_ID)

      this.initialized = true
      console.log("✅ Holdstation History Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation History Service:", error)
    }
  }

  // Obter histórico de transações conforme documentação
  async getTransactionHistory(walletAddress: string, offset = 0, limit = 20): Promise<Transaction[]> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.managerHistory || !walletAddress) {
        console.warn("Manager or wallet address not available")
        return this.getMockTransactions(walletAddress)
      }

      console.log(`📜 Getting transaction history for: ${walletAddress} (offset: ${offset}, limit: ${limit})`)

      // Obter ou criar o walletHistory para este endereço
      let walletHistory = this.walletHistories.get(walletAddress)

      if (!walletHistory) {
        console.log(`Creating new wallet history for ${walletAddress}`)
        walletHistory = await this.managerHistory.wallet(walletAddress)
        this.walletHistories.set(walletAddress, walletHistory)
      }

      // Buscar transações usando o método find conforme documentação
      console.log(`Calling walletHistory.find(${offset}, ${limit})`)
      const fetchedTransactions = await walletHistory.find(offset, limit)
      console.log("Raw transactions from Holdstation:", fetchedTransactions)

      // Processar as transações para o formato esperado
      const processedTransactions = this.processTransactions(fetchedTransactions, walletAddress)

      console.log(`Found ${processedTransactions.length} processed transactions`)
      return processedTransactions
    } catch (error) {
      console.error("Error getting transaction history:", error)
      // Fallback para transações mock
      return this.getMockTransactions(walletAddress)
    }
  }

  // Configurar watcher para novas transações conforme documentação
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

      // Criar novo watcher seguindo exatamente a documentação
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

  // Métodos auxiliares
  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    if (tx.method?.toLowerCase().includes("swap")) {
      return "swap"
    }

    const from = tx.from?.toLowerCase()
    const to = tx.to?.toLowerCase()
    const wallet = walletAddress.toLowerCase()

    if (from === wallet) {
      return "send"
    } else if (to === wallet) {
      return "receive"
    }

    return "swap"
  }

  private getTokenInfoFromTransaction(tx: any): { symbol: string; address: string } | null {
    const tokenAddress = tx.tokenAddress || tx.contractAddress || tx.token

    if (!tokenAddress) {
      return null
    }

    for (const [symbol, address] of Object.entries(WALLET_TOKENS)) {
      if (address.toLowerCase() === tokenAddress.toLowerCase()) {
        return { symbol, address }
      }
    }

    return null
  }

  private getTransactionAmount(tx: any): string {
    if (tx.amount) {
      return tx.amount.toString()
    }

    if (tx.value) {
      if (tx.value.toString().length > 10) {
        return ethers.utils.formatEther(tx.value)
      }
      return tx.value.toString()
    }

    return "0"
  }

  // Transações mock para fallback
  private getMockTransactions(walletAddress: string): Transaction[] {
    return [
      {
        id: "1",
        hash: "0x123...abc",
        type: "receive",
        amount: "1000",
        tokenSymbol: "TPF",
        tokenAddress: WALLET_TOKENS.TPF,
        from: "0x456...def",
        to: walletAddress,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: "completed",
      },
      {
        id: "2",
        hash: "0x456...def",
        type: "send",
        amount: "500",
        tokenSymbol: "TPF",
        tokenAddress: WALLET_TOKENS.TPF,
        from: walletAddress,
        to: "0x789...ghi",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "completed",
      },
      {
        id: "3",
        hash: "0x789...ghi",
        type: "swap",
        amount: "100",
        tokenSymbol: "WLD",
        tokenAddress: WALLET_TOKENS.WLD,
        from: walletAddress,
        to: "0xabc...123",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
        status: "completed",
      },
    ]
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

export const holdstationHistoryService = new HoldstationHistoryService()

// Limpar watchers quando a página for fechada
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    holdstationHistoryService.cleanup()
  })
}
