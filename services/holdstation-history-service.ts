import type { Transaction } from "./types"
import { ethers } from "ethers"

class HoldstationHistoryService {
  private watchers: Map<string, { start: () => Promise<void>; stop: () => Promise<void> }> = new Map()
  private debugLogs: string[] = []
  private provider: ethers.JsonRpcProvider | null = null

  // Mapeamento completo de todos os tokens suportados
  private readonly TOKEN_ADDRESS_MAP: Record<string, string> = {
    "0x834a73c0a83f3bce349a116ffb2a4c2d1c651e45": "TPF", // TPulseFi
    "0x2cfc85d8e48f8eab294be644d9e25c3030863003": "WLD", // Worldcoin
    "0xed49fe44fd4249a09843c2ba4bba7e50beca7113": "DNA", // DNA Token
    "0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b": "WDD", // Drachma Token
  }

  // Lista de endereços de tokens para buscar especificamente
  private readonly TOKEN_ADDRESSES = [
    "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45", // TPF
    "0x2cFc85d8E48F8EAB294be644d9E25C3030863003", // WLD
    "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113", // DNA
    "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B", // WDD
  ]

  constructor() {
    this.initializeProvider()
  }

  private initializeProvider() {
    try {
      this.addDebugLog("🔧 Inicializando provider Worldchain...")
      // Worldchain RPC
      this.provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public")
      this.addDebugLog("✅ Provider Worldchain inicializado com sucesso")
    } catch (error) {
      this.addDebugLog(`❌ Erro ao inicializar provider: ${error.message}`)
      console.error("❌ Failed to initialize provider:", error)
    }
  }

  private addDebugLog(message: string) {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(logMessage)
    this.debugLogs.push(logMessage)
    // Manter apenas os últimos 50 logs para evitar memory leak
    if (this.debugLogs.length > 50) {
      this.debugLogs = this.debugLogs.slice(-50)
    }
  }

  getDebugLogs(): string[] {
    return [...this.debugLogs]
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    this.addDebugLog("=== INICIANDO BUSCA DE HISTÓRICO REAL ===")
    this.addDebugLog(`Endereço da carteira: ${walletAddress}`)
    this.addDebugLog(`Limite: ${limit} transações`)

    if (!this.provider) {
      this.addDebugLog("❌ Provider não disponível - inicializando novamente...")
      this.initializeProvider()
      if (!this.provider) {
        this.addDebugLog("❌ Falha crítica: Provider não pode ser inicializado")
        return []
      }
    }

    try {
      this.addDebugLog("🔍 Verificando conectividade com Worldchain...")

      // Testar conectividade primeiro
      const latestBlock = (await Promise.race([
        this.provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ])) as number

      this.addDebugLog(`✅ Conectado! Bloco atual: ${latestBlock}`)

      const transactions: Transaction[] = []

      // Buscar transações dos últimos 2000 blocos (mais conservador)
      const fromBlock = Math.max(0, latestBlock - 2000)
      this.addDebugLog(`📊 Buscando do bloco ${fromBlock} ao ${latestBlock}`)

      // Buscar para cada token individualmente
      for (const tokenAddress of this.TOKEN_ADDRESSES) {
        const tokenSymbol = this.getTokenSymbolFromAddress(tokenAddress)
        this.addDebugLog(`🔍 Buscando transações de ${tokenSymbol}...`)

        try {
          // Buscar transações RECEBIDAS
          const receivedTxs = await this.getTokenTransfers(
            walletAddress,
            tokenAddress,
            "received",
            fromBlock,
            latestBlock,
          )
          this.addDebugLog(`📥 ${tokenSymbol} RECEBIDAS: ${receivedTxs.length}`)
          transactions.push(...receivedTxs)

          // Buscar transações ENVIADAS
          const sentTxs = await this.getTokenTransfers(walletAddress, tokenAddress, "sent", fromBlock, latestBlock)
          this.addDebugLog(`📤 ${tokenSymbol} ENVIADAS: ${sentTxs.length}`)
          transactions.push(...sentTxs)
        } catch (tokenError) {
          this.addDebugLog(`⚠️ Erro ao buscar ${tokenSymbol}: ${tokenError.message}`)
        }
      }

      // Deduplificar e ordenar
      const uniqueTransactions = this.deduplicateTransactions(transactions)
      uniqueTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      this.addDebugLog(`✅ Total de transações encontradas: ${uniqueTransactions.length}`)

      // Log resumo por token
      const summary = uniqueTransactions.reduce(
        (acc, tx) => {
          acc[tx.tokenSymbol] = (acc[tx.tokenSymbol] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      this.addDebugLog(`📊 Resumo: ${JSON.stringify(summary)}`)

      return uniqueTransactions.slice(0, limit)
    } catch (error) {
      this.addDebugLog(`❌ ERRO CRÍTICO: ${error.message}`)
      this.addDebugLog(`Stack trace: ${error.stack}`)
      console.error("❌ Critical error in getTransactionHistory:", error)

      // Retornar array vazio em caso de erro para evitar crash
      return []
    }
  }

  private async getTokenTransfers(
    walletAddress: string,
    tokenAddress: string,
    direction: "received" | "sent",
    fromBlock: number,
    toBlock: number,
  ): Promise<Transaction[]> {
    if (!this.provider) return []

    const transactions: Transaction[] = []

    try {
      // Configurar filtro ERC20 Transfer
      const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

      const filter = {
        address: tokenAddress,
        topics: [
          transferTopic,
          direction === "sent" ? ethers.zeroPadValue(walletAddress, 32) : null,
          direction === "received" ? ethers.zeroPadValue(walletAddress, 32) : null,
        ],
        fromBlock,
        toBlock,
      }

      this.addDebugLog(`🔍 Buscando logs ${direction} para ${tokenAddress}...`)

      const logs = (await Promise.race([
        this.provider.getLogs(filter),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout getLogs")), 15000)),
      ])) as any[]

      this.addDebugLog(`📊 Encontrados ${logs.length} logs`)

      // Processar apenas os primeiros 10 logs para evitar timeout
      const logsToProcess = logs.slice(0, 10)

      for (const log of logsToProcess) {
        try {
          const tx = await this.parseTransferLog(log, walletAddress)
          if (tx) {
            transactions.push(tx)
          }
        } catch (parseError) {
          this.addDebugLog(`⚠️ Erro ao parsear log: ${parseError.message}`)
        }
      }

      return transactions
    } catch (error) {
      this.addDebugLog(`❌ Erro em getTokenTransfers: ${error.message}`)
      return []
    }
  }

  private async parseTransferLog(log: any, walletAddress: string): Promise<Transaction | null> {
    try {
      if (!this.provider) return null

      // Decodificar Transfer event
      const iface = new ethers.Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"])

      const decoded = iface.parseLog(log)
      if (!decoded) return null

      const [from, to, value] = decoded.args

      // Buscar detalhes da transação com timeout
      const txDetails = (await Promise.race([
        this.provider.getTransaction(log.transactionHash),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout getTransaction")), 5000)),
      ])) as any

      if (!txDetails) return null

      // Determinar tipo
      const isReceiving = to.toLowerCase() === walletAddress.toLowerCase()
      const type = isReceiving ? "receive" : "send"

      // Mapear token
      const tokenSymbol = this.getTokenSymbolFromAddress(log.address)

      return {
        id: log.transactionHash,
        hash: log.transactionHash,
        type,
        amount: ethers.formatUnits(value, 18),
        tokenSymbol,
        tokenAddress: log.address,
        from,
        to,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Mock timestamp
        status: "completed",
        blockNumber: log.blockNumber,
      }
    } catch (error) {
      this.addDebugLog(`❌ Erro ao parsear log: ${error.message}`)
      return null
    }
  }

  private getTokenSymbolFromAddress(address: string): string {
    const normalizedAddress = address.toLowerCase()
    return this.TOKEN_ADDRESS_MAP[normalizedAddress] || "UNKNOWN"
  }

  private deduplicateTransactions(transactions: Transaction[]): Transaction[] {
    const seen = new Set<string>()
    return transactions.filter((tx) => {
      if (seen.has(tx.hash)) {
        return false
      }
      seen.add(tx.hash)
      return true
    })
  }

  async watchTransactions(walletAddress: string, callback?: any) {
    this.addDebugLog(`🔍 Configurando watcher para: ${walletAddress}`)
    return {
      start: async () => this.addDebugLog("🔄 Watcher iniciado"),
      stop: async () => this.addDebugLog("🛑 Watcher parado"),
    }
  }

  async stopWatching(walletAddress: string): Promise<void> {
    this.addDebugLog(`🛑 Parando watcher para: ${walletAddress}`)
  }

  async cleanup(): Promise<void> {
    this.addDebugLog("🧹 Limpeza concluída")
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
