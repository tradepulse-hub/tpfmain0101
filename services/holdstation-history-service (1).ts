import { holdstationService } from "./holdstation-service"
import type { Transaction as HoldstationTransaction } from "./types"
import { ethers } from "ethers"

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  status: "success" | "pending" | "failed"
  type: "SEND" | "RECEIVE" | "SWAP"
  token: {
    symbol: string
    address: string
    decimals: number
  }
  gasUsed?: string
  gasPrice?: string
}

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
      // Worldchain RPC
      this.provider = new ethers.JsonRpcProvider("https://worldchain-mainnet.g.alchemy.com/public")
      console.log("✅ Holdstation History Provider initialized")
    } catch (error) {
      console.error("❌ Failed to initialize provider:", error)
    }
  }

  private addDebugLog(message: string) {
    console.log(message)
    this.debugLogs.push(`${new Date().toLocaleTimeString()}: ${message}`)
    // Manter apenas os últimos 100 logs
    if (this.debugLogs.length > 100) {
      this.debugLogs = this.debugLogs.slice(-100)
    }
  }

  getDebugLogs(): string[] {
    return [...this.debugLogs]
  }

  async watchTransactions(
    walletAddress: string,
    callback?: (transactions: HoldstationTransaction[]) => void,
  ): Promise<{ start: () => Promise<void>; stop: () => Promise<void> }> {
    try {
      this.addDebugLog(`🔍 Configurando watcher para: ${walletAddress}`)

      const manager = holdstationService.getManager()
      if (!manager) {
        this.addDebugLog("❌ Manager do Holdstation não disponível")
        throw new Error("Manager not available")
      }

      this.addDebugLog("✅ Manager do Holdstation disponível")

      // Stop existing watcher if any
      if (this.watchers.has(walletAddress)) {
        this.addDebugLog("🛑 Parando watcher existente...")
        await this.watchers.get(walletAddress)?.stop()
        this.watchers.delete(walletAddress)
      }

      // Get current block for starting point - buscar mais blocos (últimos 7 dias)
      this.addDebugLog("📊 Obtendo número do bloco atual...")

      let currentBlock = 0
      try {
        if (manager.client && typeof manager.client.getBlockNumber === "function") {
          currentBlock = await manager.client.getBlockNumber()
        } else if (this.provider) {
          currentBlock = await this.provider.getBlockNumber()
        } else {
          throw new Error("No provider available")
        }
      } catch (blockError) {
        this.addDebugLog(`⚠️ Erro ao obter bloco atual: ${blockError.message}`)
        // Usar um bloco padrão recente
        currentBlock = 12000000
      }

      // Worldchain tem ~2 segundos por bloco, então 7 dias = ~302,400 blocos
      const blocksPerDay = 43200 // 24h * 60m * 60s / 2s
      const daysToSearch = 7
      const blocksToSearch = blocksPerDay * daysToSearch

      const fromBlock = Math.max(0, currentBlock - blocksToSearch)
      const toBlock = currentBlock

      this.addDebugLog(
        `📊 Monitorando blocos ${fromBlock} até ${toBlock} (${blocksToSearch} blocos = ${daysToSearch} dias)`,
      )

      // Setup watcher
      this.addDebugLog("⚙️ Configurando watcher...")

      let watcher = null
      try {
        if (typeof manager.watch === "function") {
          watcher = await manager.watch(walletAddress, fromBlock, toBlock)
        } else if (typeof manager.createWatcher === "function") {
          watcher = await manager.createWatcher(walletAddress, fromBlock, toBlock)
        } else {
          throw new Error("No watch method available")
        }
      } catch (watchError) {
        this.addDebugLog(`⚠️ Erro ao criar watcher: ${watchError.message}`)
        // Criar um watcher mock que não faz nada
        watcher = {
          start: async () => {
            this.addDebugLog("🔄 Mock watcher started")
          },
          stop: async () => {
            this.addDebugLog("🛑 Mock watcher stopped")
          },
        }
      }

      // Store watcher
      this.watchers.set(walletAddress, watcher)
      this.addDebugLog("✅ Watcher configurado e armazenado")

      return watcher
    } catch (error) {
      this.addDebugLog(`❌ Erro ao configurar watcher: ${error.message}`)
      console.error("Error setting up transaction watcher:", error)
      throw error
    }
  }

  async getTransactionHistory(walletAddress: string, offset = 0, limit = 50): Promise<Transaction[]> {
    if (!this.provider) {
      console.error("❌ Provider not initialized")
      return []
    }

    try {
      console.log(`🔍 Buscando histórico real para: ${walletAddress}`)

      // Buscar transações recentes
      const latestBlock = await this.provider.getBlockNumber()
      const transactions: Transaction[] = []

      // Buscar nas últimas 1000 blocks
      const fromBlock = Math.max(0, latestBlock - 1000)

      console.log(`📊 Buscando do block ${fromBlock} ao ${latestBlock}`)

      // Buscar transações enviadas
      const sentTxs = await this.provider.getLogs({
        fromBlock,
        toBlock: latestBlock,
        topics: [
          ethers.id("Transfer(address,address,uint256)"), // ERC20 Transfer event
          ethers.zeroPadValue(walletAddress, 32), // from address
        ],
      })

      // Buscar transações recebidas
      const receivedTxs = await this.provider.getLogs({
        fromBlock,
        toBlock: latestBlock,
        topics: [
          ethers.id("Transfer(address,address,uint256)"), // ERC20 Transfer event
          null, // any from address
          ethers.zeroPadValue(walletAddress, 32), // to address
        ],
      })

      // Processar transações enviadas
      for (const log of sentTxs.slice(0, limit / 2)) {
        try {
          const tx = await this.provider.getTransaction(log.transactionHash)
          const receipt = await this.provider.getTransactionReceipt(log.transactionHash)
          const block = await this.provider.getBlock(log.blockNumber)

          if (tx && receipt && block) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to || "",
              value: ethers.formatEther(tx.value),
              timestamp: block.timestamp * 1000,
              status: receipt.status === 1 ? "success" : "failed",
              type: "SEND",
              token: {
                symbol: "WLD", // Default, seria melhor buscar do contrato
                address: log.address,
                decimals: 18,
              },
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: tx.gasPrice?.toString(),
            })
          }
        } catch (error) {
          console.error("Error processing sent tx:", error)
        }
      }

      // Processar transações recebidas
      for (const log of receivedTxs.slice(0, limit / 2)) {
        try {
          const tx = await this.provider.getTransaction(log.transactionHash)
          const receipt = await this.provider.getTransactionReceipt(log.transactionHash)
          const block = await this.provider.getBlock(log.blockNumber)

          if (tx && receipt && block) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to || "",
              value: ethers.formatEther(tx.value),
              timestamp: block.timestamp * 1000,
              status: receipt.status === 1 ? "success" : "failed",
              type: "RECEIVE",
              token: {
                symbol: "WLD",
                address: log.address,
                decimals: 18,
              },
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: tx.gasPrice?.toString(),
            })
          }
        } catch (error) {
          console.error("Error processing received tx:", error)
        }
      }

      // Ordenar por timestamp (mais recente primeiro)
      transactions.sort((a, b) => b.timestamp - a.timestamp)

      console.log(`✅ ${transactions.length} transações reais encontradas`)
      return transactions.slice(0, limit)
    } catch (error) {
      console.error("❌ Error fetching transaction history:", error)
      return []
    }
  }

  private async getFromBlockchainAllTokens(walletAddress: string, limit: number): Promise<Transaction[]> {
    this.addDebugLog("🔍 Buscando TODOS os tokens na blockchain...")

    if (!this.provider) {
      throw new Error("Provider not available")
    }

    const allTransactions: Transaction[] = []

    try {
      // Buscar blocos recentes
      const currentBlock = await this.provider.getBlockNumber()
      const blocksToCheck = 2000 // Aumentar para 2000 blocos para encontrar mais transações

      this.addDebugLog(`📊 Verificando blocos ${currentBlock - blocksToCheck} até ${currentBlock}`)

      // Para cada token, buscar transações RECEBIDAS e ENVIADAS
      for (const tokenAddress of this.TOKEN_ADDRESSES) {
        const tokenSymbol = this.getTokenSymbolFromAddress(tokenAddress)
        this.addDebugLog(`🔍 Buscando transações de ${tokenSymbol} (${tokenAddress})...`)

        try {
          // Buscar transações RECEBIDAS (TO = nossa carteira)
          const receivedTxs = await this.getTokenTransactions(
            walletAddress,
            tokenAddress,
            "received",
            currentBlock - blocksToCheck,
            currentBlock,
          )
          this.addDebugLog(`📥 ${tokenSymbol} RECEBIDAS: ${receivedTxs.length}`)
          allTransactions.push(...receivedTxs)

          // Buscar transações ENVIADAS (FROM = nossa carteira)
          const sentTxs = await this.getTokenTransactions(
            walletAddress,
            tokenAddress,
            "sent",
            currentBlock - blocksToCheck,
            currentBlock,
          )
          this.addDebugLog(`📤 ${tokenSymbol} ENVIADAS: ${sentTxs.length}`)
          allTransactions.push(...sentTxs)
        } catch (tokenError) {
          this.addDebugLog(`⚠️ Erro ao buscar ${tokenSymbol}: ${tokenError.message}`)
        }
      }

      this.addDebugLog(`✅ Blockchain: encontradas ${allTransactions.length} transações de todos os tokens`)
      return allTransactions
    } catch (error) {
      this.addDebugLog(`❌ Erro na busca blockchain: ${error.message}`)
      throw error
    }
  }

  private async getTokenTransactions(
    walletAddress: string,
    tokenAddress: string,
    direction: "received" | "sent",
    fromBlock: number,
    toBlock: number,
  ): Promise<Transaction[]> {
    if (!this.provider) return []

    const transactions: Transaction[] = []

    try {
      // Configurar filtro baseado na direção
      const filter = {
        address: tokenAddress, // Filtrar apenas este token
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event
          direction === "sent" ? ethers.zeroPadValue(walletAddress, 32) : null, // from
          direction === "received" ? ethers.zeroPadValue(walletAddress, 32) : null, // to
        ],
        fromBlock,
        toBlock,
      }

      const logs = await this.provider.getLogs(filter)
      this.addDebugLog(`📊 ${direction} logs para ${this.getTokenSymbolFromAddress(tokenAddress)}: ${logs.length}`)

      for (const log of logs) {
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
      this.addDebugLog(`❌ Erro ao buscar ${direction} para ${tokenAddress}: ${error.message}`)
      return []
    }
  }

  private async parseTransferLog(log: any, walletAddress: string): Promise<Transaction | null> {
    try {
      if (!this.provider) return null

      // Decodificar o log de transferência
      const iface = new ethers.Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"])

      const decoded = iface.parseLog(log)
      if (!decoded) return null

      const [from, to, value] = decoded.args

      // Buscar detalhes da transação
      const txDetails = await this.provider.getTransaction(log.transactionHash)
      if (!txDetails) return null

      // Determinar tipo de transação
      const isReceiving = to.toLowerCase() === walletAddress.toLowerCase()
      const type = isReceiving ? "receive" : "send"

      // Mapear endereço do token para símbolo
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
        timestamp: new Date(txDetails.timestamp ? txDetails.timestamp * 1000 : Date.now()),
        status: "completed",
        blockNumber: log.blockNumber,
      }
    } catch (error) {
      this.addDebugLog(`❌ Erro ao parsear log: ${error.message}`)
      return null
    }
  }

  private async getFromWorldscan(walletAddress: string, limit: number): Promise<Transaction[]> {
    this.addDebugLog("🔍 Tentando Worldscan API...")

    try {
      // Tentar buscar via API do Worldscan (se disponível)
      const response = await fetch(
        `https://worldscan.org/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&limit=${limit}`,
      )

      if (!response.ok) {
        throw new Error(`Worldscan API error: ${response.status}`)
      }

      const data = await response.json()
      this.addDebugLog(`📊 Worldscan response: ${JSON.stringify(data).substring(0, 200)}...`)

      if (data.status === "1" && data.result) {
        return data.result.map((tx: any) => this.formatWorldscanTransaction(tx, walletAddress))
      }

      throw new Error("No data from Worldscan")
    } catch (error) {
      this.addDebugLog(`❌ Worldscan API falhou: ${error.message}`)
      throw error
    }
  }

  private formatWorldscanTransaction(tx: any, walletAddress: string): Transaction {
    const isReceiving = tx.to.toLowerCase() === walletAddress.toLowerCase()
    const type = isReceiving ? "receive" : "send"

    return {
      id: tx.hash,
      hash: tx.hash,
      type,
      amount: ethers.formatEther(tx.value),
      tokenSymbol: "WLD", // Assumir WLD para transações nativas
      tokenAddress: "0x0000000000000000000000000000000000000000",
      from: tx.from,
      to: tx.to,
      timestamp: new Date(Number.parseInt(tx.timeStamp) * 1000),
      status: tx.isError === "0" ? "completed" : "failed",
      blockNumber: Number.parseInt(tx.blockNumber),
    }
  }

  private getTokenSymbolFromAddress(address: string): string {
    const normalizedAddress = address.toLowerCase()
    const symbol = this.TOKEN_ADDRESS_MAP[normalizedAddress]
    return symbol || "UNKNOWN"
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

  private async generateDiverseMockTransactions(walletAddress: string, limit: number): Promise<Transaction[]> {
    this.addDebugLog("📝 Gerando transações diversas para demonstrar todos os tokens...")

    const now = Date.now()
    const transactions: Transaction[] = []

    // Gerar transações para cada token com base no limite
    const tokens = [
      { symbol: "TPF", address: "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45" },
      { symbol: "WLD", address: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003" },
      { symbol: "DNA", address: "0xED49fE44fD4249A09843C2Ba4bba7e50BECa7113" },
      { symbol: "WDD", address: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" },
    ]

    let transactionIndex = 0
    const transactionsPerToken = Math.ceil(limit / tokens.length / 2) // Dividir entre tokens e tipos

    for (const token of tokens) {
      // Para cada token, gerar transações de SEND e RECEIVE
      const types: ("send" | "receive")[] = ["receive", "send"]

      for (const type of types) {
        for (let i = 0; i < transactionsPerToken && transactionIndex < limit; i++) {
          const daysAgo = Math.random() * 7
          const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000)

          const amounts = {
            TPF: ["1.0", "100.0", "1000.0", "5000.0"],
            WLD: ["0.5", "2.0", "10.0", "25.0"],
            DNA: ["50.0", "500.0", "2000.0", "10000.0"],
            WDD: ["5.0", "25.0", "100.0", "500.0"],
          }

          const amount = amounts[token.symbol as keyof typeof amounts][Math.floor(Math.random() * 4)]

          transactions.push({
            id: `mock_${token.symbol}_${type}_${transactionIndex++}`,
            hash: `0x${Math.random().toString(16).substring(2, 66)}`,
            type,
            amount,
            tokenSymbol: token.symbol,
            tokenAddress: token.address,
            from: type === "receive" ? this.generateRandomAddress() : walletAddress,
            to: type === "send" ? this.generateRandomAddress() : walletAddress,
            timestamp,
            status: "completed",
            blockNumber: Math.floor(Math.random() * 1000000) + 12000000,
          })
        }
      }
    }

    // Adicionar algumas transações de SWAP
    const swapCount = Math.min(3, Math.floor(limit / 10))
    for (let i = 0; i < swapCount; i++) {
      const daysAgo = Math.random() * 7
      const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000)

      transactions.push({
        id: `mock_swap_${i}`,
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        type: "swap",
        amount: "100.0",
        tokenSymbol: tokens[Math.floor(Math.random() * tokens.length)].symbol,
        tokenAddress: tokens[Math.floor(Math.random() * tokens.length)].address,
        from: walletAddress,
        to: this.generateRandomAddress(),
        timestamp,
        status: "completed",
        blockNumber: Math.floor(Math.random() * 1000000) + 12000000,
      })
    }

    // Ordenar por timestamp
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    this.addDebugLog(`✅ Geradas ${transactions.length} transações diversas`)
    this.addDebugLog(`📊 Tokens incluídos: ${tokens.map((t) => t.symbol).join(", ")}`)
    this.addDebugLog(`📊 Tipos incluídos: RECEIVE, SEND, SWAP`)

    return transactions
  }

  private generateRandomAddress(): string {
    return `0x${Math.random().toString(16).substring(2, 42).padStart(40, "0")}`
  }

  private formatHoldstationTransactions(transactions: any[], walletAddress: string): HoldstationTransaction[] {
    return transactions.map((tx, index) => {
      this.addDebugLog(`Processando transação Holdstation ${index + 1}/${transactions.length}: ${tx.hash}`)

      const formatted = {
        id: tx.hash || `tx_${index}`,
        hash: tx.hash || "",
        type: this.determineTransactionType(tx, walletAddress),
        amount: this.extractAmount(tx, walletAddress),
        tokenSymbol: this.extractTokenSymbol(tx),
        tokenAddress: this.extractTokenAddress(tx),
        from: this.extractFrom(tx, walletAddress),
        to: this.extractTo(tx, walletAddress),
        timestamp: tx.date || new Date(tx.block * 1000),
        status: tx.success === 2 ? "completed" : tx.success === 1 ? "failed" : "pending",
        blockNumber: tx.block,
      }

      this.addDebugLog(`✅ Transação formatada: ${formatted.type} ${formatted.amount} ${formatted.tokenSymbol}`)
      return formatted
    })
  }

  private determineTransactionType(tx: any, walletAddress: string): "send" | "receive" | "swap" {
    if (tx.transfers && tx.transfers.length > 1) {
      return "swap"
    }

    if (tx.transfers && tx.transfers.length === 1) {
      const transfer = tx.transfers[0]
      const isReceiving = transfer.to.toLowerCase().includes(walletAddress.toLowerCase())
      return isReceiving ? "receive" : "send"
    }

    return "send"
  }

  private extractAmount(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const transfer = tx.transfers[0]
      return (Number.parseFloat(transfer.amount) / Math.pow(10, 18)).toFixed(6)
    }
    return "0"
  }

  private extractTokenSymbol(tx: any): string {
    if (tx.transfers && tx.transfers.length > 0) {
      const tokenAddress = tx.transfers[0].tokenAddress
      const symbol = this.getTokenSymbolFromAddress(tokenAddress)
      return symbol
    }
    return "ETH"
  }

  private extractTokenAddress(tx: any): string {
    if (tx.transfers && tx.transfers.length > 0) {
      return tx.transfers[0].tokenAddress
    }
    return "0x0000000000000000000000000000000000000000"
  }

  private extractFrom(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      return tx.transfers[0].from
    }
    return tx.from || ""
  }

  private extractTo(tx: any, walletAddress: string): string {
    if (tx.transfers && tx.transfers.length > 0) {
      return tx.transfers[0].to
    }
    return tx.to || ""
  }

  async stopWatching(walletAddress: string): Promise<void> {
    try {
      const watcher = this.watchers.get(walletAddress)
      if (watcher) {
        this.addDebugLog(`🛑 Parando watcher para: ${walletAddress}`)
        await watcher.stop()
        this.watchers.delete(walletAddress)
        this.addDebugLog(`✅ Watcher parado com sucesso`)
      }
    } catch (error) {
      this.addDebugLog(`❌ Erro ao parar watcher: ${error.message}`)
      console.error("Error stopping transaction watcher:", error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.addDebugLog(`🧹 Iniciando limpeza de ${this.watchers.size} watchers...`)
      for (const [address, watcher] of this.watchers) {
        await watcher.stop()
      }
      this.watchers.clear()
      this.addDebugLog("✅ Limpeza concluída")
    } catch (error) {
      this.addDebugLog(`❌ Erro durante limpeza: ${error.message}`)
      console.error("Error during cleanup:", error)
    }
  }
}

export const holdstationHistoryService = new HoldstationHistoryService()
