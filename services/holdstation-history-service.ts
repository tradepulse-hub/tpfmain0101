import * as sdk from "@holdstation/worldchain-sdk"
import { ethers } from "ethers"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"
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
  private walletHistory: any = null
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
      this.managerHistory = new sdk.Manager(this.provider, CHAIN_ID)

      this.initialized = true
      console.log("✅ Holdstation History Service initialized successfully!")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation History Service:", error)
    }
  }

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

      // Obter o histórico da wallet usando a API da Holdstation
      if (!this.walletHistory) {
        this.walletHistory = await this.managerHistory.wallet(walletAddress)
      }

      const fetchedTransactions = await this.walletHistory.find(offset, limit)
      console.log("Raw transactions from Holdstation:", fetchedTransactions)

      // Filtrar e processar apenas transações dos tokens da wallet
      const processedTransactions = this.processTransactions(fetchedTransactions, walletAddress)

      console.log(`Found ${processedTransactions.length} wallet token transactions`)
      return processedTransactions
    } catch (error) {
      console.error("Error getting transaction history:", error)
      return []
    }
  }

  private processTransactions(rawTransactions: any[], walletAddress: string): Transaction[] {
    const transactions: Transaction[] = []

    for (const tx of rawTransactions) {
      try {
        // Verificar se a transação envolve tokens da wallet
        const tokenInfo = this.getTokenInfoFromTransaction(tx)
        if (!tokenInfo) {
          continue // Pular transações que não são dos tokens da wallet
        }

        const transaction: Transaction = {
          id: tx.hash || tx.id || `${tx.blockNumber}-${tx.transactionIndex}`,
          hash: tx.hash,
          type: this.determineTransactionType(tx, walletAddress),
          amount: this.formatAmount(tx.value || tx.amount, tokenInfo.decimals),
          tokenSymbol: tokenInfo.symbol,
          tokenAddress: tokenInfo.address,
          from: tx.from,
          to: tx.to,
          timestamp: new Date(tx.timestamp * 1000 || Date.now()),
          status: this.getTransactionStatus(tx),
          blockNumber: tx.blockNumber,
          gasUsed: tx.gasUsed?.toString(),
          gasPrice: tx.gasPrice?.toString(),
          value: tx.value?.toString(),
        }

        transactions.push(transaction)
      } catch (error) {
        console.error("Error processing transaction:", error, tx)
      }
    }

    // Ordenar por timestamp (mais recente primeiro)
    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private getTokenInfoFromTransaction(tx: any): { symbol: string; address: string; decimals: number } | null {
    // Verificar se a transação envolve algum token da wallet
    const tokenAddress = tx.tokenAddress || tx.contractAddress || tx.to

    if (!tokenAddress) {
      return null
    }

    // Procurar o token nos tokens da wallet
    for (const [symbol, address] of Object.entries(WALLET_TOKENS)) {
      if (address.toLowerCase() === tokenAddress.toLowerCase()) {
        return {
          symbol,
          address,
          decimals: 18, // Todos os tokens da wallet usam 18 decimais
        }
      }
    }

    return null
  }

  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    const from = tx.from?.toLowerCase()
    const to = tx.to?.toLowerCase()
    const wallet = walletAddress.toLowerCase()

    // Verificar se é um swap (pode ter múltiplas transferências)
    if (tx.type === "swap" || tx.method === "swap" || tx.functionName?.includes("swap")) {
      return "swap"
    }

    // Verificar direção da transação
    if (from === wallet) {
      return "send"
    } else if (to === wallet) {
      return "receive"
    }

    // Fallback baseado no valor
    return "receive"
  }

  private formatAmount(amount: string | number, decimals: number): string {
    try {
      if (!amount) return "0"

      const amountStr = amount.toString()
      if (amountStr === "0") return "0"

      // Se o valor já está formatado (contém ponto decimal)
      if (amountStr.includes(".")) {
        return Number.parseFloat(amountStr).toString()
      }

      // Converter de wei para unidade normal
      const formatted = ethers.formatUnits(amountStr, decimals)
      return Number.parseFloat(formatted).toString()
    } catch (error) {
      console.error("Error formatting amount:", error)
      return "0"
    }
  }

  private getTransactionStatus(tx: any): "completed" | "pending" | "failed" {
    if (tx.status === "0" || tx.status === 0) {
      return "failed"
    }

    if (tx.blockNumber && tx.blockNumber > 0) {
      return "completed"
    }

    return "pending"
  }

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
      const watcher = await this.managerHistory.watch(walletAddress, () => {
        console.log("🔔 New transaction detected for:", walletAddress)
        callback()
      })

      // Salvar referência do watcher
      this.watcherRefs.set(walletAddress, watcher)

      return {
        start: async () => {
          try {
            await watcher.start()
            console.log("✅ Transaction watcher started for:", walletAddress)
          } catch (error) {
            console.error("Error starting transaction watcher:", error)
          }
        },
        stop: () => {
          try {
            watcher.stop()
            this.watcherRefs.delete(walletAddress)
            console.log("🛑 Transaction watcher stopped for:", walletAddress)
          } catch (error) {
            console.error("Error stopping transaction watcher:", error)
          }
        },
      }
    } catch (error) {
      console.error("Error setting up transaction watcher:", error)
      return null
    }
  }

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
